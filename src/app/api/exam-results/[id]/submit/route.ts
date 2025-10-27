import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { examResults, exams, examQuestions, questions } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { answers } = await request.json()

    // Get exam result
    const [examResult] = await db.select().from(examResults).where(eq(examResults.id, id)).limit(1)

    if (!examResult) {
      return NextResponse.json(
        { error: 'Exam result not found' },
        { status: 404 }
      )
    }

    if (examResult.status === 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Ujian sudah dikumpulkan' },
        { status: 400 }
      )
    }

    // Get exam questions with correct answers
    const examQuestionsData = await db.select({
      questionId: questions.id,
      correctAnswer: questions.correctAnswer
    })
      .from(examQuestions)
      .innerJoin(questions, eq(examQuestions.questionId, questions.id))
      .where(eq(examQuestions.examId, examResult.examId))
      .orderBy(asc(examQuestions.order))

    // Calculate score
    let correctAnswers = 0
    const totalQuestions = examQuestionsData.length

    examQuestionsData.forEach((question) => {
      const userAnswer = answers[question.questionId]
      
      if (userAnswer === question.correctAnswer) {
        correctAnswers++
      }
    })

    const score = correctAnswers * 10 // 10 points per question
    const maxScore = totalQuestions * 10

    // Update exam result
    const [updatedResult] = await db.update(examResults)
      .set({
        score,
        maxScore,
        answers: JSON.stringify(answers),
        submittedAt: new Date(),
        status: 'SUBMITTED'
      })
      .where(eq(examResults.id, id))
      .returning()

    // Get exam info
    const [exam] = await db.select({
      id: exams.id,
      title: exams.title
    }).from(exams).where(eq(exams.id, updatedResult.examId)).limit(1)

    return NextResponse.json({
      ...updatedResult,
      exam
    })
  } catch (error) {
    console.error('Error submitting exam:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}