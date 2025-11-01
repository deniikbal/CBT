import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { peserta } from '@/db/schema'
import { inArray } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ID peserta harus berupa array dan tidak boleh kosong' },
        { status: 400 }
      )
    }

    console.log('Bulk disabling peserta:', ids.length, 'accounts')

    // Update all peserta to inactive
    await db
      .update(peserta)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(inArray(peserta.id, ids))

    return NextResponse.json({ 
      success: true,
      count: ids.length,
      message: `Berhasil menonaktifkan ${ids.length} peserta`
    })
  } catch (error) {
    console.error('Error bulk disabling peserta:', error)
    return NextResponse.json(
      { error: 'Gagal menonaktifkan peserta', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
