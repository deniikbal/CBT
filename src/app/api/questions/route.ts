import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { questions } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const allQuestions = await db.select().from(questions).orderBy(desc(questions.createdAt))

    const questionsWithParsedOptions = allQuestions.map(question => ({
      ...question,
      options: JSON.parse(question.options)
    }))

    return NextResponse.json(questionsWithParsedOptions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { question, options, correctAnswer, category, difficulty } = await request.json()

    if (!question || !options || !correctAnswer) {
      return NextResponse.json(
        { error: 'Question, options, and correct answer are required' },
        { status: 400 }
      )
    }

    const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options

    if (!Array.isArray(parsedOptions) || parsedOptions.length !== 4) {
      return NextResponse.json(
        { error: 'Options must be an array of 4 items' },
        { status: 400 }
      )
    }

    if (!parsedOptions.includes(correctAnswer)) {
      return NextResponse.json(
        { error: 'Correct answer must be one of the options' },
        { status: 400 }
      )
    }

    const [newQuestion] = await db.insert(questions).values({
      question,
      options: JSON.stringify(parsedOptions),
      correctAnswer,
      category: category || null,
      difficulty: difficulty || 'MEDIUM'
    }).returning()

    const questionWithParsedOptions = {
      ...newQuestion,
      options: JSON.parse(newQuestion.options)
    }

    return NextResponse.json(questionWithParsedOptions)
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}