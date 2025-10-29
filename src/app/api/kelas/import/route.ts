import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kelas, jurusan } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet) as Array<{
      'Nama Kelas': string
      'Kode Jurusan': string
      'Wali Kelas'?: string
    }>

    if (data.length === 0) {
      return NextResponse.json({ error: 'File Excel kosong' }, { status: 400 })
    }

    let successCount = 0
    const errors: string[] = []

    for (const [index, row] of data.entries()) {
      try {
        const namaKelas = row['Nama Kelas']?.toString().trim()
        const kodeJurusan = row['Kode Jurusan']?.toString().trim()
        const waliKelas = row['Wali Kelas']?.toString().trim() || null

        if (!namaKelas || !kodeJurusan) {
          errors.push(`Baris ${index + 2}: Nama Kelas dan Kode Jurusan wajib diisi`)
          continue
        }

        // Find jurusan by kode
        const [jurusanData] = await db
          .select()
          .from(jurusan)
          .where(eq(jurusan.kodeJurusan, kodeJurusan))
          .limit(1)

        if (!jurusanData) {
          errors.push(`Baris ${index + 2}: Jurusan dengan kode "${kodeJurusan}" tidak ditemukan`)
          continue
        }

        // Check if kelas already exists
        const [existingKelas] = await db
          .select()
          .from(kelas)
          .where(
            and(
              eq(kelas.name, namaKelas),
              eq(kelas.jurusanId, jurusanData.id)
            )
          )
          .limit(1)

        if (existingKelas) {
          errors.push(`Baris ${index + 2}: Kelas "${namaKelas}" sudah ada untuk jurusan "${kodeJurusan}"`)
          continue
        }

        // Insert new kelas
        await db.insert(kelas).values({
          name: namaKelas,
          jurusanId: jurusanData.id,
          teacher: waliKelas
        })

        successCount++
      } catch (error) {
        console.error(`Error processing row ${index + 2}:`, error)
        errors.push(`Baris ${index + 2}: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
      }
    }

    if (successCount === 0 && errors.length > 0) {
      return NextResponse.json({ 
        error: 'Semua data gagal diimport',
        details: errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan saat import data' 
    }, { status: 500 })
  }
}
