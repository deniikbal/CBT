import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kelas, jurusan } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET - Ambil kelas by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const [data] = await db.select({
      id: kelas.id,
      name: kelas.name,
      jurusanId: kelas.jurusanId,
      createdAt: kelas.createdAt,
      updatedAt: kelas.updatedAt,
      jurusan: {
        id: jurusan.id,
        name: jurusan.name,
        kodeJurusan: jurusan.kodeJurusan
      }
    })
    .from(kelas)
    .leftJoin(jurusan, eq(kelas.jurusanId, jurusan.id))
    .where(eq(kelas.id, id))
    .limit(1)

    if (!data) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching kelas:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update kelas
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { name, jurusanId } = await request.json()

    if (!name || !jurusanId) {
      return NextResponse.json(
        { error: 'Nama dan jurusan harus diisi' },
        { status: 400 }
      )
    }

    // Check if jurusan exists
    const [jurusanExists] = await db.select().from(jurusan).where(eq(jurusan.id, jurusanId)).limit(1)

    if (!jurusanExists) {
      return NextResponse.json(
        { error: 'Jurusan tidak ditemukan' },
        { status: 404 }
      )
    }

    const [updated] = await db.update(kelas)
      .set({ name, jurusanId, updatedAt: new Date() })
      .where(eq(kelas.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating kelas:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus kelas
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const [deleted] = await db.delete(kelas)
      .where(eq(kelas.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Kelas berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting kelas:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
