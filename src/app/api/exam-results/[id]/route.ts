import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { examResults, exams, examQuestions, questions, users } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const [examResult] = await db.select().from(examResults).where(eq(examResults.id, id)).limit(1)

    if (!examResult) {
      return NextResponse.json(
        { error: 'Exam result not found' },
        { status: 404 }
      )
    }

    // Get exam with questions
    const [exam] = await db.select().from(exams).where(eq(exams.id, examResult.examId)).limit(1)
    
    const examQuestionsData = await db.select({
      id: examQuestions.id,
      order: examQuestions.order,
      questionId: questions.id,
      question: questions.question,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      category: questions.category,
      difficulty: questions.difficulty
    })
      .from(examQuestions)
      .innerJoin(questions, eq(examQuestions.questionId, questions.id))
      .where(eq(examQuestions.examId, examResult.examId))
      .orderBy(asc(examQuestions.order))

    // Get user
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email
    }).from(users).where(eq(users.id, examResult.userId)).limit(1)

    const enrichedResult = {
      ...examResult,
      exam: {
        ...exam,
        questions: examQuestionsData.map(q => ({
          id: q.id,
          order: q.order,
          question: {
            id: q.questionId,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            category: q.category,
            difficulty: q.difficulty
          }
        }))
      },
      user
    }

    return NextResponse.json(enrichedResult)
  } catch (error) {
    console.error('Error fetching exam result:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}