import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { peserta } from '@/db/schema'
import { eq } from 'drizzle-orm'

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
