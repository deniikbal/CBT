'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Jurusan {
  id: string
  name: string
  kodeJurusan: string
}

interface Kelas {
  id: string
  name: string
  jurusanId: string
  createdAt: string
  jurusan: {
    id: string
    name: string
    kodeJurusan: string
  } | null
}

export default function KelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', jurusanId: '' })

  useEffect(() => {
    fetchKelas()
    fetchJurusan()
  }, [])

  const fetchKelas = async () => {
    try {
      const response = await fetch('/api/kelas')
      if (response.ok) {
        const data = await response.json()
        setKelasList(data)
      }
    } catch (error) {
      console.error('Error fetching kelas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchJurusan = async () => {
    try {
      const response = await fetch('/api/jurusan')
      if (response.ok) {
        const data = await response.json()
        setJurusanList(data)
      }
    } catch (error) {
      console.error('Error fetching jurusan:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId ? `/api/kelas/${editingId}` : '/api/kelas'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchKelas()
        setIsDialogOpen(false)
        resetForm()
        toast.success(editingId ? 'Kelas berhasil diupdate' : 'Kelas berhasil ditambahkan')
      } else {
        toast.error(data.error || 'Terjadi kesalahan saat menyimpan data')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleEdit = (kelas: Kelas) => {
    setEditingId(kelas.id)
    setFormData({ name: kelas.name, jurusanId: kelas.jurusanId })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return

    try {
      const response = await fetch(`/api/kelas/${id}`, { method: 'DELETE' })
      const data = await response.json()
      
      if (response.ok) {
        await fetchKelas()
        toast.success('Kelas berhasil dihapus')
      } else {
        toast.error(data.error || 'Gagal menghapus kelas')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat menghapus data')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', jurusanId: '' })
    setEditingId(null)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Memuat...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Kelas</h1>
          <p className="text-gray-600 mt-2">Kelola data kelas</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Kelas' : 'Tambah Kelas'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Edit data kelas' : 'Tambah kelas baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kelas</Label>
                <Input
                  id="name"
                  placeholder="Contoh: XII RPL 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurusanId">Jurusan</Label>
                <Select 
                  value={formData.jurusanId} 
                  onValueChange={(value) => setFormData({ ...formData, jurusanId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurusanList.map((jurusan) => (
                      <SelectItem key={jurusan.id} value={jurusan.id}>
                        {jurusan.kodeJurusan} - {jurusan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          <CardTitle>Daftar Kelas</CardTitle>
          <CardDescription>Total: {kelasList.length} kelas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Jurusan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kelasList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    Belum ada data kelas
                  </TableCell>
                </TableRow>
              ) : (
                kelasList.map((kelas, index) => (
                  <TableRow key={kelas.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{kelas.name}</TableCell>
                    <TableCell>
                      {kelas.jurusan ? (
                        <span className="text-sm">
                          {kelas.jurusan.kodeJurusan} - {kelas.jurusan.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(kelas)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(kelas.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
