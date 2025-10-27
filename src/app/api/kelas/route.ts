import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kelas, jurusan } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET - Ambil semua kelas dengan data jurusan
export async function GET() {
  try {
    const allKelas = await db.select({
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
    .orderBy(desc(kelas.createdAt))

    return NextResponse.json(allKelas)
  } catch (error) {
    console.error('Error fetching kelas:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Tambah kelas baru
export async function POST(request: NextRequest) {
  try {
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

    const [newKelas] = await db.insert(kelas).values({
      name,
      jurusanId
    }).returning()

    return NextResponse.json(newKelas, { status: 201 })
  } catch (error) {
    console.error('Error creating kelas:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
