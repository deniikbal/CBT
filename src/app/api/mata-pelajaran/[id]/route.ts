import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mataPelajaran } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET - Ambil mata pelajaran by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const [data] = await db.select().from(mataPelajaran).where(eq(mataPelajaran.id, id)).limit(1)

    if (!data) {
      return NextResponse.json(
        { error: 'Mata pelajaran tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching mata pelajaran:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update mata pelajaran
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { name, kodeMatpel } = await request.json()

    if (!name || !kodeMatpel) {
      return NextResponse.json(
        { error: 'Nama dan kode mata pelajaran harus diisi' },
        { status: 400 }
      )
    }

    // Check if kode matpel already used by other record
    const [existing] = await db.select().from(mataPelajaran)
      .where(eq(mataPelajaran.kodeMatpel, kodeMatpel))
      .limit(1)

    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: 'Kode mata pelajaran sudah digunakan' },
        { status: 400 }
      )
    }

    const [updated] = await db.update(mataPelajaran)
      .set({ name, kodeMatpel, updatedAt: new Date() })
      .where(eq(mataPelajaran.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Mata pelajaran tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating mata pelajaran:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus mata pelajaran
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const [deleted] = await db.delete(mataPelajaran)
      .where(eq(mataPelajaran.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: 'Mata pelajaran tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Mata pelajaran berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting mata pelajaran:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
