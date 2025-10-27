import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, questions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Check if admin user already exists
    const [existingAdmin] = await db.select().from(users)
      .where(eq(users.role, 'ADMIN'))
      .limit(1)

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      )
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const [admin] = await db.insert(users).values({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN'
    }).returning()

    // Create sample questions
    const sampleQuestions = [
      {
        question: 'Apa ibu kota Indonesia?',
        options: JSON.stringify(['Jakarta', 'Surabaya', 'Bandung', 'Medan']),
        correctAnswer: 'Jakarta',
        category: 'Geografi',
        difficulty: 'EASY' as const
      },
      {
        question: 'Berapa hasil dari 15 + 27?',
        options: JSON.stringify(['40', '41', '42', '43']),
        correctAnswer: '42',
        category: 'Matematika',
        difficulty: 'EASY' as const
      },
      {
        question: 'Siapa presiden pertama Indonesia?',
        options: JSON.stringify(['Soekarno', 'Soeharto', 'BJ Habibie', 'Megawati']),
        correctAnswer: 'Soekarno',
        category: 'Sejarah',
        difficulty: 'MEDIUM' as const
      }
    ]

    await db.insert(questions).values(sampleQuestions)

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin

    return NextResponse.json({
      message: 'Setup completed successfully',
      admin: adminWithoutPassword,
      sampleQuestions: sampleQuestions.length
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Setup failed' },
      { status: 500 }
    )
  }
}