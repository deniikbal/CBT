import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jurusan } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET - Ambil semua jurusan
export async function GET() {
  try {
    const allJurusan = await db.select().from(jurusan).orderBy(desc(jurusan.createdAt))
    return NextResponse.json(allJurusan)
  } catch (error) {
    console.error('Error fetching jurusan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Tambah jurusan baru
export async function POST(request: NextRequest) {
  try {
    const { name, kodeJurusan } = await request.json()

    if (!name || !kodeJurusan) {
      return NextResponse.json(
        { error: 'Nama dan kode jurusan harus diisi' },
        { status: 400 }
      )
    }

    // Check if kode jurusan already exists
    const [existing] = await db.select().from(jurusan).where(eq(jurusan.kodeJurusan, kodeJurusan)).limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'Kode jurusan sudah terdaftar' },
        { status: 400 }
      )
    }

    const [newJurusan] = await db.insert(jurusan).values({
      name,
      kodeJurusan
    }).returning()

    return NextResponse.json(newJurusan, { status: 201 })
  } catch (error) {
    console.error('Error creating jurusan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
