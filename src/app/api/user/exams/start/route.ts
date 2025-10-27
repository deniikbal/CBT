import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exams, examQuestions, examResults } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { examId, userId } = await request.json()

    if (!examId || !userId) {
      return NextResponse.json(
        { error: 'Exam ID and User ID are required' },
        { status: 400 }
      )
    }

    // Check if exam exists and is active
    const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1)

    if (!exam) {
      return NextResponse.json(
        { error: 'Ujian tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!exam.isActive) {
      return NextResponse.json(
        { error: 'Ujian tidak aktif' },
        { status: 400 }
      )
    }

    const now = new Date()
    const startDate = new Date(exam.startDate)
    const endDate = new Date(exam.endDate)

    if (now < startDate) {
      return NextResponse.json(
        { error: 'Ujian belum dimulai' },
        { status: 400 }
      )
    }

    if (now > endDate) {
      return NextResponse.json(
        { error: 'Ujian telah berakhir' },
        { status: 400 }
      )
    }

    // Check if user already has a result for this exam
    const [existingResult] = await db.select().from(examResults)
      .where(and(
        eq(examResults.userId, userId),
        eq(examResults.examId, examId)
      ))
      .limit(1)

    if (existingResult) {
      if (existingResult.status === 'SUBMITTED') {
        return NextResponse.json(
          { error: 'Anda sudah mengerjakan ujian ini' },
          { status: 400 }
        )
      }
      // Return existing result if in progress
      return NextResponse.json(existingResult)
    }

    // Get question count for max score calculation
    const [questionCount] = await db.select({ count: count() })
      .from(examQuestions)
      .where(eq(examQuestions.examId, examId))

    const totalQuestions = questionCount?.count || 0

    // Create new exam result
    const [examResult] = await db.insert(examResults).values({
      userId,
      examId,
      score: 0,
      maxScore: totalQuestions * 10, // Assuming 10 points per question
      answers: JSON.stringify({}), // Empty answers object
      startedAt: new Date(),
      submittedAt: new Date(Date.now() + exam.duration * 60000), // Set initial submission time
      status: 'IN_PROGRESS'
    }).returning()

    return NextResponse.json(examResult)

  } catch (error) {
    console.error('Error starting exam:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}