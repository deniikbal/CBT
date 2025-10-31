import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { peserta, kelas, jurusan } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET - Ambil semua peserta dengan data kelas dan jurusan
export async function GET() {
  try {
    const allPeserta = await db.select({
      id: peserta.id,
      name: peserta.name,
      noUjian: peserta.noUjian,
      kelasId: peserta.kelasId,
      jurusanId: peserta.jurusanId,
      isActive: peserta.isActive,
      createdAt: peserta.createdAt,
      updatedAt: peserta.updatedAt,
      kelas: {
        id: kelas.id,
        name: kelas.name
      },
      jurusan: {
        id: jurusan.id,
        name: jurusan.name,
        kodeJurusan: jurusan.kodeJurusan
      }
    })
    .from(peserta)
    .leftJoin(kelas, eq(peserta.kelasId, kelas.id))
    .leftJoin(jurusan, eq(peserta.jurusanId, jurusan.id))
    .orderBy(desc(peserta.createdAt))

    return NextResponse.json(allPeserta)
  } catch (error) {
    console.error('Error fetching peserta:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Tambah peserta baru
export async function POST(request: NextRequest) {
  try {
    const { name, noUjian, password, kelasId, jurusanId } = await request.json()

    if (!name || !noUjian || !password || !kelasId || !jurusanId) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    // Check if no_ujian already exists
    const [existing] = await db.select().from(peserta).where(eq(peserta.noUjian, noUjian)).limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'Nomor ujian sudah terdaftar' },
        { status: 400 }
      )
    }

    // Check if kelas exists
    const [kelasExists] = await db.select().from(kelas).where(eq(kelas.id, kelasId)).limit(1)

    if (!kelasExists) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
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

    // Store password as plain text for kartu ujian display
    // For login, compare plain text password
    const [newPeserta] = await db.insert(peserta).values({
      name,
      noUjian,
      password: password,
      kelasId,
      jurusanId
    }).returning()

    // Remove password from response
    const { password: _, ...pesertaWithoutPassword } = newPeserta

    return NextResponse.json(pesertaWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Error creating peserta:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
