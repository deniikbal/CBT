import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jadwalUjian } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jadwalId: string }> }
) {
  try {
    const { jadwalId } = await params

    const jadwal = await db.query.jadwalUjian.findFirst({
      where: eq(jadwalUjian.id, jadwalId),
    })

    if (!jadwal) {
      return NextResponse.json(
        { error: 'Jadwal ujian tidak ditemukan' },
        { status: 404 }
      )
    }

    // Return basic jadwal info without starting the exam
    return NextResponse.json({
      id: jadwal.id,
      namaUjian: jadwal.namaUjian,
      durasi: jadwal.durasi,
      minimumPengerjaan: jadwal.minimumPengerjaan,
      waktuMulai: jadwal.waktuMulai ? jadwal.waktuMulai.toISOString() : new Date().toISOString(),
      tampilkanNilai: jadwal.tampilkanNilai,
    })
  } catch (error) {
    console.error('Error fetching jadwal info:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil info jadwal' },
      { status: 500 }
    )
  }
}
