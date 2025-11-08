import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bankSoal, mataPelajaran } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET - Ambil bank soal by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const [data] = await db.select({
      id: bankSoal.id,
      kodeBankSoal: bankSoal.kodeBankSoal,
      matpelId: bankSoal.matpelId,
      jumlahSoal: bankSoal.jumlahSoal,
      sourceType: bankSoal.sourceType,
      googleFormUrl: bankSoal.googleFormUrl,
      createdAt: bankSoal.createdAt,
      updatedAt: bankSoal.updatedAt,
      mataPelajaran: {
        id: mataPelajaran.id,
        name: mataPelajaran.name,
        kodeMatpel: mataPelajaran.kodeMatpel
      }
    })
    .from(bankSoal)
    .leftJoin(mataPelajaran, eq(bankSoal.matpelId, mataPelajaran.id))
    .where(eq(bankSoal.id, id))
    .limit(1)

    if (!data) {
      return NextResponse.json(
        { error: 'Bank soal tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching bank soal:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update bank soal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { kodeBankSoal, matpelId, jumlahSoal, sourceType = 'MANUAL', googleFormUrl } = await request.json()

    if (!kodeBankSoal || !matpelId) {
      return NextResponse.json(
        { error: 'Kode bank soal dan mata pelajaran harus diisi' },
        { status: 400 }
      )
    }

    if (sourceType === 'GOOGLE_FORM' && !googleFormUrl) {
      return NextResponse.json(
        { error: 'URL Google Form harus diisi jika menggunakan sumber Google Form' },
        { status: 400 }
      )
    }

    // Check if kode bank soal already used by other record
    const [existing] = await db.select().from(bankSoal)
      .where(eq(bankSoal.kodeBankSoal, kodeBankSoal))
      .limit(1)

    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: 'Kode bank soal sudah digunakan' },
        { status: 400 }
      )
    }

    // Check if mata pelajaran exists
    const [matpelExists] = await db.select().from(mataPelajaran).where(eq(mataPelajaran.id, matpelId)).limit(1)

    if (!matpelExists) {
      return NextResponse.json(
        { error: 'Mata pelajaran tidak ditemukan' },
        { status: 404 }
      )
    }

    const [updated] = await db.update(bankSoal)
      .set({ 
        kodeBankSoal, 
        matpelId, 
        jumlahSoal: jumlahSoal || 0,
        sourceType: sourceType as 'MANUAL' | 'GOOGLE_FORM',
        googleFormUrl: sourceType === 'GOOGLE_FORM' ? googleFormUrl : null,
        updatedAt: new Date() 
      })
      .where(eq(bankSoal.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Bank soal tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating bank soal:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus bank soal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [deleted] = await db.delete(bankSoal)
      .where(eq(bankSoal.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: 'Bank soal tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Bank soal berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting bank soal:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
