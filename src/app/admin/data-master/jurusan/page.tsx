'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Jurusan {
  id: string
  name: string
  kodeJurusan: string
  createdAt: string
}

export default function JurusanPage() {
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', kodeJurusan: '' })

  useEffect(() => {
    fetchJurusan()
  }, [])

  const fetchJurusan = async () => {
    try {
      const response = await fetch('/api/jurusan')
      if (response.ok) {
        const data = await response.json()
        setJurusanList(data)
      } else {
        toast.error('Gagal memuat data jurusan')
      }
    } catch (error) {
      console.error('Error fetching jurusan:', error)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId ? `/api/jurusan/${editingId}` : '/api/jurusan'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchJurusan()
        setIsDialogOpen(false)
        resetForm()
        toast.success(editingId ? 'Jurusan berhasil diupdate' : 'Jurusan berhasil ditambahkan')
      } else {
        toast.error(data.error || 'Terjadi kesalahan saat menyimpan data')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleEdit = (jurusan: Jurusan) => {
    setEditingId(jurusan.id)
    setFormData({ name: jurusan.name, kodeJurusan: jurusan.kodeJurusan })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jurusan ini?')) return

    try {
      const response = await fetch(`/api/jurusan/${id}`, { method: 'DELETE' })
      const data = await response.json()
      
      if (response.ok) {
        await fetchJurusan()
        toast.success('Jurusan berhasil dihapus')
      } else {
        toast.error(data.error || 'Gagal menghapus jurusan')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat menghapus data')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', kodeJurusan: '' })
    setEditingId(null)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Memuat...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Jurusan</h1>
          <p className="text-gray-600 mt-2">Kelola data jurusan</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jurusan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Jurusan' : 'Tambah Jurusan'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Edit data jurusan' : 'Tambah jurusan baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Jurusan</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Teknik Informatika"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kodeJurusan">Kode Jurusan</Label>
                <Input
                  id="kodeJurusan"
                  placeholder="Contoh: TI"
                  value={formData.kodeJurusan}
                  onChange={(e) => setFormData({ ...formData, kodeJurusan: e.target.value })}
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
          <CardTitle>Daftar Jurusan</CardTitle>
          <CardDescription>Total: {jurusanList.length} jurusan</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Kode Jurusan</TableHead>
                <TableHead>Nama Jurusan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jurusanList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    Belum ada data jurusan
                  </TableCell>
                </TableRow>
              ) : (
                jurusanList.map((jurusan, index) => (
                  <TableRow key={jurusan.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{jurusan.kodeJurusan}</TableCell>
                    <TableCell>{jurusan.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(jurusan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(jurusan.id)}>
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
