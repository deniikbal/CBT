'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, BookOpen } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  category?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  createdAt: string
}

interface QuestionListProps {
  refreshTrigger: number
}

export function QuestionList({ refreshTrigger }: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuestions()
  }, [refreshTrigger])

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return

    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== id))
      } else {
        alert('Gagal menghapus soal')
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HARD': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'Mudah'
      case 'MEDIUM': return 'Sedang'
      case 'HARD': return 'Sulit'
      default: return difficulty
    }
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

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada soal</h3>
          <p className="text-gray-500 text-center">Mulai dengan menambahkan soal pertama ke bank soal</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-base">{question.question}</CardTitle>
                <div className="flex gap-2 mt-2">
                  {question.category && (
                    <Badge variant="outline">{question.category}</Badge>
                  )}
                  <Badge className={getDifficultyColor(question.difficulty)}>
                    {getDifficultyText(question.difficulty)}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(question.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {JSON.parse(question.options).map((option: string, index: number) => (
                <div 
                  key={index} 
                  className={`p-2 rounded border ${
                    option === question.correctAnswer 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                  {option === question.correctAnswer && (
                    <Badge className="ml-2 bg-green-600">Benar</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}