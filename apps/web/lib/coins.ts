import { cmsDb } from './cms-db'

export async function deductCoins(
  accountId: number,
  drAmount: number,
  description: string,
  tx?: any
): Promise<{ success: boolean; error?: string; newBalance?: { dr: number; dm: number } }> {
  const client = tx || cmsDb

  try {
    // 1. Balance laden → prüfen ob genug DR vorhanden
    const balance = await client.coinBalance.findUnique({
      where: { accountId },
    })

    const currentDr = balance?.dr ?? 0
    if (currentDr < drAmount) {
      return { success: false, error: 'Nicht genügend Dragon Coins (DR)' }
    }

    // 2. DR abbuchen
    await client.coinBalance.update({
      where: { accountId },
      data: {
        dr: { decrement: drAmount },
      },
    })

    // 3. CoinTransaction create (type: DR, reason: SHOP_BUY, amount: -drAmount)
    await client.coinTransaction.create({
      data: {
        accountId,
        type: 'DR',
        amount: -drAmount,
        reason: 'SHOP_BUY',
        description,
      },
    })

    // 4. DM-Cashback berechnen
    const cashbackSetting = await client.setting.findUnique({
      where: { key: 'dm_cashback_percent' },
    })
    const percent = parseInt(cashbackSetting?.value || '0', 10)
    let dmAmount = 0

    if (percent > 0) {
      dmAmount = Math.floor((drAmount * percent) / 100)
      if (dmAmount > 0) {
        // DM gutschreiben
        await client.coinBalance.update({
          where: { accountId },
          data: {
            dm: { increment: dmAmount },
          },
        })

        // CoinTransaction create (type: DM, reason: DM_CASHBACK, amount: +dmAmount)
        await client.coinTransaction.create({
          data: {
            accountId,
            type: 'DM',
            amount: dmAmount,
            reason: 'DM_CASHBACK',
            description: `DM Cashback für Shop-Kauf: ${description}`,
          },
        })
      }
    }

    // 5. Neue Balance laden
    const finalBalance = await client.coinBalance.findUnique({
      where: { accountId },
    })

    return {
      success: true,
      newBalance: {
        dr: finalBalance?.dr ?? 0,
        dm: finalBalance?.dm ?? 0,
      },
    }
  } catch (error) {
    console.error('Error in deductCoins:', error)
    return { success: false, error: 'Fehler bei der Münzabbuchung' }
  }
}
