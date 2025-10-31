import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { peserta, kelas, jurusan } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import bcrypt from 'bcryptjs'

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
      'Nama Lengkap': string
      'No Ujian': string
      'Password': string
      'Kode Kelas': string
      'Kode Jurusan': string
    }>

    if (data.length === 0) {
      return NextResponse.json({ error: 'File Excel kosong' }, { status: 400 })
    }

    console.log(`[Import] Starting import of ${data.length} rows...`)

    // STEP 1: Cache all jurusan and kelas (1 query each instead of N queries)
    const allJurusan = await db.select().from(jurusan)
    const allKelas = await db.select().from(kelas)
    
    const jurusanMap = new Map(allJurusan.map(j => [j.kodeJurusan, j]))
    const kelasMap = new Map(allKelas.map(k => [`${k.name}-${k.jurusanId}`, k]))
    
    console.log(`[Import] Cached ${allJurusan.length} jurusan and ${allKelas.length} kelas`)

    // STEP 2: Get all existing noUjian to check duplicates (1 query)
    const allNoUjian = data.map(row => row['No Ujian']?.toString().trim()).filter(Boolean)
    const existingPeserta = await db
      .select({ noUjian: peserta.noUjian })
      .from(peserta)
      .where(inArray(peserta.noUjian, allNoUjian))
    
    const existingNoUjianSet = new Set(existingPeserta.map(p => p.noUjian))
    console.log(`[Import] Found ${existingNoUjianSet.size} existing no ujian`)

    // STEP 3: Validate and prepare data for batch insert
    const errors: string[] = []
    const validRecords: Array<{
      name: string
      noUjian: string
      password: string
      unhashedPassword: string
      kelasId: string
      jurusanId: string
      isActive: boolean
    }> = []

    const passwordsToHash: Array<{ index: number; password: string }> = []

    for (const [index, row] of data.entries()) {
      const namaLengkap = row['Nama Lengkap']?.toString().trim()
      const noUjian = row['No Ujian']?.toString().trim()
      const password = row['Password']?.toString().trim()
      const kodeKelas = row['Kode Kelas']?.toString().trim()
      const kodeJurusan = row['Kode Jurusan']?.toString().trim()

      if (!namaLengkap || !noUjian || !password || !kodeKelas || !kodeJurusan) {
        errors.push(`Baris ${index + 2}: Semua field wajib diisi`)
        continue
      }

      if (existingNoUjianSet.has(noUjian)) {
        errors.push(`Baris ${index + 2}: No Ujian "${noUjian}" sudah terdaftar`)
        continue
      }

      const jurusanData = jurusanMap.get(kodeJurusan)
      if (!jurusanData) {
        errors.push(`Baris ${index + 2}: Jurusan "${kodeJurusan}" tidak ditemukan`)
        continue
      }

      const kelasKey = `${kodeKelas}-${jurusanData.id}`
      const kelasData = kelasMap.get(kelasKey)
      if (!kelasData) {
        errors.push(`Baris ${index + 2}: Kelas "${kodeKelas}" tidak ditemukan untuk jurusan "${kodeJurusan}"`)
        continue
      }

      passwordsToHash.push({ index: validRecords.length, password })
      
      validRecords.push({
        name: namaLengkap,
        noUjian: noUjian,
        password: '', // Will be filled after hashing
        unhashedPassword: password, // Store plain password for exam card
        kelasId: kelasData.id,
        jurusanId: jurusanData.id,
        isActive: true
      })
    }

    console.log(`[Import] Validated ${validRecords.length} valid records, ${errors.length} errors`)

    if (validRecords.length === 0) {
      return NextResponse.json({ 
        error: 'Semua data gagal diimport',
        details: errors 
      }, { status: 400 })
    }

    // STEP 4: Hash all passwords in parallel (much faster)
    console.log(`[Import] Hashing ${passwordsToHash.length} passwords in parallel...`)
    const hashPromises = passwordsToHash.map(async ({ index, password }) => {
      const hashed = await bcrypt.hash(password, 10)
      return { index, hashed }
    })
    
    const hashedResults = await Promise.all(hashPromises)
    
    // Fill in hashed passwords
    for (const { index, hashed } of hashedResults) {
      validRecords[index].password = hashed
    }

    console.log(`[Import] Password hashing complete`)

    // STEP 5: Batch insert all valid records (1 query instead of N queries)
    console.log(`[Import] Inserting ${validRecords.length} records...`)
    
    // Split into chunks of 100 to avoid query limits
    const chunkSize = 100
    let totalInserted = 0
    
    for (let i = 0; i < validRecords.length; i += chunkSize) {
      const chunk = validRecords.slice(i, i + chunkSize)
      await db.insert(peserta).values(chunk)
      totalInserted += chunk.length
      console.log(`[Import] Inserted ${totalInserted}/${validRecords.length}`)
    }

    console.log(`[Import] Import complete: ${totalInserted} success, ${errors.length} errors`)

    return NextResponse.json({ 
      success: true,
      count: totalInserted,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan saat import data' 
    }, { status: 500 })
  }
}
