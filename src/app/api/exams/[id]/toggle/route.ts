import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exams } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isActive } = await request.json()
    const { id } = params

    const [updatedExam] = await db.update(exams)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(exams.id, id))
      .returning()

    return NextResponse.json(updatedExam)
  } catch (error) {
    console.error('Error toggling exam status:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}