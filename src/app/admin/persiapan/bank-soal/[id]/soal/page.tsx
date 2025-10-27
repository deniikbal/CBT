'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Edit, Trash2, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface BankSoal {
  id: string
  kodeBankSoal: string
  jumlahSoal: number
  mataPelajaran: {
    name: string
    kodeMatpel: string
  } | null
}

interface Soal {
  id: string
  bankSoalId: string
  nomorSoal: number
  soal: string
  pilihanA: string
  pilihanB: string
  pilihanC: string
  pilihanD: string
  pilihanE: string | null
  jawabanBenar: 'A' | 'B' | 'C' | 'D' | 'E'
  pembahasan: string | null
}

export default function KelolaSoalPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: bankSoalId } = use(params)

  const [bankSoal, setBankSoal] = useState<BankSoal | null>(null)
  const [soalList, setSoalList] = useState<Soal[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nomorSoal: 0,
    soal: '',
    pilihanA: '',
    pilihanB: '',
    pilihanC: '',
    pilihanD: '',
    pilihanE: '',
    jawabanBenar: 'A' as 'A' | 'B' | 'C' | 'D' | 'E',
    pembahasan: ''
  })

  useEffect(() => {
    fetchBankSoal()
    fetchSoal()
  }, [])

  const fetchBankSoal = async () => {
    try {
      const response = await fetch(`/api/bank-soal/${bankSoalId}`)
      if (response.ok) {
        const data = await response.json()
        setBankSoal(data)
      } else {
        toast.error('Bank soal tidak ditemukan')
        router.push('/admin/persiapan/bank-soal')
      }
    } catch (error) {
      console.error('Error fetching bank soal:', error)
      toast.error('Gagal memuat data bank soal')
    }
  }

  const fetchSoal = async () => {
    try {
      const response = await fetch(`/api/bank-soal/${bankSoalId}/soal`)
      if (response.ok) {
        const data = await response.json()
        setSoalList(data)
      }
    } catch (error) {
      console.error('Error fetching soal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingId 
        ? `/api/bank-soal/${bankSoalId}/soal/${editingId}` 
        : `/api/bank-soal/${bankSoalId}/soal`
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchSoal()
        setIsDialogOpen(false)
        resetForm()
        toast.success(editingId ? 'Soal berhasil diupdate' : 'Soal berhasil ditambahkan')
      } else {
        toast.error(data.error || 'Terjadi kesalahan saat menyimpan soal')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleEdit = (soal: Soal) => {
    setEditingId(soal.id)
    setFormData({
      nomorSoal: soal.nomorSoal,
      soal: soal.soal,
      pilihanA: soal.pilihanA,
      pilihanB: soal.pilihanB,
      pilihanC: soal.pilihanC,
      pilihanD: soal.pilihanD,
      pilihanE: soal.pilihanE || '',
      jawabanBenar: soal.jawabanBenar,
      pembahasan: soal.pembahasan || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return

    try {
      const response = await fetch(`/api/bank-soal/${bankSoalId}/soal/${id}`, { 
        method: 'DELETE' 
      })
      const data = await response.json()

      if (response.ok) {
        await fetchSoal()
        toast.success('Soal berhasil dihapus')
      } else {
        toast.error(data.error || 'Gagal menghapus soal')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat menghapus soal')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      nomorSoal: 0,
      soal: '',
      pilihanA: '',
      pilihanB: '',
      pilihanC: '',
      pilihanD: '',
      pilihanE: '',
      jawabanBenar: 'A',
      pembahasan: ''
    })
  }

  const handleOpenDialog = () => {
    resetForm()
    // Auto set nomor soal
    const nextNomor = soalList.length > 0 
      ? Math.max(...soalList.map(s => s.nomorSoal)) + 1 
      : 1
    setFormData(prev => ({ ...prev, nomorSoal: nextNomor }))
    setIsDialogOpen(true)
  }

  if (loading || !bankSoal) {
    return (
      <div className="p-8">
        <div>Loading...</div>
      </div>
    )
  }

  const soalCount = soalList.length
  const targetSoal = bankSoal.jumlahSoal
  const percentage = targetSoal > 0 ? Math.round((soalCount / targetSoal) * 100) : 0

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/admin/persiapan/bank-soal')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Bank Soal
        </Button>
      </div>

      {/* Header Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-2xl">Kelola Soal</CardTitle>
          <CardDescription>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Bank Soal:</span>
                <span className="text-lg font-bold text-blue-600">{bankSoal.kodeBankSoal}</span>
              </div>
              {bankSoal.mataPelajaran && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Mata Pelajaran:</span>
                  <Badge variant="secondary">
                    {bankSoal.mataPelajaran.kodeMatpel}
                  </Badge>
                  <span className="text-gray-700">{bankSoal.mataPelajaran.name}</span>
                </div>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Target Soal</div>
              <div className="text-3xl font-bold text-gray-800">{targetSoal}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Soal Terbuat</div>
              <div className="text-3xl font-bold text-blue-600">{soalCount}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-green-600">{percentage}%</div>
                {percentage >= 100 && (
                  <CheckCircle2 className="h-6 w-6 text-green-600 mb-1" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Daftar Soal</h2>
        <Button onClick={handleOpenDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Soal
        </Button>
      </div>

      {/* Soal List */}
      <Card>
        <CardContent className="pt-6">
          {soalList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium">Belum ada soal</p>
              <p className="text-sm mt-1">Klik tombol "Tambah Soal" untuk membuat soal baru</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Soal</TableHead>
                  <TableHead className="w-24">Jawaban</TableHead>
                  <TableHead className="w-32 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soalList.map((soal) => (
                  <TableRow key={soal.id}>
                    <TableCell className="font-medium">{soal.nomorSoal}</TableCell>
                    <TableCell>
                      <div className="max-w-2xl">
                        <p className="text-sm line-clamp-2">{soal.soal}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold">
                        {soal.jawabanBenar}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(soal)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(soal.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Soal' : 'Tambah Soal Baru'}
            </DialogTitle>
            <DialogDescription>
              Isi form di bawah untuk {editingId ? 'mengupdate' : 'menambah'} soal
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nomor Soal */}
            <div className="space-y-2">
              <Label htmlFor="nomorSoal">Nomor Soal</Label>
              <Input
                id="nomorSoal"
                type="number"
                min="1"
                value={formData.nomorSoal}
                onChange={(e) => setFormData({ ...formData, nomorSoal: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            {/* Soal */}
            <div className="space-y-2">
              <Label htmlFor="soal">Soal / Pertanyaan *</Label>
              <Textarea
                id="soal"
                placeholder="Tulis soal atau pertanyaan di sini..."
                value={formData.soal}
                onChange={(e) => setFormData({ ...formData, soal: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Pilihan Jawaban dan Jawaban Benar */}
            <div className="space-y-3">
              <Label>Pilihan Jawaban (Pilih jawaban benar dengan radio button) *</Label>
              
              <RadioGroup 
                value={formData.jawabanBenar} 
                onValueChange={(value: any) => setFormData({ ...formData, jawabanBenar: value })}
                className="space-y-2"
              >
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="A" id="jawaban-a" className="mt-2" />
                  <Label htmlFor="jawaban-a" className="font-semibold mt-2 cursor-pointer">A.</Label>
                  <Input
                    placeholder="Pilihan A"
                    value={formData.pilihanA}
                    onChange={(e) => setFormData({ ...formData, pilihanA: e.target.value })}
                    required
                    className="flex-1"
                  />
                </div>

                <div className="flex items-start gap-2">
                  <RadioGroupItem value="B" id="jawaban-b" className="mt-2" />
                  <Label htmlFor="jawaban-b" className="font-semibold mt-2 cursor-pointer">B.</Label>
                  <Input
                    placeholder="Pilihan B"
                    value={formData.pilihanB}
                    onChange={(e) => setFormData({ ...formData, pilihanB: e.target.value })}
                    required
                    className="flex-1"
                  />
                </div>

                <div className="flex items-start gap-2">
                  <RadioGroupItem value="C" id="jawaban-c" className="mt-2" />
                  <Label htmlFor="jawaban-c" className="font-semibold mt-2 cursor-pointer">C.</Label>
                  <Input
                    placeholder="Pilihan C"
                    value={formData.pilihanC}
                    onChange={(e) => setFormData({ ...formData, pilihanC: e.target.value })}
                    required
                    className="flex-1"
                  />
                </div>

                <div className="flex items-start gap-2">
                  <RadioGroupItem value="D" id="jawaban-d" className="mt-2" />
                  <Label htmlFor="jawaban-d" className="font-semibold mt-2 cursor-pointer">D.</Label>
                  <Input
                    placeholder="Pilihan D"
                    value={formData.pilihanD}
                    onChange={(e) => setFormData({ ...formData, pilihanD: e.target.value })}
                    required
                    className="flex-1"
                  />
                </div>

                <div className="flex items-start gap-2">
                  <RadioGroupItem value="E" id="jawaban-e" className="mt-2" />
                  <Label htmlFor="jawaban-e" className="font-semibold mt-2 cursor-pointer">E.</Label>
                  <Input
                    placeholder="Pilihan E (opsional)"
                    value={formData.pilihanE}
                    onChange={(e) => setFormData({ ...formData, pilihanE: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </RadioGroup>
            </div>

            {/* Pembahasan */}
            <div className="space-y-2">
              <Label htmlFor="pembahasan">Pembahasan (opsional)</Label>
              <Textarea
                id="pembahasan"
                placeholder="Tulis pembahasan atau penjelasan jawaban..."
                value={formData.pembahasan}
                onChange={(e) => setFormData({ ...formData, pembahasan: e.target.value })}
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingId ? 'Update Soal' : 'Simpan Soal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
