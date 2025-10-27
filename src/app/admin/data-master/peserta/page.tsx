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
}

interface Peserta {
  id: string
  name: string
  noUjian: string
  kelasId: string
  jurusanId: string
  createdAt: string
  kelas: {
    id: string
    name: string
  } | null
  jurusan: {
    id: string
    name: string
    kodeJurusan: string
  } | null
}

export default function PesertaPage() {
  const [pesertaList, setPesertaList] = useState<Peserta[]>([])
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [filteredKelas, setFilteredKelas] = useState<Kelas[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    noUjian: '', 
    password: '', 
    kelasId: '', 
    jurusanId: '' 
  })

  useEffect(() => {
    fetchPeserta()
    fetchJurusan()
    fetchKelas()
  }, [])

  useEffect(() => {
    // Filter kelas berdasarkan jurusan yang dipilih
    if (formData.jurusanId) {
      setFilteredKelas(kelasList.filter(k => k.jurusanId === formData.jurusanId))
    } else {
      setFilteredKelas([])
    }
  }, [formData.jurusanId, kelasList])

  const fetchPeserta = async () => {
    try {
      const response = await fetch('/api/peserta')
      if (response.ok) {
        const data = await response.json()
        setPesertaList(data)
      }
    } catch (error) {
      console.error('Error fetching peserta:', error)
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

  const fetchKelas = async () => {
    try {
      const response = await fetch('/api/kelas')
      if (response.ok) {
        const data = await response.json()
        setKelasList(data)
      }
    } catch (error) {
      console.error('Error fetching kelas:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId ? `/api/peserta/${editingId}` : '/api/peserta'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPeserta()
        setIsDialogOpen(false)
        resetForm()
        toast.success(editingId ? 'Peserta berhasil diupdate' : 'Peserta berhasil ditambahkan')
      } else {
        toast.error(data.error || 'Terjadi kesalahan saat menyimpan data')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleEdit = (peserta: Peserta) => {
    setEditingId(peserta.id)
    setFormData({ 
      name: peserta.name, 
      noUjian: peserta.noUjian,
      password: '', // Don't populate password when editing
      kelasId: peserta.kelasId,
      jurusanId: peserta.jurusanId
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus peserta ini?')) return

    try {
      const response = await fetch(`/api/peserta/${id}`, { method: 'DELETE' })
      const data = await response.json()
      
      if (response.ok) {
        await fetchPeserta()
        toast.success('Peserta berhasil dihapus')
      } else {
        toast.error(data.error || 'Gagal menghapus peserta')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat menghapus data')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', noUjian: '', password: '', kelasId: '', jurusanId: '' })
    setEditingId(null)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Memuat...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Peserta</h1>
          <p className="text-gray-600 mt-2">Kelola data peserta ujian</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Peserta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Peserta' : 'Tambah Peserta'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Edit data peserta' : 'Tambah peserta baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  placeholder="Contoh: John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noUjian">Nomor Ujian</Label>
                <Input
                  id="noUjian"
                  placeholder="Contoh: 2024001"
                  value={formData.noUjian}
                  onChange={(e) => setFormData({ ...formData, noUjian: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingId && <span className="text-xs text-gray-500">(kosongkan jika tidak diubah)</span>}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurusanId">Jurusan</Label>
                <Select 
                  value={formData.jurusanId} 
                  onValueChange={(value) => setFormData({ ...formData, jurusanId: value, kelasId: '' })}
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
              <div className="space-y-2">
                <Label htmlFor="kelasId">Kelas</Label>
                <Select 
                  value={formData.kelasId} 
                  onValueChange={(value) => setFormData({ ...formData, kelasId: value })}
                  disabled={!formData.jurusanId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.jurusanId ? "Pilih kelas" : "Pilih jurusan terlebih dahulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredKelas.map((kelas) => (
                      <SelectItem key={kelas.id} value={kelas.id}>
                        {kelas.name}
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
          <CardTitle>Daftar Peserta</CardTitle>
          <CardDescription>Total: {pesertaList.length} peserta</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>No. Ujian</TableHead>
                <TableHead>Nama Peserta</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Jurusan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pesertaList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Belum ada data peserta
                  </TableCell>
                </TableRow>
              ) : (
                pesertaList.map((peserta, index) => (
                  <TableRow key={peserta.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{peserta.noUjian}</TableCell>
                    <TableCell>{peserta.name}</TableCell>
                    <TableCell>{peserta.kelas?.name || '-'}</TableCell>
                    <TableCell>
                      <span className="text-sm">{peserta.jurusan?.kodeJurusan || '-'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(peserta)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(peserta.id)}>
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
