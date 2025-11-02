import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { peserta } from '@/db/schema'
import { inArray } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// Generate random password with 6 characters (combination of letters and numbers)
function generateRandomPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, method, password: adminPassword } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ID peserta tidak valid' },
        { status: 400 }
      )
    }

    if (!method || !['admin', 'random'].includes(method)) {
      return NextResponse.json(
        { error: 'Metode tidak valid' },
        { status: 400 }
      )
    }

    if (method === 'admin' && (!adminPassword || !adminPassword.trim())) {
      return NextResponse.json(
        { error: 'Password harus diisi' },
        { status: 400 }
      )
    }

    // Check if all peserta exist
    const existingPeserta = await db.query.peserta.findMany({
      where: inArray(peserta.id, ids)
    })

    if (existingPeserta.length !== ids.length) {
      return NextResponse.json(
        { error: 'Beberapa peserta tidak ditemukan' },
        { status: 404 }
      )
    }

    let count = 0

    if (method === 'admin') {
      // Use admin-defined password for all selected peserta
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      
      await db
        .update(peserta)
        .set({
          password: hashedPassword,
          unhashedPassword: adminPassword,
          updatedAt: new Date()
        })
        .where(inArray(peserta.id, ids))

      count = ids.length
    } else {
      // Generate random password for each peserta
      const updatePromises = ids.map(async (id) => {
        const randomPassword = generateRandomPassword()
        const hashedPassword = await bcrypt.hash(randomPassword, 10)
        
        return db
          .update(peserta)
          .set({
            password: hashedPassword,
            unhashedPassword: randomPassword,
            updatedAt: new Date()
          })
          .where(inArray(peserta.id, [id]))
      })

      await Promise.all(updatePromises)
      count = ids.length
    }

    return NextResponse.json({
      success: true,
      message: 'Password berhasil digenerate',
      count,
      method
    })
  } catch (error) {
    console.error('Error generating password:', error)
    return NextResponse.json(
      { error: 'Gagal generate password', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
