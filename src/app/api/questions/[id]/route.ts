import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { examQuestions, questions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if question is used in any exam
    const [examQuestion] = await db.select().from(examQuestions).where(eq(examQuestions.questionId, id)).limit(1)

    if (examQuestion) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus soal yang sudah digunakan dalam ujian' },
        { status: 400 }
      )
    }

    await db.delete(questions).where(eq(questions.id, id))

    return NextResponse.json({ message: 'Soal berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}