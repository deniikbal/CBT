import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exams, examQuestions as examQuestionsTable, examResults } from '@/db/schema'
import { desc, eq, count } from 'drizzle-orm'

export async function GET() {
  try {
    const allExams = await db.select().from(exams).orderBy(desc(exams.createdAt))

    // Get counts for each exam
    const examsWithCounts = await Promise.all(
      allExams.map(async (exam) => {
        const [questionCount] = await db.select({ count: count() }).from(examQuestionsTable).where(eq(examQuestionsTable.examId, exam.id))
        const [resultCount] = await db.select({ count: count() }).from(examResults).where(eq(examResults.examId, exam.id))

        return {
          ...exam,
          _count: {
            questions: questionCount?.count || 0,
            results: resultCount?.count || 0
          }
        }
      })
    )

    return NextResponse.json(examsWithCounts)
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, duration, startDate, endDate, questionIds, isActive } = await request.json()
    const user = JSON.parse(request.headers.get('x-user') || '{}')

    if (!title || !duration || !startDate || !endDate || !questionIds || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'Title, duration, start date, end date, and questions are required' },
        { status: 400 }
      )
    }

    const [exam] = await db.insert(exams).values({
      title,
      description: description || null,
      duration: parseInt(duration),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive !== undefined ? isActive : true,
      createdBy: user.id || 'admin'
    }).returning()

    // Add questions to exam
    const examQuestionsData = questionIds.map((questionId: string, index: number) => ({
      examId: exam.id,
      questionId,
      order: index + 1
    }))

    await db.insert(examQuestionsTable).values(examQuestionsData)

    // Get counts
    const [questionCount] = await db.select({ count: count() }).from(examQuestionsTable).where(eq(examQuestionsTable.examId, exam.id))
    const [resultCount] = await db.select({ count: count() }).from(examResults).where(eq(examResults.examId, exam.id))

    const createdExam = {
      ...exam,
      _count: {
        questions: questionCount?.count || 0,
        results: resultCount?.count || 0
      }
    }

    return NextResponse.json(createdExam)
  } catch (error) {
    console.error('Error creating exam:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}