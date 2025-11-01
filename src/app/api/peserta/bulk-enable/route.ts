import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { peserta, hasilUjianPeserta, jadwalUjian } from '@/db/schema'
import { eq, inArray, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ID peserta harus berupa array dan tidak boleh kosong' },
        { status: 400 }
      )
    }

    console.log('Bulk enabling peserta:', ids.length, 'accounts')

    // Update all peserta to active
    await db
      .update(peserta)
      .set({ 
        isActive: true,
        updatedAt: new Date()
      })
      .where(inArray(peserta.id, ids))

    // Reset violation counters for hasil ujian where resetPelanggaranOnEnable=true
    for (const pesertaId of ids) {
      try {
        // Get all hasil ujian for this peserta
        const hasilList = await db
          .select({
            hasilId: hasilUjianPeserta.id,
            jadwalId: hasilUjianPeserta.jadwalUjianId,
            resetFlag: jadwalUjian.resetPelanggaranOnEnable,
          })
          .from(hasilUjianPeserta)
          .innerJoin(jadwalUjian, eq(hasilUjianPeserta.jadwalUjianId, jadwalUjian.id))
          .where(eq(hasilUjianPeserta.pesertaId, pesertaId))

        // Reset violations for jadwal with reset flag enabled
        const resetPromises = hasilList
          .filter(h => h.resetFlag)
          .map(h => {
            return db
              .update(hasilUjianPeserta)
              .set({ 
                jumlahPelanggaran: 0,
                updatedAt: new Date()
              })
              .where(eq(hasilUjianPeserta.id, h.hasilId))
          })

        await Promise.all(resetPromises)
        console.log(`Reset ${resetPromises.length} violation counters for peserta ${pesertaId}`)
      } catch (resetError) {
        console.error(`Error resetting violations for peserta ${pesertaId}:`, resetError)
        // Continue with other peserta even if reset fails
      }
    }

    return NextResponse.json({ 
      success: true,
      count: ids.length,
      message: `Berhasil mengaktifkan ${ids.length} peserta`
    })
  } catch (error) {
    console.error('Error bulk enabling peserta:', error)
    return NextResponse.json(
      { error: 'Gagal mengaktifkan peserta', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
