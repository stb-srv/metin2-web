import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'
import { z } from 'zod'

const grantSchema = z.object({
  accountId: z.number().int(),
  type: z.enum(['DR', 'DM']),
  amount: z.number().int(),
  description: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = grantSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const { accountId, type, amount, description } = validation.data

    try {
      const finalBalance = await cmsDb.$transaction(async (tx) => {
        let balance = await tx.coinBalance.findUnique({
          where: { accountId },
        })

        if (!balance) {
          balance = await tx.coinBalance.create({
            data: { accountId, dr: 0, dm: 0 },
          })
        }

        let updatedDr = balance.dr
        let updatedDm = balance.dm

        if (type === 'DR') {
          updatedDr = Math.max(0, balance.dr + amount)
        } else {
          updatedDm = Math.max(0, balance.dm + amount)
        }

        const updated = await tx.coinBalance.update({
          where: { accountId },
          data: {
            dr: updatedDr,
            dm: updatedDm,
          },
        })

        await tx.coinTransaction.create({
          data: {
            accountId,
            type,
            amount,
            reason: amount >= 0 ? 'ADMIN_GRANT' : 'ADMIN_DEDUCT',
            description: description || (amount >= 0 ? 'Admin Gutschrift' : 'Admin Abbuchung'),
          },
        })

        return updated
      })

      return NextResponse.json({
        success: true,
        newBalance: {
          dr: finalBalance.dr,
          dm: finalBalance.dm,
        },
      })
    } catch (dbError) {
      console.error('[coins/grant] DB transaction failed', dbError)
      return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
    }
  } catch (error) {
    console.error('[ADMIN_COINS_GRANT_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
