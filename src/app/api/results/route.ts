import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { examResults, users, exams } from '@/db/schema'
import { eq, and, or, desc } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { userId, examId, score, maxScore, answers, startedAt, submittedAt, status } = await request.json()

    if (!userId || !examId || score === undefined || maxScore === undefined || !answers) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if user already has a result for this exam
    const [existingResult] = await db.select().from(examResults)
      .where(and(
        eq(examResults.userId, userId),
        eq(examResults.examId, examId),
        or(
          eq(examResults.status, 'SUBMITTED'),
          eq(examResults.status, 'IN_PROGRESS')
        )
      ))
      .limit(1)

    if (existingResult) {
      return NextResponse.json(
        { error: 'Anda sudah pernah mengerjakan ujian ini' },
        { status: 400 }
      )
    }

    const [result] = await db.insert(examResults).values({
      userId,
      examId,
      score,
      maxScore,
      answers,
      startedAt: new Date(startedAt),
      submittedAt: new Date(submittedAt),
      status
    }).returning()

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating result:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const results = await db.select().from(examResults)
      .orderBy(desc(examResults.submittedAt))

    // Enrich with user and exam data
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        const [user] = await db.select({
          id: users.id,
          name: users.name,
          email: users.email
        }).from(users).where(eq(users.id, result.userId)).limit(1)

        const [exam] = await db.select({
          id: exams.id,
          title: exams.title,
          duration: exams.duration,
          startDate: exams.startDate,
          endDate: exams.endDate
        }).from(exams).where(eq(exams.id, result.examId)).limit(1)

        return {
          ...result,
          user,
          exam
        }
      })
    )

    return NextResponse.json(enrichedResults)
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}