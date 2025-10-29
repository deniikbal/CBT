import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { peserta, jurusan, bankSoal, jadwalUjian } from '@/db/schema'
import { count } from 'drizzle-orm'

export async function GET() {
  try {
    // Get total peserta
    const [totalPeserta] = await db
      .select({ count: count() })
      .from(peserta)

    // Get total jurusan
    const [totalJurusan] = await db
      .select({ count: count() })
      .from(jurusan)

    // Get total bank soal
    const [totalBankSoal] = await db
      .select({ count: count() })
      .from(bankSoal)

    // Get total jadwal ujian
    const [totalJadwal] = await db
      .select({ count: count() })
      .from(jadwalUjian)

    return NextResponse.json({
      totalPeserta: totalPeserta?.count || 0,
      totalJurusan: totalJurusan?.count || 0,
      totalBankSoal: totalBankSoal?.count || 0,
      totalJadwal: totalJadwal?.count || 0,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
