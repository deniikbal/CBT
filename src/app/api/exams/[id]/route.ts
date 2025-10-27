import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exams, examQuestions, examResults } from '@/db/schema'
import { eq, count } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const [exam] = await db.select().from(exams).where(eq(exams.id, id)).limit(1)

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Get counts
    const [questionCount] = await db.select({ count: count() }).from(examQuestions).where(eq(examQuestions.examId, id))
    const [resultCount] = await db.select({ count: count() }).from(examResults).where(eq(examResults.examId, id))

    const examWithCounts = {
      ...exam,
      _count: {
        questions: questionCount?.count || 0,
        results: resultCount?.count || 0
      }
    }

    return NextResponse.json(examWithCounts)
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}