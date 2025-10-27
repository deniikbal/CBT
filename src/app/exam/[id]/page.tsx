'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
}

interface ExamResult {
  id: string
  examId: string
  userId: string
  score: number
  maxScore: number
  answers: Record<string, string>
  startedAt: string
  submittedAt: string
  status: string
}

interface Exam {
  id: string
  title: string
  description?: string
  duration: number
  questions: Array<{
    question: Question
    order: number
  }>
}

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const examResultId = params.id as string

  const [exam, setExam] = useState<Exam | null>(null)
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  useEffect(() => {
    fetchExamData()
  }, [examResultId])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && examResult) {
      handleSubmit(true) // Auto submit when time is up
    }
  }, [timeLeft])

  const fetchExamData = async () => {
    try {
      // Get exam result
      const resultResponse = await fetch(`/api/exam-results/${examResultId}`)
      if (!resultResponse.ok) {
        router.push('/')
        return
      }

      const resultData = await resultResponse.json()
      setExamResult(resultData)

      // Get exam details with questions
      const examResponse = await fetch(`/api/exams/${resultData.examId}`)
      if (examResponse.ok) {
        const examData = await examResponse.json()
        setExam(examData)

        // Calculate time left
        const endTime = new Date(resultData.submittedAt).getTime()
        const now = new Date().getTime()
        const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000))
        setTimeLeft(timeRemaining)

        // Load existing answers
        if (resultData.answers) {
          setAnswers(typeof resultData.answers === 'string' ? JSON.parse(resultData.answers) : resultData.answers)
        }
      }
    } catch (error) {
      console.error('Error fetching exam data:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (exam && currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit && !showConfirmSubmit) {
      setShowConfirmSubmit(true)
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/exam-results/${examResultId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Ujian berhasil disubmit!')
        router.push(`/exam/${examResultId}/result`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal submit ujian')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const answeredQuestions = Object.keys(answers).length
  const totalQuestions = exam?.questions.length || 0
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat ujian...</p>
        </div>
      </div>
    )
  }

  if (!exam || !examResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <p className="text-center text-gray-600">Ujian tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestionData = exam.questions[currentQuestion]?.question

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">{exam.title}</h1>
              <div className="text-sm text-gray-600">
                Soal {currentQuestion + 1} dari {totalQuestions}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${timeLeft < 300 ? 'text-red-600' : 'text-gray-600'}`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmSubmit(true)}
                disabled={submitting}
              >
                {submitting ? 'Mengumpulkan...' : 'Selesai'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm text-gray-600">{answeredQuestions}/{totalQuestions} soal dijawab</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Soal {currentQuestion + 1}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-base leading-relaxed">
                {currentQuestionData?.question}
              </div>

              <RadioGroup
                value={answers[currentQuestionData?.id || ''] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestionData?.id || '', value)}
              >
                {currentQuestionData?.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {String.fromCharCode(65 + index)}. {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Sebelumnya
          </Button>

          <div className="flex gap-2">
            {Array.from({ length: totalQuestions }, (_, i) => (
              <Button
                key={i}
                variant={i === currentQuestion ? "default" : answers[exam.questions[i]?.question?.id] ? "secondary" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestion(i)}
                className="w-10 h-10"
              >
                {i + 1}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={currentQuestion === totalQuestions - 1}
          >
            Selanjutnya
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </main>

      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Konfirmasi Pengumpulan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Anda telah menjawab {answeredQuestions} dari {totalQuestions} soal.
                  {answeredQuestions < totalQuestions && ' Ada soal yang belum dijawab.'}
                </p>
                <p className="text-sm text-gray-500">
                  Setelah dikumpulkan, Anda tidak dapat mengubah jawaban lagi.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmSubmit(false)}
                    disabled={submitting}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={submitting}
                  >
                    {submitting ? 'Mengumpulkan...' : 'Kumpulkan'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}