'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, ChevronLeft, ChevronRight, Flag } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string
  correctAnswer: string
}

interface ExamQuestion {
  id: string
  order: number
  question: Question
}

interface Exam {
  id: string
  title: string
  description?: string
  duration: number
  startDate: string
  endDate: string
  questions: ExamQuestion[]
}

interface ExamInterfaceProps {
  exam: Exam
  userId: string
  onExamComplete: (result: any) => void
  onBack: () => void
}

export function ExamInterface({ exam, userId, onExamComplete, onBack }: ExamInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(exam.duration * 60) // Convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const currentQuestion = exam.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitted) return

    setIsSubmitted(true)

    try {
      // Calculate score
      let score = 0
      exam.questions.forEach((examQuestion) => {
        const userAnswer = answers[examQuestion.question.id]
        if (userAnswer === examQuestion.question.correctAnswer) {
          score++
        }
      })

      const resultData = {
        userId,
        examId: exam.id,
        score,
        maxScore: exam.questions.length,
        answers: JSON.stringify(answers),
        startedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        status: 'SUBMITTED'
      }

      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData)
      })

      if (response.ok) {
        const result = await response.json()
        onExamComplete(result)
      } else {
        alert('Gagal menyimpan hasil ujian')
      }
    } catch (error) {
      console.error('Error submitting exam:', error)
      alert('Terjadi kesalahan saat mengirim ujian')
    }
  }

  const answeredQuestions = Object.keys(answers).length
  const unansweredQuestions = exam.questions.length - answeredQuestions

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Ujian Selesai!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Terima kasih telah menyelesaikan ujian.</p>
            <Button onClick={() => onBack()}>Kembali ke Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="font-semibold">{exam.title}</h1>
                <p className="text-sm text-gray-600">
                  Soal {currentQuestionIndex + 1} dari {exam.questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(true)}
                disabled={answeredQuestions === 0}
              >
                Selesai
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigasi Soal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {exam.questions.map((examQuestion, index) => {
                    const isAnswered = answers[examQuestion.question.id]
                    const isCurrent = index === currentQuestionIndex
                    
                    return (
                      <Button
                        key={examQuestion.id}
                        variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                        size="sm"
                        className="aspect-square p-0"
                        onClick={() => setCurrentQuestionIndex(index)}
                      >
                        {index + 1}
                      </Button>
                    )
                  })}
                </div>
                
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Soal saat ini</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <span>Sudah dijawab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border rounded"></div>
                    <span>Belum dijawab</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Statistik</p>
                  <p className="text-xs text-gray-600">Dijawab: {answeredQuestions}/{exam.questions.length}</p>
                  <p className="text-xs text-gray-600">Belum: {unansweredQuestions}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Soal {currentQuestionIndex + 1}
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-lg leading-relaxed mb-6">
                    {currentQuestion.question.question}
                  </p>

                  <RadioGroup
                    value={answers[currentQuestion.question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.question.id, value)}
                  >
                    {JSON.parse(currentQuestion.question.options).map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Sebelumnya
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={currentQuestionIndex === exam.questions.length - 1}
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Konfirmasi Pengiriman</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {unansweredQuestions > 0 && (
                <Alert>
                  <AlertDescription>
                    Anda masih memiliki {unansweredQuestions} soal yang belum dijawab. 
                    Apakah Anda yakin ingin mengirim ujian?
                  </AlertDescription>
                </Alert>
              )}
              
              <p className="text-sm text-gray-600">
                Setelah mengirim ujian, Anda tidak dapat mengubah jawaban lagi.
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleSubmit}>
                  Ya, Kirim Ujian
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}