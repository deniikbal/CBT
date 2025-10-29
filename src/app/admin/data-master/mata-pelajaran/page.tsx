'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, Column } from '@/components/ui/data-table'

interface MataPelajaran {
  id: string
  name: string
  kodeMatpel: string
  createdAt: string
}

export default function MataPelajaranPage() {
  const [matpelList, setMatpelList] = useState<MataPelajaran[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', kodeMatpel: '' })

  useEffect(() => {
    fetchMataPelajaran()
  }, [])

  const fetchMataPelajaran = async () => {
    try {
      const response = await fetch('/api/mata-pelajaran')
      if (response.ok) {
        const data = await response.json()
        setMatpelList(data)
      }
    } catch (error) {
      console.error('Error fetching mata pelajaran:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId ? `/api/mata-pelajaran/${editingId}` : '/api/mata-pelajaran'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchMataPelajaran()
        setIsDialogOpen(false)
        resetForm()
        toast.success(editingId ? 'Mata pelajaran berhasil diupdate' : 'Mata pelajaran berhasil ditambahkan')
      } else {
        toast.error(data.error || 'Terjadi kesalahan saat menyimpan data')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleEdit = (matpel: MataPelajaran) => {
    setEditingId(matpel.id)
    setFormData({ name: matpel.name, kodeMatpel: matpel.kodeMatpel })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) return

    try {
      const response = await fetch(`/api/mata-pelajaran/${id}`, { method: 'DELETE' })
      const data = await response.json()
      
      if (response.ok) {
        await fetchMataPelajaran()
        toast.success('Mata pelajaran berhasil dihapus')
      } else {
        toast.error(data.error || 'Gagal menghapus mata pelajaran')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat menghapus data')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', kodeMatpel: '' })
    setEditingId(null)
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Data Mata Pelajaran</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola data mata pelajaran</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Mata Pelajaran
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Edit data mata pelajaran' : 'Tambah mata pelajaran baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Mata Pelajaran</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Matematika"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kodeMatpel">Kode Mata Pelajaran</Label>
                <Input
                  id="kodeMatpel"
                  placeholder="Contoh: MTK"
                  value={formData.kodeMatpel}
                  onChange={(e) => setFormData({ ...formData, kodeMatpel: e.target.value })}
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
          <CardTitle>Daftar Mata Pelajaran</CardTitle>
          <CardDescription>Total: {matpelList.length} mata pelajaran</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={matpelList}
            columns={[
              {
                header: 'No',
                accessor: 'id',
                cell: (row, index) => index + 1,
                className: 'w-16',
              },
              {
                header: 'Kode Matpel',
                accessor: 'kodeMatpel',
                cell: (row) => <span className="font-medium">{row.kodeMatpel}</span>,
              },
              {
                header: 'Nama Mata Pelajaran',
                accessor: 'name',
              },
              {
                header: 'Aksi',
                accessor: () => null,
                cell: (row) => (
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ),
                className: 'text-right',
              },
            ]}
            searchPlaceholder="Cari mata pelajaran..."
            searchKeys={['name', 'kodeMatpel']}
            emptyMessage="Belum ada data mata pelajaran"
          />
        </CardContent>
      </Card>
    </div>
  )
}
