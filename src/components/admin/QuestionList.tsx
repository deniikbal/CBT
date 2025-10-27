'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Edit } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string
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
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
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
      <Card>
        <CardHeader>
          <CardTitle>Bank Soal</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Soal ({questions.length})</CardTitle>
        <CardDescription>Daftar semua soal yang tersedia</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {questions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Belum ada soal tersedia</p>
            ) : (
              questions.map((question) => {
                const options = JSON.parse(question.options)
                return (
                  <div key={question.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm flex-1">{question.question}</p>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {options.map((option: string, index: number) => (
                        <div key={index} className={`text-xs p-2 rounded ${option === question.correctAnswer ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                          {option === question.correctAnswer && (
                            <Badge variant="secondary" className="ml-2 text-xs">Benar</Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      {question.category && (
                        <Badge variant="outline" className="text-xs">{question.category}</Badge>
                      )}
                      <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                        {getDifficultyText(question.difficulty)}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}