'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

interface AddQuestionModalProps {
  onQuestionAdded: () => void
}

export function AddQuestionModal({ onQuestionAdded }: AddQuestionModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    category: '',
    difficulty: 'MEDIUM'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          options: JSON.stringify(formData.options)
        })
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          question: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          category: '',
          difficulty: 'MEDIUM'
        })
        onQuestionAdded()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal menambah soal')
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Soal Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Soal Baru</DialogTitle>
          <DialogDescription>
            Tambahkan soal baru ke bank soal
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Pertanyaan</Label>
            <Textarea
              id="question"
              placeholder="Masukkan pertanyaan..."
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Opsi Jawaban</Label>
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-8 text-sm font-medium">{String.fromCharCode(65 + index)}.</span>
                <Input
                  placeholder={`Opsi ${String.fromCharCode(65 + index)}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="correctAnswer">Jawaban Benar</Label>
            <Select value={formData.correctAnswer} onValueChange={(value) => setFormData({ ...formData, correctAnswer: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jawaban benar" />
              </SelectTrigger>
              <SelectContent>
                {formData.options
                  .filter(option => option && option.trim() !== '')
                  .map((option, idx) => {
                    const originalIndex = formData.options.indexOf(option)
                    return (
                      <SelectItem key={originalIndex} value={option}>
                        {String.fromCharCode(65 + originalIndex)}. {option}
                      </SelectItem>
                    )
                  })
                }
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                placeholder="Contoh: Matematika"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Tingkat Kesulitan</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Mudah</SelectItem>
                  <SelectItem value="MEDIUM">Sedang</SelectItem>
                  <SelectItem value="HARD">Sulit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Soal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}