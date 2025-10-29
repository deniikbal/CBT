import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { peserta } from '@/db/schema'
import { inArray } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs tidak valid' },
        { status: 400 }
      )
    }

    // Delete peserta by IDs
    const deleted = await db
      .delete(peserta)
      .where(inArray(peserta.id, ids))
      .returning()

    return NextResponse.json({ 
      success: true,
      count: deleted.length,
      message: `Berhasil menghapus ${deleted.length} peserta`
    })

  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus data' },
      { status: 500 }
    )
  }
}
