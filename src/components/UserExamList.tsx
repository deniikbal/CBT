'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Play, CheckCircle, Calendar } from 'lucide-react'

interface Exam {
  id: string
  title: string
  description?: string
  duration: number
  startDate: string
  endDate: string
  isActive: boolean
  creator: {
    name: string
  }
  questions: Array<{
    question: {
      id: string
      question: string
    }
  }>
  results: Array<{
    id: string
    score: number
    maxScore: number
    status: string
    submittedAt: string
  }>
}

interface UserExamListProps {
  userId: string
  type: 'available' | 'completed'
}

export function UserExamList({ userId, type }: UserExamListProps) {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExams()
  }, [userId, type])

  const fetchExams = async () => {
    try {
      const response = await fetch(`/api/user/exams?userId=${userId}&type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setExams(data)
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = async (examId: string) => {
    try {
      const response = await fetch('/api/user/exams/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, userId })
      })

      if (response.ok) {
        const result = await response.json()
        // Redirect to exam page
        window.location.href = `/exam/${result.id}`
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal memulai ujian')
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'Selesai'
      case 'IN_PROGRESS': return 'Sedang Dikerjakan'
      case 'EXPIRED': return 'Kadaluarsa'
      default: return status
    }
  }

  const isExamAvailable = (exam: Exam) => {
    const now = new Date()
    const start = new Date(exam.startDate)
    const end = new Date(exam.endDate)
    return exam.isActive && now >= start && now <= end
  }

  const hasUserTakenExam = (exam: Exam) => {
    return exam.results.some(result => result.userId === userId)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const filteredExams = type === 'available' 
    ? exams.filter(exam => isExamAvailable(exam) && !hasUserTakenExam(exam))
    : exams.filter(exam => hasUserTakenExam(exam))

  if (filteredExams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          {type === 'available' ? (
            <>
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada ujian tersedia</h3>
              <p className="text-gray-500 text-center">Tidak ada ujian yang tersedia saat ini</p>
            </>
          ) : (
            <>
              <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada riwayat ujian</h3>
              <p className="text-gray-500 text-center">Anda belum mengerjakan ujian apa pun</p>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {filteredExams.map((exam) => (
        <Card key={exam.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-base">{exam.title}</CardTitle>
                {exam.description && (
                  <CardDescription className="mt-1">{exam.description}</CardDescription>
                )}
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {exam.duration} menit
                  </Badge>
                  <Badge variant="outline">
                    {exam.questions.length} soal
                  </Badge>
                  {type === 'completed' && exam.results[0] && (
                    <Badge className={getStatusColor(exam.results[0].status)}>
                      {getStatusText(exam.results[0].status)}
                    </Badge>
                  )}
                </div>
              </div>
              {type === 'available' ? (
                <Button onClick={() => handleStartExam(exam.id)}>
                  <Play className="h-4 w-4 mr-2" />
                  Mulai
                </Button>
              ) : (
                <div className="text-right">
                  {exam.results[0] && (
                    <>
                      <div className="text-2xl font-bold">
                        {exam.results[0].score}/{exam.results[0].maxScore}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(exam.results[0].submittedAt).toLocaleDateString('id-ID')}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Dibuat oleh: {exam.creator.name}</span>
                <span>
                  {new Date(exam.startDate).toLocaleDateString('id-ID')} - {new Date(exam.endDate).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}