import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'
import { z } from 'zod'

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string()
})

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Verboten' }, { status: 403 })
    }

    const body = await request.json()
    const validation = settingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Ungültige Parameter' }, { status: 400 })
    }

    const { key, value } = validation.data

    const updatedSetting = await cmsDb.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })

    return NextResponse.json({ success: true, setting: updatedSetting })
  } catch (error) {
    console.error('[ADMIN_SETTINGS_PUT]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
