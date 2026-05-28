import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'
import { gameDb } from '@/lib/game-db'
import { deductCoins } from '@/lib/coins'
import { z } from 'zod'

const buySchema = z.object({
  shopItemId: z.string(),
  characterName: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = buySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const { shopItemId, characterName } = validation.data
    const accountId = session.user.accountId

    // 1. Verify character ownership in GameDB (if DB online)
    let characterVerified = false
    try {
      const players = await gameDb.$queryRaw<any[]>`
        SELECT id, name FROM player
        WHERE account_id = ${accountId} AND name = ${characterName}
        LIMIT 1
      `
      if (players && players.length > 0) {
        characterVerified = true
      }
    } catch (gameDbError) {
      console.warn('[itemshop/buy] GameDB connection failed, falling back to mock owner check', gameDbError)
      // Fallback: If DB is offline, allow mock characters to pass verification
      if (characterName === 'KriegerGod' || characterName === 'SuraKing' || characterName.startsWith('Mock_')) {
        characterVerified = true
      }
    }

    if (!characterVerified) {
      return NextResponse.json({ error: 'Der angegebene Charakter gehört nicht zu deinem Account.' }, { status: 400 })
    }

    // 2. Perform CMS purchase in transaction
    try {
      const result = await cmsDb.$transaction(async (tx) => {
        // Load shop item
        const item = await tx.shopItem.findUnique({
          where: { id: shopItemId },
          include: { itemTemplate: true },
        })

        if (!item || !item.enabled) {
          throw new Error('Dieses Item existiert nicht oder ist deaktiviert.')
        }

        // Deduct Coins
        const deductRes = await deductCoins(accountId, item.price, `Item Shop: ${item.name}`, tx)
        if (!deductRes.success) {
          throw new Error(deductRes.error || 'Fehler bei der Münzabbuchung')
        }

        // Create Item Grant log
        const itemVnum = item.itemVnum || item.itemTemplate?.vnum || 0
        const itemCount = item.count ?? 1
        const enchants = (item.defaultEnchants as any) || {}

        await tx.adminItemGrant.create({
          data: {
            accountId,
            characterName,
            itemVnum,
            itemCount,
            enchants,
            status: 'PENDING',
            grantedBy: 'SHOP',
          },
        })

        // Cashback setting
        const cashbackSetting = await tx.setting.findUnique({
          where: { key: 'dm_cashback_percent' },
        })
        const percent = parseInt(cashbackSetting?.value || '0', 10)
        const dmCashback = percent > 0 ? Math.floor((item.price * percent) / 100) : 0

        return {
          dmCashback,
          newBalance: deductRes.newBalance,
        }
      })

      return NextResponse.json({
        success: true,
        dmCashback: result.dmCashback,
        newBalance: result.newBalance,
      })
    } catch (txError: any) {
      console.error('[itemshop/buy] CMS transaction aborted:', txError.message)
      return NextResponse.json({ error: txError.message || 'Kauf fehlgeschlagen.' }, { status: 400 })
    }
  } catch (error) {
    console.error('[ITEMSHOP_BUY_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
