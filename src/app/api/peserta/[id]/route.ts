import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { peserta, kelas, jurusan } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// GET - Ambil peserta by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const [data] = await db.select({
      id: peserta.id,
      name: peserta.name,
      noUjian: peserta.noUjian,
      kelasId: peserta.kelasId,
      jurusanId: peserta.jurusanId,
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
    .where(eq(peserta.id, id))
    .limit(1)

    if (!data) {
      return NextResponse.json(
        { error: 'Peserta tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching peserta:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update peserta
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { name, noUjian, password, kelasId, jurusanId } = await request.json()

    if (!name || !noUjian || !kelasId || !jurusanId) {
      return NextResponse.json(
        { error: 'Nama, nomor ujian, kelas, dan jurusan harus diisi' },
        { status: 400 }
      )
    }

    // Check if no_ujian already used by other record
    const [existing] = await db.select().from(peserta)
      .where(eq(peserta.noUjian, noUjian))
      .limit(1)

    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: 'Nomor ujian sudah digunakan' },
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

    // Prepare update data
    const updateData: any = {
      name,
      noUjian,
      kelasId,
      jurusanId,
      updatedAt: new Date()
    }

    // Only hash and update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const [updated] = await db.update(peserta)
      .set(updateData)
      .where(eq(peserta.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Peserta tidak ditemukan' },
        { status: 404 }
      )
    }

    // Remove password from response
    const { password: _, ...pesertaWithoutPassword } = updated

    return NextResponse.json(pesertaWithoutPassword)
  } catch (error) {
    console.error('Error updating peserta:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus peserta
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const [deleted] = await db.delete(peserta)
      .where(eq(peserta.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: 'Peserta tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Peserta berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting peserta:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
