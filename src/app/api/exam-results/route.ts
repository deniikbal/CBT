import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { examResults, exams, examQuestions, questions } from '@/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const results = await db.select().from(examResults)
      .where(eq(examResults.userId, userId))
      .orderBy(desc(examResults.submittedAt))

    // Enrich with exam data
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        const [exam] = await db.select().from(exams).where(eq(exams.id, result.examId)).limit(1)
        const [questionCount] = await db.select({ count: count() }).from(examQuestions).where(eq(examQuestions.examId, result.examId))

        return {
          ...result,
          exam: {
            ...exam,
            _count: {
              questions: questionCount?.count || 0
            }
          }
        }
      })
    )

    return NextResponse.json(enrichedResults)
  } catch (error) {
    console.error('Error fetching exam results:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { examId, userId } = await request.json()

    if (!examId || !userId) {
      return NextResponse.json(
        { error: 'Exam ID and User ID are required' },
        { status: 400 }
      )
    }

    // Check if user already has an active exam result
    const [existingResult] = await db.select().from(examResults)
      .where(and(
        eq(examResults.userId, userId),
        eq(examResults.examId, examId),
        eq(examResults.status, 'IN_PROGRESS')
      ))
      .limit(1)

    if (existingResult) {
      return NextResponse.json(existingResult)
    }

    // Get exam questions to calculate max score
    const examQuestionsData = await db.select()
      .from(examQuestions)
      .where(eq(examQuestions.examId, examId))

    const maxScore = examQuestionsData.length

    const [examResult] = await db.insert(examResults).values({
      userId,
      examId,
      score: 0,
      maxScore,
      answers: JSON.stringify({}),
      startedAt: new Date(),
      submittedAt: new Date(),
      status: 'IN_PROGRESS'
    }).returning()

    return NextResponse.json(examResult)
  } catch (error) {
    console.error('Error creating exam result:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}