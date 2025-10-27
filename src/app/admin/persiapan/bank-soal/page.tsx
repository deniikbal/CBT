'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, BookOpen, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MataPelajaran {
  id: string
  name: string
  kodeMatpel: string
}

interface BankSoal {
  id: string
  kodeBankSoal: string
  matpelId: string
  jumlahSoal: number
  createdAt: string
  mataPelajaran: {
    id: string
    name: string
    kodeMatpel: string
  } | null
  soalCount?: number
}

export default function BankSoalPage() {
  const router = useRouter()
  const [bankSoalList, setBankSoalList] = useState<BankSoal[]>([])
  const [matpelList, setMatpelList] = useState<MataPelajaran[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    kodeBankSoal: '', 
    matpelId: '', 
    jumlahSoal: 0 
  })

  useEffect(() => {
    fetchBankSoal()
    fetchMataPelajaran()
  }, [])

  const fetchBankSoal = async () => {
    try {
      const response = await fetch('/api/bank-soal')
      if (response.ok) {
        const data = await response.json()
        
        // Fetch count soal for each bank soal
        const dataWithCount = await Promise.all(
          data.map(async (bankSoal: BankSoal) => {
            try {
              const soalResponse = await fetch(`/api/bank-soal/${bankSoal.id}/soal`)
              if (soalResponse.ok) {
                const soalData = await soalResponse.json()
                return { ...bankSoal, soalCount: soalData.length }
              }
            } catch (error) {
              console.error('Error fetching soal count:', error)
            }
            return { ...bankSoal, soalCount: 0 }
          })
        )
        
        setBankSoalList(dataWithCount)
      }
    } catch (error) {
      console.error('Error fetching bank soal:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMataPelajaran = async () => {
    try {
      const response = await fetch('/api/mata-pelajaran')
      if (response.ok) {
        const data = await response.json()
        setMatpelList(data)
      }
    } catch (error) {
      console.error('Error fetching mata pelajaran:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId ? `/api/bank-soal/${editingId}` : '/api/bank-soal'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchBankSoal()
        setIsDialogOpen(false)
        resetForm()
        toast.success(editingId ? 'Bank soal berhasil diupdate' : 'Bank soal berhasil ditambahkan')
      } else {
        toast.error(data.error || 'Terjadi kesalahan saat menyimpan data')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleEdit = (bankSoal: BankSoal) => {
    setEditingId(bankSoal.id)
    setFormData({ 
      kodeBankSoal: bankSoal.kodeBankSoal, 
      matpelId: bankSoal.matpelId,
      jumlahSoal: bankSoal.jumlahSoal
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bank soal ini?')) return

    try {
      const response = await fetch(`/api/bank-soal/${id}`, { method: 'DELETE' })
      const data = await response.json()
      
      if (response.ok) {
        await fetchBankSoal()
        toast.success('Bank soal berhasil dihapus')
      } else {
        toast.error(data.error || 'Gagal menghapus bank soal')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat menghapus data')
    }
  }

  const resetForm = () => {
    setFormData({ kodeBankSoal: '', matpelId: '', jumlahSoal: 0 })
    setEditingId(null)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Memuat...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bank Soal</h1>
          <p className="text-gray-600 mt-2">Kelola bank soal ujian</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Bank Soal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Bank Soal' : 'Tambah Bank Soal'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Edit data bank soal' : 'Tambah bank soal baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kodeBankSoal">Kode Bank Soal</Label>
                <Input
                  id="kodeBankSoal"
                  placeholder="Contoh: BS-MTK-001"
                  value={formData.kodeBankSoal}
                  onChange={(e) => setFormData({ ...formData, kodeBankSoal: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matpelId">Mata Pelajaran</Label>
                <Select 
                  value={formData.matpelId} 
                  onValueChange={(value) => setFormData({ ...formData, matpelId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mata pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {matpelList.map((matpel) => (
                      <SelectItem key={matpel.id} value={matpel.id}>
                        {matpel.kodeMatpel} - {matpel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jumlahSoal">Jumlah Soal</Label>
                <Input
                  id="jumlahSoal"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.jumlahSoal}
                  onChange={(e) => setFormData({ ...formData, jumlahSoal: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingId ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Bank Soal</CardTitle>
          <CardDescription>Total: {bankSoalList.length} bank soal</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Kode Bank Soal</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Target Soal</TableHead>
                <TableHead>Soal Terbuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankSoalList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    <div className="flex flex-col items-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mb-2" />
                      <p>Belum ada data bank soal</p>
                      <p className="text-sm">Tambahkan bank soal untuk memulai</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bankSoalList.map((bankSoal, index) => {
                  const soalCount = bankSoal.soalCount || 0
                  const targetSoal = bankSoal.jumlahSoal
                  const percentage = targetSoal > 0 ? Math.round((soalCount / targetSoal) * 100) : 0
                  
                  return (
                    <TableRow key={bankSoal.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{bankSoal.kodeBankSoal}</TableCell>
                      <TableCell>
                        {bankSoal.mataPelajaran ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {bankSoal.mataPelajaran.kodeMatpel}
                            </span>
                            <span>{bankSoal.mataPelajaran.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{targetSoal}</span> soal
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${soalCount >= targetSoal ? 'text-green-600' : 'text-orange-600'}`}>
                            {soalCount}/{targetSoal}
                          </span>
                          <span className="text-xs text-gray-500">({percentage}%)</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => router.push(`/admin/persiapan/bank-soal/${bankSoal.id}/soal`)}
                            className="gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            Kelola Soal
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(bankSoal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(bankSoal.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
