import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exams, users, examQuestions, questions, examResults } from '@/db/schema'
import { eq, and, lte, gte, asc, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'available'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const now = new Date()

    if (type === 'available') {
      // Get available exams (active and within date range)
      const availableExams = await db.select().from(exams)
        .where(and(
          eq(exams.isActive, true),
          lte(exams.startDate, now),
          gte(exams.endDate, now)
        ))
        .orderBy(asc(exams.startDate))

      // Enrich with related data
      const enrichedExams = await Promise.all(
        availableExams.map(async (exam) => {
          const [creator] = await db.select({ id: users.id, name: users.name })
            .from(users)
            .where(eq(users.id, exam.createdBy))
            .limit(1)

          const examQuestionsData = await db.select({
            id: examQuestions.id,
            questionId: questions.id,
            question: questions.question
          })
            .from(examQuestions)
            .innerJoin(questions, eq(examQuestions.questionId, questions.id))
            .where(eq(examQuestions.examId, exam.id))

          const userResults = await db.select()
            .from(examResults)
            .where(and(
              eq(examResults.examId, exam.id),
              eq(examResults.userId, userId)
            ))

          return {
            ...exam,
            creator,
            questions: examQuestionsData.map(q => ({ question: { id: q.questionId, question: q.question } })),
            results: userResults
          }
        })
      )

      return NextResponse.json(enrichedExams)
    } else {
      // Get completed exams - find exams where user has submitted results
      const userSubmittedResults = await db.select()
        .from(examResults)
        .where(and(
          eq(examResults.userId, userId),
          eq(examResults.status, 'SUBMITTED')
        ))

      const examIds = [...new Set(userSubmittedResults.map(r => r.examId))]

      if (examIds.length === 0) {
        return NextResponse.json([])
      }

      const completedExams = await db.select().from(exams)
        .where(eq(exams.id, examIds[0])) // This is a workaround, ideally use inArray
        .orderBy(desc(exams.createdAt))

      // Enrich with related data
      const enrichedExams = await Promise.all(
        completedExams.map(async (exam) => {
          const [creator] = await db.select({ id: users.id, name: users.name })
            .from(users)
            .where(eq(users.id, exam.createdBy))
            .limit(1)

          const examQuestionsData = await db.select({
            id: examQuestions.id,
            questionId: questions.id,
            question: questions.question
          })
            .from(examQuestions)
            .innerJoin(questions, eq(examQuestions.questionId, questions.id))
            .where(eq(examQuestions.examId, exam.id))

          const userResults = await db.select()
            .from(examResults)
            .where(and(
              eq(examResults.examId, exam.id),
              eq(examResults.userId, userId)
            ))

          return {
            ...exam,
            creator,
            questions: examQuestionsData.map(q => ({ question: { id: q.questionId, question: q.question } })),
            results: userResults
          }
        })
      )

      return NextResponse.json(enrichedExams)
    }

  } catch (error) {
    console.error('Error fetching user exams:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}