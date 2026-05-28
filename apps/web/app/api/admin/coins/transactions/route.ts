import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Verboten' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    const transactions = await cmsDb.coinTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const total = await cmsDb.coinTransaction.count()

    // CMS-Benutzer laden, um Account-Namen zuzuordnen
    const accountIds = Array.from(new Set(transactions.map(t => t.accountId)))
    const users = await cmsDb.user.findMany({
      where: { 
        accountId: { 
          in: accountIds.filter((id): id is number => id !== null) 
        } 
      },
      select: { accountId: true, name: true, email: true }
    })

    const userMap = new Map(users.map(u => [u.accountId, u]))

    const enrichedTransactions = transactions.map(t => ({
      ...t,
      accountName: userMap.get(t.accountId)?.name || `ID: ${t.accountId}`,
      email: userMap.get(t.accountId)?.email || null
    }))

    return NextResponse.json({ transactions: enrichedTransactions, total })
  } catch (error) {
    console.error('[ADMIN_COINS_TRANSACTIONS_GET]', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
