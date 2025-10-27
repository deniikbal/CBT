import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bankSoal, mataPelajaran } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET - Ambil semua bank soal dengan data mata pelajaran
export async function GET() {
  try {
    const allBankSoal = await db.select({
      id: bankSoal.id,
      kodeBankSoal: bankSoal.kodeBankSoal,
      matpelId: bankSoal.matpelId,
      jumlahSoal: bankSoal.jumlahSoal,
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
    .orderBy(desc(bankSoal.createdAt))

    return NextResponse.json(allBankSoal)
  } catch (error) {
    console.error('Error fetching bank soal:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Tambah bank soal baru
export async function POST(request: NextRequest) {
  try {
    const { kodeBankSoal, matpelId, jumlahSoal } = await request.json()

    if (!kodeBankSoal || !matpelId) {
      return NextResponse.json(
        { error: 'Kode bank soal dan mata pelajaran harus diisi' },
        { status: 400 }
      )
    }

    // Check if kode bank soal already exists
    const [existing] = await db.select().from(bankSoal).where(eq(bankSoal.kodeBankSoal, kodeBankSoal)).limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'Kode bank soal sudah terdaftar' },
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

    const [newBankSoal] = await db.insert(bankSoal).values({
      kodeBankSoal,
      matpelId,
      jumlahSoal: jumlahSoal || 0
    }).returning()

    return NextResponse.json(newBankSoal, { status: 201 })
  } catch (error) {
    console.error('Error creating bank soal:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
