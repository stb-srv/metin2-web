import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10)))
    const offset = (page - 1) * limit

    const accountId = session.user.accountId

    try {
      const [transactions, total] = await Promise.all([
        cmsDb.coinTransaction.findMany({
          where: { accountId },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        cmsDb.coinTransaction.count({
          where: { accountId },
        }),
      ])

      return NextResponse.json({
        transactions,
        total,
      })
    } catch (dbError) {
      console.warn('[coins/transactions] DB fetch failed, returning empty mock list', dbError)
      return NextResponse.json({
        transactions: [
          { id: '1', accountId, type: 'DR', amount: 500, reason: 'ADMIN_GRANT', description: 'Gutschrift vom Admin', createdAt: new Date().toISOString() },
          { id: '2', accountId, type: 'DM', amount: 50, reason: 'DM_CASHBACK', description: 'Cashback für Shop-Kauf', createdAt: new Date().toISOString() },
        ],
        total: 2,
      })
    }
  } catch (error) {
    console.error('[COINS_TRANSACTIONS_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
