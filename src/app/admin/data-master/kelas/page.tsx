'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, Column } from '@/components/ui/data-table'

interface Jurusan {
  id: string
  name: string
  kodeJurusan: string
}

interface Kelas {
  id: string
  name: string
  jurusanId: string
  teacher: string | null
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', jurusanId: '', teacher: '' })
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchKelas()
    fetchJurusan()
  }, [])

  const fetchKelas = async () => {
    try {
      const response = await fetch('/api/kelas')
      if (response.ok) {
        const data = await response.json()
        // Sort data using natural sort
        const sortedData = data.sort((a: Kelas, b: Kelas) => {
          return a.name.localeCompare(b.name, 'id', { numeric: true, sensitivity: 'base' })
        })
        setKelasList(sortedData)
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
    setFormData({ name: kelas.name, jurusanId: kelas.jurusanId, teacher: kelas.teacher || '' })
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
    setFormData({ name: '', jurusanId: '', teacher: '' })
    setEditingId(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('File harus berformat Excel (.xlsx atau .xls)')
      return
    }

    setSelectedFile(file)
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Silakan pilih file terlebih dahulu')
      return
    }

    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('/api/kelas/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        await fetchKelas()
        if (data.errors && data.errors.length > 0) {
          toast.success(`Berhasil import ${data.count} kelas. ${data.errors.length} baris gagal.`)
          console.warn('Import errors:', data.errors)
        } else {
          toast.success(`Berhasil import ${data.count} kelas`)
        }
        setIsImportDialogOpen(false)
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        if (data.details && Array.isArray(data.details)) {
          toast.error(`${data.error}\n${data.details.slice(0, 3).join('\n')}`)
        } else {
          toast.error(data.error || 'Gagal import data')
        }
      }
    } catch (error) {
      console.error('Error importing:', error)
      toast.error('Terjadi kesalahan saat import data')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancelImport = () => {
    setIsImportDialogOpen(false)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/templates/template-kelas.xlsx'
    link.download = 'template-kelas.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Data Kelas</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola data kelas</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Daftar Kelas</CardTitle>
              <CardDescription>Total: {kelasList.length} kelas</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
                if (!open) handleCancelImport()
                setIsImportDialogOpen(open)
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Excel
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Import Kelas dari Excel</DialogTitle>
                    <DialogDescription>
                      Upload file Excel untuk import data kelas secara batch
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-blue-500" />
                          <p className="mb-2 text-sm text-blue-600">
                            <span className="font-semibold">Click to upload</span> atau drag and drop
                          </p>
                          <p className="text-xs text-blue-500">Excel file (.xlsx atau .xls)</p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    {selectedFile && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <span className="font-semibold">File dipilih:</span> {selectedFile.name}
                        </p>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Format Excel:</p>
                      <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li>Kolom 1: <strong>Nama Kelas</strong> (contoh: X RPL 1)</li>
                        <li>Kolom 2: <strong>Kode Jurusan</strong> (contoh: RPL)</li>
                        <li>Kolom 3: <strong>Wali Kelas</strong> (opsional, contoh: Pak Budi)</li>
                      </ul>
                      <Button 
                        variant="link" 
                        onClick={downloadTemplate}
                        className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-800"
                      >
                        Download Template Excel
                      </Button>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCancelImport}
                        disabled={isImporting}
                      >
                        Batal
                      </Button>
                      <Button 
                        onClick={handleImport}
                        disabled={!selectedFile || isImporting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isImporting ? 'Importing...' : 'Import'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) resetForm()
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
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
                  <SelectTrigger className="w-full">
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
                <Label htmlFor="teacher">Wali Kelas</Label>
                <Input
                  id="teacher"
                  placeholder="Contoh: Pak Budi"
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {editingId ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </CardHeader>
        <CardContent>
          <DataTable
            data={kelasList}
            columns={[
              {
                header: 'No',
                accessor: 'id',
                cell: (row, index) => index + 1,
                className: 'w-16',
              },
              {
                header: 'Nama Kelas',
                accessor: 'name',
                cell: (row) => <span className="font-medium">{row.name}</span>,
                sortable: true,
                sortKey: 'name',
                sortLabel: 'Alfabet',
                customSort: (a, b, direction) => {
                  const aName = a.name || ''
                  const bName = b.name || ''
                  
                  if (direction === 'asc') {
                    return aName.localeCompare(bName, 'id', { numeric: true })
                  } else {
                    return bName.localeCompare(aName, 'id', { numeric: true })
                  }
                },
              },
              {
                header: 'Jurusan',
                accessor: 'jurusanId',
                cell: (row) => (
                  row.jurusan ? (
                    <span className="text-sm">
                      {row.jurusan.kodeJurusan} - {row.jurusan.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )
                ),
              },
              {
                header: 'Wali Kelas',
                accessor: 'teacher',
                cell: (row) => (
                  <span className="text-sm">{row.teacher || '-'}</span>
                ),
              },
              {
                header: 'Aksi',
                accessor: () => null,
                cell: (row) => (
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(row)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(row.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
                className: 'text-right',
              },
            ]}
            searchPlaceholder="Cari kelas..."
            searchKeys={['name']}
            filters={[
              {
                key: 'jurusanId',
                label: 'Jurusan',
                options: jurusanList.map(j => ({ value: j.id, label: `${j.kodeJurusan} - ${j.name}` })),
              },
            ]}
            emptyMessage="Belum ada data kelas"
          />
        </CardContent>
      </Card>
    </div>
  )
}
