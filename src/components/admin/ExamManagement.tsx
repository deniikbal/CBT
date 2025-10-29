'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Edit, Trash2, Clock, Users, Play, Square } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  category?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

interface Exam {
  id: string
  title: string
  description?: string
  duration: number
  startDate: string
  endDate: string
  isActive: boolean
  createdBy: string
  createdAt: string
  _count: {
    questions: number
    results: number
  }
}

export default function ExamManagement() {
  const [exams, setExams] = useState<Exam[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    startDate: '',
    endDate: '',
    isActive: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [examsResponse, questionsResponse] = await Promise.all([
        fetch('/api/exams'),
        fetch('/api/questions')
      ])

      if (examsResponse.ok) {
        const examsData = await examsResponse.json()
        setExams(examsData)
      }

      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json()
        setQuestions(questionsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        questionIds: selectedQuestions
      }

      const url = editingExam ? `/api/exams/${editingExam.id}` : '/api/exams'
      const method = editingExam ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchData()
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving exam:', error)
    }
  }

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam)
    setFormData({
      title: exam.title,
      description: exam.description || '',
      duration: exam.duration,
      startDate: new Date(exam.startDate).toISOString().slice(0, 16),
      endDate: new Date(exam.endDate).toISOString().slice(0, 16),
      isActive: exam.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus ujian ini?')) {
      try {
        const response = await fetch(`/api/exams/${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          await fetchData()
        }
      } catch (error) {
        console.error('Error deleting exam:', error)
      }
    }
  }

  const toggleExamStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/exams/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error toggling exam status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration: 60,
      startDate: '',
      endDate: '',
      isActive: true
    })
    setSelectedQuestions([])
    setEditingExam(null)
  }

  const handleQuestionToggle = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions([...selectedQuestions, questionId])
    } else {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId))
    }
  }

  const getStatusColor = (isActive: boolean, startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (!isActive) return 'bg-gray-100 text-gray-800'
    if (now < start) return 'bg-blue-100 text-blue-800'
    if (now > end) return 'bg-red-100 text-red-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (isActive: boolean, startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (!isActive) return 'Nonaktif'
    if (now < start) return 'Akan Datang'
    if (now > end) return 'Selesai'
    return 'Sedang Berlangsung'
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Manajemen Ujian</h3>
          <p className="text-sm text-gray-600">Buat dan kelola jadwal ujian</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Ujian Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExam ? 'Edit Ujian' : 'Buat Ujian Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingExam ? 'Edit ujian yang sudah ada' : 'Buat ujian baru dengan soal pilihan'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Ujian</Label>
                  <Input
                    id="title"
                    placeholder="contoh: Ujian Matematika Semester 1"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Waktu Mulai</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pilih Soal</Label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {questions.length === 0 ? (
                    <p className="text-gray-500 text-center">Belum ada soal tersedia</p>
                  ) : (
                    <div className="space-y-2">
                      {questions.map((question) => (
                        <div key={question.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={question.id}
                            checked={selectedQuestions.includes(question.id)}
                            onCheckedChange={(checked) => 
                              handleQuestionToggle(question.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor={question.id} className="text-sm font-medium cursor-pointer">
                              {question.question}
                            </Label>
                            <div className="flex gap-2 mt-1">
                              {question.category && (
                                <Badge variant="outline" className="text-xs">{question.category}</Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {question.difficulty === 'EASY' ? 'Mudah' : 
                                 question.difficulty === 'MEDIUM' ? 'Sedang' : 'Sulit'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {selectedQuestions.length} soal dipilih
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="isActive">Aktifkan ujian</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={selectedQuestions.length === 0}>
                  {editingExam ? 'Update' : 'Buat'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {exams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Belum ada ujian</p>
              <p className="text-sm text-gray-500">Buat ujian pertama untuk memulai</p>
            </CardContent>
          </Card>
        ) : (
          exams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base">{exam.title}</CardTitle>
                    {exam.description && (
                      <CardDescription className="mt-1">{exam.description}</CardDescription>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge className={getStatusColor(exam.isActive, exam.startDate, exam.endDate)}>
                        {getStatusText(exam.isActive, exam.startDate, exam.endDate)}
                      </Badge>
                      <Badge variant="outline">
                        {exam._count.questions} soal
                      </Badge>
                      <Badge variant="outline">
                        {exam.duration} menit
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExamStatus(exam.id, !exam.isActive)}
                    >
                      {exam.isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(exam)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exam.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                  <div>
                    <p className="text-gray-600">Durasi</p>
                    <p className="font-medium">{exam.duration} menit</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Peserta</p>
                    <p className="font-medium">{exam._count.results} orang</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}