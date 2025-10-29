import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jadwalUjian } from '@/db/schema'
import { inArray } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs tidak valid' }, { status: 400 })
    }

    // Delete jadwal with the given IDs
    const result = await db
      .delete(jadwalUjian)
      .where(inArray(jadwalUjian.id, ids))

    return NextResponse.json({ 
      success: true,
      count: ids.length
    })

  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus jadwal' 
    }, { status: 500 })
  }
}
