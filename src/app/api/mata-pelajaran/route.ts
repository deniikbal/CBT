import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mataPelajaran } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET - Ambil semua mata pelajaran
export async function GET() {
  try {
    const allMatpel = await db.select().from(mataPelajaran).orderBy(desc(mataPelajaran.createdAt))
    return NextResponse.json(allMatpel)
  } catch (error) {
    console.error('Error fetching mata pelajaran:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Tambah mata pelajaran baru
export async function POST(request: NextRequest) {
  try {
    const { name, kodeMatpel } = await request.json()

    if (!name || !kodeMatpel) {
      return NextResponse.json(
        { error: 'Nama dan kode mata pelajaran harus diisi' },
        { status: 400 }
      )
    }

    // Check if kode matpel already exists
    const [existing] = await db.select().from(mataPelajaran).where(eq(mataPelajaran.kodeMatpel, kodeMatpel)).limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'Kode mata pelajaran sudah terdaftar' },
        { status: 400 }
      )
    }

    const [newMatpel] = await db.insert(mataPelajaran).values({
      name,
      kodeMatpel
    }).returning()

    return NextResponse.json(newMatpel, { status: 201 })
  } catch (error) {
    console.error('Error creating mata pelajaran:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
