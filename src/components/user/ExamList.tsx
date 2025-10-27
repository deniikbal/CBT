'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Play, CheckCircle, AlertCircle } from 'lucide-react'

interface Exam {
  id: string
  title: string
  description?: string
  duration: number
  startDate: string
  endDate: string
  isActive: boolean
  _count: {
    questions: number
  }
}

interface ExamResult {
  id: string
  examId: string
  score: number
  maxScore: number
  submittedAt: string
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'EXPIRED'
}

interface ExamListProps {
  type: 'available' | 'completed'
  userId: string
}

export default function ExamList({ type, userId }: ExamListProps) {
  const [exams, setExams] = useState<Exam[]>([])
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [examsResponse, resultsResponse] = await Promise.all([
        fetch('/api/exams'),
        fetch(`/api/exam-results?userId=${userId}`)
      ])

      if (examsResponse.ok) {
        const examsData = await examsResponse.json()
        setExams(examsData)
      }

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json()
        setExamResults(resultsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getExamStatus = (exam: Exam) => {
    const now = new Date()
    const start = new Date(exam.startDate)
    const end = new Date(exam.endDate)

    if (!exam.isActive) return { status: 'inactive', text: 'Nonaktif', color: 'bg-gray-100 text-gray-800' }
    if (now < start) return { status: 'upcoming', text: 'Akan Datang', color: 'bg-blue-100 text-blue-800' }
    if (now > end) return { status: 'ended', text: 'Selesai', color: 'bg-red-100 text-red-800' }
    return { status: 'active', text: 'Sedang Berlangsung', color: 'bg-green-100 text-green-800' }
  }

  const hasUserTakenExam = (examId: string) => {
    return examResults.some(result => result.examId === examId && result.status === 'SUBMITTED')
  }

  const getUserExamResult = (examId: string) => {
    return examResults.find(result => result.examId === examId)
  }

  const isExamAvailable = (exam: Exam) => {
    const now = new Date()
    const start = new Date(exam.startDate)
    const end = new Date(exam.endDate)
    return exam.isActive && now >= start && now <= end && !hasUserTakenExam(exam.id)
  }

  const startExam = async (examId: string) => {
    try {
      const response = await fetch('/api/exam-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          userId
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Redirect to exam page
        window.location.href = `/exam/${examId}`
      }
    } catch (error) {
      console.error('Error starting exam:', error)
    }
  }

  const filteredExams = type === 'available' 
    ? exams.filter(exam => isExamAvailable(exam))
    : exams.filter(exam => hasUserTakenExam(exam.id))

  if (loading) {
    return <div className="flex justify-center p-8">Memuat...</div>
  }

  if (filteredExams.length === 0) {
    return (
      <div className="text-center py-12">
        {type === 'available' ? (
          <>
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada ujian tersedia</h3>
            <p className="text-gray-500">Ujian akan muncul di sini ketika tersedia</p>
          </>
        ) : (
          <>
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada riwayat ujian</h3>
            <p className="text-gray-500">Ujian yang telah selesai akan muncul di sini</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredExams.map((exam) => {
        const examStatus = getExamStatus(exam)
        const userResult = getUserExamResult(exam.id)

        return (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-base">{exam.title}</CardTitle>
                  {exam.description && (
                    <CardDescription className="mt-1">{exam.description}</CardDescription>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge className={examStatus.color}>
                      {examStatus.text}
                    </Badge>
                    <Badge variant="outline">
                      {exam._count.questions} soal
                    </Badge>
                    <Badge variant="outline">
                      {exam.duration} menit
                    </Badge>
                  </div>
                </div>
                {type === 'available' ? (
                  <Button
                    onClick={() => startExam(exam.id)}
                    disabled={examStatus.status !== 'active'}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {examStatus.status === 'active' ? 'Kerjakan' : 
                     examStatus.status === 'upcoming' ? 'Belum Dimulai' : 'Selesai'}
                  </Button>
                ) : (
                  <div className="text-right">
                    {userResult && (
                      <>
                        <div className="text-2xl font-bold text-green-600">
                          {userResult.score}/{userResult.maxScore}
                        </div>
                        <div className="text-sm text-gray-600">
                          {Math.round((userResult.score / userResult.maxScore) * 100)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(userResult.submittedAt).toLocaleString('id-ID')}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Mulai</p>
                  <p className="font-medium">
                    {new Date(exam.startDate).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Selesai</p>
                  <p className="font-medium">
                    {new Date(exam.endDate).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              
              {type === 'available' && examStatus.status === 'active' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">
                      Ujian sedang berlangsung. Klik "Kerjakan" untuk memulai.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}