import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { peserta, jurusan, bankSoal, jadwalUjian } from '@/db/schema'
import { count } from 'drizzle-orm'
import { cache, cacheKeys } from '@/lib/cache'

export async function GET() {
  try {
    // Check cache first (aggressive cache 15 minutes)
    const cachedStats = cache.get(cacheKeys.dashboardStats)
    if (cachedStats) {
      console.log('[CACHE HIT] Dashboard stats')
      return NextResponse.json(cachedStats)
    }

    console.log('[CACHE MISS] Dashboard stats - querying database')

    // Get all stats in parallel to reduce query time
    const [totalPeserta, totalJurusan, totalBankSoal, totalJadwal] = await Promise.all([
      db.select({ count: count() }).from(peserta),
      db.select({ count: count() }).from(jurusan),
      db.select({ count: count() }).from(bankSoal),
      db.select({ count: count() }).from(jadwalUjian),
    ])

    const stats = {
      totalPeserta: totalPeserta?.[0]?.count || 0,
      totalJurusan: totalJurusan?.[0]?.count || 0,
      totalBankSoal: totalBankSoal?.[0]?.count || 0,
      totalJadwal: totalJadwal?.[0]?.count || 0,
    }

    // Cache stats for 15 minutes (aggressive cache)
    cache.set(cacheKeys.dashboardStats, stats, 900)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
