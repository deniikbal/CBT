'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  category?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

interface CreateExamModalProps {
  onExamCreated: () => void
}

export function CreateExamModal({ onExamCreated }: CreateExamModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    if (open) {
      fetchQuestions()
    }
  }, [open])

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (selectedQuestions.length === 0) {
      alert('Pilih minimal satu soal untuk ujian')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          questions: selectedQuestions.map((id, index) => ({
            questionId: id,
            order: index + 1
          }))
        })
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          title: '',
          description: '',
          duration: 60,
          startDate: '',
          endDate: ''
        })
        setSelectedQuestions([])
        onExamCreated()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal membuat ujian')
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const getDateTimeLocal = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  const getDateTimeLocalPlusHours = (hours: number) => {
    const now = new Date()
    now.setHours(now.getHours() + hours)
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Buat Ujian Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Ujian Baru</DialogTitle>
          <DialogDescription>
            Buat ujian baru dengan memilih soal dari bank soal
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Ujian</Label>
              <Input
                id="title"
                placeholder="Contoh: Ujian Matematika Semester 1"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Durasi (menit)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="60"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Deskripsi ujian (opsional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Waktu Mulai</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                min={getDateTimeLocal()}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Waktu Selesai</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate || getDateTimeLocal()}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Pilih Soal ({selectedQuestions.length} dipilih)</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedQuestions(questions.map(q => q.id))}
              >
                Pilih Semua
              </Button>
            </div>
            
            <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-3">
              {questions.length === 0 ? (
                <p className="text-center text-gray-500">Belum ada soal di bank soal</p>
              ) : (
                questions.map((question) => (
                  <div key={question.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={question.id}
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={() => handleQuestionToggle(question.id)}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={question.id} 
                        className="text-sm font-medium cursor-pointer"
                      >
                        {question.question}
                      </label>
                      <div className="flex gap-2 mt-1">
                        {question.category && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {question.category}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          question.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty === 'EASY' ? 'Mudah' :
                           question.difficulty === 'MEDIUM' ? 'Sedang' : 'Sulit'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || selectedQuestions.length === 0}>
              {loading ? 'Membuat...' : 'Buat Ujian'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}