import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jurusan } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET - Ambil jurusan by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const [data] = await db.select().from(jurusan).where(eq(jurusan.id, id)).limit(1)

    if (!data) {
      return NextResponse.json(
        { error: 'Jurusan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching jurusan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update jurusan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { name, kodeJurusan } = await request.json()

    if (!name || !kodeJurusan) {
      return NextResponse.json(
        { error: 'Nama dan kode jurusan harus diisi' },
        { status: 400 }
      )
    }

    // Check if kode jurusan already used by other record
    const [existing] = await db.select().from(jurusan)
      .where(eq(jurusan.kodeJurusan, kodeJurusan))
      .limit(1)

    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: 'Kode jurusan sudah digunakan' },
        { status: 400 }
      )
    }

    const [updated] = await db.update(jurusan)
      .set({ name, kodeJurusan, updatedAt: new Date() })
      .where(eq(jurusan.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Jurusan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating jurusan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus jurusan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const [deleted] = await db.delete(jurusan)
      .where(eq(jurusan.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: 'Jurusan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Jurusan berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting jurusan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
