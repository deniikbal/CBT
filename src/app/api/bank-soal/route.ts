import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bankSoal, mataPelajaran } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET - Ambil semua bank soal dengan data mata pelajaran
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const createdById = searchParams.get('createdById')

    let query = db.select({
      id: bankSoal.id,
      kodeBankSoal: bankSoal.kodeBankSoal,
      matpelId: bankSoal.matpelId,
      createdBy: bankSoal.createdBy,
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

    // Filter by createdBy if provided
    if (createdById) {
      query = query.where(eq(bankSoal.createdBy, createdById))
    }

    const allBankSoal = await query.orderBy(desc(bankSoal.createdAt))

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
    const { kodeBankSoal, matpelId, jumlahSoal, createdBy, sourceType = 'MANUAL', googleFormUrl } = await request.json()

    if (!kodeBankSoal || !matpelId || !createdBy) {
      return NextResponse.json(
        { error: 'Kode bank soal, mata pelajaran, dan userId harus diisi' },
        { status: 400 }
      )
    }

    if (sourceType === 'GOOGLE_FORM' && !googleFormUrl) {
      return NextResponse.json(
        { error: 'URL Google Form harus diisi jika menggunakan sumber Google Form' },
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
      createdBy,
      jumlahSoal: jumlahSoal || 0,
      sourceType: sourceType as 'MANUAL' | 'GOOGLE_FORM',
      googleFormUrl: sourceType === 'GOOGLE_FORM' ? googleFormUrl : null
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
