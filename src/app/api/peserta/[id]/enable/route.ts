import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { peserta, hasilUjianPeserta, jadwalUjian } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log('Enabling peserta account:', id)

    // Check if peserta exists
    const existingPeserta = await db.query.peserta.findFirst({
      where: eq(peserta.id, id)
    })

    if (!existingPeserta) {
      console.error('Peserta not found:', id)
      return NextResponse.json(
        { error: 'Peserta tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log('Current peserta status:', existingPeserta.isActive)

    // Update peserta to active
    const result = await db
      .update(peserta)
      .set({ 
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(peserta.id, id))
      .returning()

    console.log('Account enabled successfully:', result)

    // Reset violation counters for all hasil ujian where jadwal has resetPelanggaranOnEnable=true
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
        .where(eq(hasilUjianPeserta.pesertaId, id))

      console.log(`Found ${hasilList.length} hasil ujian records for peserta`)

      // Reset violations for jadwal with reset flag enabled
      const resetPromises = hasilList
        .filter(h => h.resetFlag)
        .map(h => {
          console.log(`Resetting violations for hasil ${h.hasilId} (jadwal ${h.jadwalId})`)
          return db
            .update(hasilUjianPeserta)
            .set({ 
              jumlahPelanggaran: 0,
              updatedAt: new Date()
            })
            .where(eq(hasilUjianPeserta.id, h.hasilId))
        })

      await Promise.all(resetPromises)
      console.log(`Reset ${resetPromises.length} violation counters`)
    } catch (resetError) {
      // Log but don't fail the enable operation
      console.error('Error resetting violations (non-critical):', resetError)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Akun berhasil diaktifkan',
      peserta: result[0]
    })
  } catch (error) {
    console.error('Error enabling peserta:', error)
    return NextResponse.json(
      { error: 'Gagal mengaktifkan akun', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
