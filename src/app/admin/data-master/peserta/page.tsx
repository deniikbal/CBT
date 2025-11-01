'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Upload, Loader2, Trash, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, Column } from '@/components/ui/data-table'
import { Checkbox } from '@/components/ui/checkbox'

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
  isActive: boolean
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ id: string; enable: boolean } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [totalRows, setTotalRows] = useState(0)
  const [importStatus, setImportStatus] = useState<'preparing' | 'importing' | 'finalizing' | 'done'>('preparing')
  const [selectedPeserta, setSelectedPeserta] = useState<string[]>([])
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false)
  const [bulkStatusAction, setBulkStatusAction] = useState<'enable' | 'disable'>('enable')
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleToggleStatus = (id: string, enable: boolean) => {
    setConfirmAction({ id, enable })
    setIsConfirmOpen(true)
  }

  const confirmToggleStatus = async () => {
    if (!confirmAction) return

    const { id, enable } = confirmAction
    const action = enable ? 'mengaktifkan' : 'menonaktifkan'

    try {
      const endpoint = enable ? `/api/peserta/${id}/enable` : `/api/peserta/${id}/disable`
      const response = await fetch(endpoint, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      if (response.ok) {
        await fetchPeserta()
        toast.success(`Akun peserta berhasil di${action}`)
      } else {
        toast.error(data.error || `Gagal ${action} akun peserta`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat mengubah status akun')
    } finally {
      setIsConfirmOpen(false)
      setConfirmAction(null)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', noUjian: '', password: '', kelasId: '', jurusanId: '' })
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
    setTotalRows(0)
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Silakan pilih file terlebih dahulu')
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    setImportedCount(0)
    setImportStatus('preparing')
    
    const formData = new FormData()
    formData.append('file', selectedFile)

    // Simulate realistic progress with phases
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev < 15) {
          setImportStatus('preparing')
          return prev + 5
        } else if (prev < 85) {
          setImportStatus('importing')
          // Simulate imported count proportionally
          const progressInImportPhase = (prev - 15) / 70 // 0 to 1
          const expectedCount = Math.floor(progressInImportPhase * (totalRows || 10))
          setImportedCount(expectedCount)
          return prev + 5
        } else if (prev < 98) {
          setImportStatus('finalizing')
          // Set to near total during finalization
          setImportedCount(Math.floor((totalRows || 10) * 0.95))
          return prev + 2
        }
        return prev
      })
    }, 100)

    try {
      const response = await fetch('/api/peserta/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      clearInterval(progressInterval)
      
      setImportStatus('done')
      setImportProgress(100)
      setImportedCount(data.count || 0)

      if (response.ok) {
        await fetchPeserta()
        setTimeout(() => {
          if (data.errors && data.errors.length > 0) {
            toast.success(`Berhasil import ${data.count} peserta. ${data.errors.length} baris gagal.`, {
              description: 'Lihat console untuk detail error'
            })
            console.warn('Import errors:', data.errors)
          } else {
            toast.success(`Berhasil import ${data.count} peserta!`, {
              description: 'Semua data berhasil ditambahkan'
            })
          }
          setIsImportDialogOpen(false)
          setSelectedFile(null)
          setTotalRows(0)
          setImportProgress(0)
          setImportedCount(0)
          setImportStatus('preparing')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }, 800)
      } else {
        toast.error(data.error || 'Gagal import data', {
          description: data.details ? data.details.slice(0, 2).join(', ') : undefined
        })
        setImportProgress(0)
        setImportedCount(0)
        setImportStatus('preparing')
      }
    } catch (error) {
      clearInterval(progressInterval)
      console.error('Error importing:', error)
      toast.error('Terjadi kesalahan saat import data')
      setImportProgress(0)
      setImportedCount(0)
      setImportStatus('preparing')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancelImport = () => {
    setIsImportDialogOpen(false)
    setSelectedFile(null)
    setTotalRows(0)
    setImportProgress(0)
    setImportedCount(0)
    setImportStatus('preparing')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/templates/template-peserta.xlsx'
    link.download = 'template-peserta.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPeserta(pesertaList.map(p => p.id))
    } else {
      setSelectedPeserta([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPeserta([...selectedPeserta, id])
    } else {
      setSelectedPeserta(selectedPeserta.filter(pid => pid !== id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPeserta.length === 0) {
      toast.error('Pilih peserta yang ingin dihapus')
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch('/api/peserta/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedPeserta })
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPeserta()
        setSelectedPeserta([])
        setIsBulkDeleteOpen(false)
        toast.success(`Berhasil menghapus ${data.count} peserta`, {
          description: 'Data peserta telah dihapus dari sistem'
        })
      } else {
        toast.error(data.error || 'Gagal menghapus peserta')
      }
    } catch (error) {
      console.error('Error bulk delete:', error)
      toast.error('Terjadi kesalahan saat menghapus data')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkToggleStatus = async () => {
    if (selectedPeserta.length === 0) {
      toast.error('Pilih peserta yang ingin diubah statusnya')
      return
    }

    setIsTogglingStatus(true)

    try {
      const endpoint = bulkStatusAction === 'enable' 
        ? '/api/peserta/bulk-enable' 
        : '/api/peserta/bulk-disable'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedPeserta })
      })

      const data = await response.json()
      
      if (response.ok) {
        await fetchPeserta()
        setSelectedPeserta([])
        setIsBulkStatusOpen(false)
        const action = bulkStatusAction === 'enable' ? 'diaktifkan' : 'dinonaktifkan'
        toast.success(`Berhasil ${action} ${data.count} peserta`, {
          description: `Status akun peserta telah diubah`
        })
      } else {
        toast.error(data.error || 'Gagal mengubah status peserta')
      }
    } catch (error) {
      console.error('Error bulk toggle status:', error)
      toast.error('Terjadi kesalahan saat mengubah status')
    } finally {
      setIsTogglingStatus(false)
    }
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
        <h1 className="text-2xl sm:text-3xl font-bold">Data Peserta</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola data peserta ujian</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Daftar Peserta</CardTitle>
              <CardDescription>Total: {pesertaList.length} peserta</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {selectedPeserta.length > 0 && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setBulkStatusAction('enable')
                      setIsBulkStatusOpen(true)
                    }}
                    className="border-green-600 text-green-600 hover:bg-green-50 w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Aktifkan ({selectedPeserta.length})</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setBulkStatusAction('disable')
                      setIsBulkStatusOpen(true)
                    }}
                    className="border-orange-600 text-orange-600 hover:bg-orange-50 w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    <span>Nonaktifkan ({selectedPeserta.length})</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsBulkDeleteOpen(true)}
                    className="border-red-600 text-red-600 hover:bg-red-50 w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    <span>Hapus ({selectedPeserta.length})</span>
                  </Button>
                </>
              )}
              
              <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
                if (!open) handleCancelImport()
                setIsImportDialogOpen(open)
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto text-xs sm:text-sm">
                    <Upload className="h-4 w-4 mr-2" />
                    <span>Import Excel</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Import Peserta dari Excel</DialogTitle>
                    <DialogDescription>
                      Upload file Excel untuk import data peserta secara batch
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
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
                          disabled={isImporting}
                        />
                      </label>
                    </div>
                    
                    {selectedFile && !isImporting && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-700">
                              <span className="font-semibold">File dipilih:</span> {selectedFile.name}
                            </p>
                            {totalRows > 0 && (
                              <p className="text-xs text-blue-600 mt-1">
                                Total: {totalRows} baris data
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {isImporting && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Status and Progress */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                            <span className="text-blue-700 font-medium">
                              {importStatus === 'preparing' && 'Mempersiapkan data...'}
                              {importStatus === 'importing' && 'Mengimport data...'}
                              {importStatus === 'finalizing' && 'Menyelesaikan...'}
                              {importStatus === 'done' && 'Selesai!'}
                            </span>
                          </div>
                          <span className="text-blue-600 font-semibold">{importProgress}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-3 rounded-full transition-all duration-300 ease-out relative"
                            style={{ width: `${importProgress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                          </div>
                        </div>

                        {/* Import Counter */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-xs text-blue-600 font-medium">Data Diimport</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-blue-700 animate-in zoom-in duration-200">
                                  {importedCount}
                                </span>
                                {totalRows > 0 && (
                                  <span className="text-sm text-blue-500">/ {totalRows}</span>
                                )}
                                <span className="text-xs text-blue-600">peserta</span>
                              </div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <Upload className="h-6 w-6 text-blue-600 animate-bounce" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-center">
                      <Button 
                        variant="link" 
                        onClick={downloadTemplate}
                        className="p-0 h-auto text-blue-600 hover:text-blue-800 font-semibold"
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
                        {isImporting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          'Import'
                        )}
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
            data={pesertaList}
            columns={[
              {
                header: () => (
                  <Checkbox
                    checked={selectedPeserta.length === pesertaList.length && pesertaList.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    aria-label="Select all"
                  />
                ),
                accessor: 'id',
                cell: (row) => (
                  <Checkbox
                    checked={selectedPeserta.includes(row.id)}
                    onCheckedChange={(checked) => handleSelectOne(row.id, checked as boolean)}
                    aria-label={`Select ${row.name}`}
                  />
                ),
                className: 'w-12',
              },
              {
                header: 'No',
                accessor: 'id',
                cell: (row, index) => index + 1,
                className: 'w-16',
              },
              {
                header: 'No. Ujian',
                accessor: 'noUjian',
                cell: (row) => <span className="font-medium">{row.noUjian}</span>,
              },
              {
                header: 'Nama Peserta',
                accessor: 'name',
              },
              {
                header: 'Kelas',
                accessor: 'kelasId',
                cell: (row) => row.kelas?.name || '-',
                sortable: true,
                sortKey: 'kelasId',
                sortLabel: 'Alfabet',
                customSort: (a, b, direction) => {
                  const aName = a.kelas?.name || ''
                  const bName = b.kelas?.name || ''
                  
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
                  <span className="text-sm">{row.jurusan?.kodeJurusan || '-'}</span>
                ),
              },
              {
                header: 'Status',
                accessor: 'isActive',
                cell: (row) => (
                  row.isActive !== false ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Nonaktif
                    </span>
                  )
                ),
              },
              {
                header: 'Aksi',
                accessor: () => null,
                cell: (row) => (
                  <div className="flex justify-end gap-2">
                    {row.isActive === false && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleToggleStatus(row.id, true)}
                        title="Aktifkan Akun"
                      >
                        <span className="text-green-600 text-xs font-medium">Aktifkan</span>
                      </Button>
                    )}
                    {row.isActive !== false && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleToggleStatus(row.id, false)}
                        title="Nonaktifkan Akun"
                      >
                        <span className="text-orange-600 text-xs font-medium">Nonaktifkan</span>
                      </Button>
                    )}
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
            searchPlaceholder="Cari peserta..."
            searchKeys={['name', 'noUjian']}
            filters={[
              {
                key: 'jurusanId',
                label: 'Jurusan',
                options: jurusanList.map(j => ({ value: j.id, label: `${j.kodeJurusan} - ${j.name}` })),
              },
              {
                key: 'kelasId',
                label: 'Kelas',
                options: kelasList.map(k => ({ value: k.id, label: k.name })),
              },
              {
                key: 'isActive',
                label: 'Status',
                options: [
                  { value: 'true', label: 'Aktif' },
                  { value: 'false', label: 'Nonaktif' },
                ],
              },
            ]}
            emptyMessage="Belum ada data peserta"
          />
        </CardContent>
      </Card>

      {/* Confirm Status Change Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Perubahan Status</DialogTitle>
            <DialogDescription>
              {confirmAction?.enable 
                ? 'Apakah Anda yakin ingin mengaktifkan akun peserta ini? Peserta akan dapat login kembali.' 
                : 'Apakah Anda yakin ingin menonaktifkan akun peserta ini? Peserta tidak akan dapat login.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsConfirmOpen(false)
                setConfirmAction(null)
              }}
            >
              Batal
            </Button>
            <Button 
              type="button" 
              variant={confirmAction?.enable ? 'default' : 'destructive'}
              onClick={confirmToggleStatus}
            >
              {confirmAction?.enable ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Confirmation Dialog */}
      <Dialog open={isBulkStatusOpen} onOpenChange={setIsBulkStatusOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center animate-in zoom-in duration-300 ${
                bulkStatusAction === 'enable' ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {bulkStatusAction === 'enable' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-orange-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {bulkStatusAction === 'enable' ? 'Aktifkan' : 'Nonaktifkan'} Peserta Terpilih?
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Ubah status {selectedPeserta.length} akun peserta
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <div className={`border rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300 ${
              bulkStatusAction === 'enable' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                bulkStatusAction === 'enable' ? 'text-green-800' : 'text-orange-800'
              }`}>
                Anda akan {bulkStatusAction === 'enable' ? 'mengaktifkan' : 'menonaktifkan'}{' '}
                <span className="font-bold">{selectedPeserta.length} peserta</span>
              </p>
              <ul className={`text-sm space-y-1 list-disc list-inside ${
                bulkStatusAction === 'enable' ? 'text-green-700' : 'text-orange-700'
              }`}>
                {bulkStatusAction === 'enable' ? (
                  <>
                    <li>Akun peserta dapat login kembali</li>
                    <li>Dapat mengikuti ujian yang dijadwalkan</li>
                    <li>Counter pelanggaran akan direset (jika diaktifkan di jadwal)</li>
                  </>
                ) : (
                  <>
                    <li>Akun peserta tidak dapat login</li>
                    <li>Tidak dapat mengikuti ujian</li>
                    <li>Data tetap tersimpan di sistem</li>
                  </>
                )}
              </ul>
            </div>

            {isTogglingStatus && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${
                    bulkStatusAction === 'enable' ? 'text-green-700' : 'text-orange-700'
                  }`}>
                    Memproses...
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 overflow-hidden ${
                  bulkStatusAction === 'enable' ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  <div className={`h-2 rounded-full animate-pulse w-full ${
                    bulkStatusAction === 'enable' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-600'
                  }`}></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsBulkStatusOpen(false)}
              disabled={isTogglingStatus}
            >
              Batal
            </Button>
            <Button 
              type="button" 
              variant={bulkStatusAction === 'enable' ? 'default' : 'destructive'}
              onClick={handleBulkToggleStatus}
              disabled={isTogglingStatus}
              className={bulkStatusAction === 'enable' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isTogglingStatus ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  {bulkStatusAction === 'enable' ? (
                    <><CheckCircle className="h-4 w-4 mr-2" />Ya, Aktifkan</>
                  ) : (
                    <><XCircle className="h-4 w-4 mr-2" />Ya, Nonaktifkan</>
                  )}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center animate-in zoom-in duration-300">
                <Trash className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Hapus Peserta Terpilih?</DialogTitle>
                <DialogDescription className="mt-1">
                  Tindakan ini tidak dapat dibatalkan
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-sm text-red-800 font-medium mb-2">
                Anda akan menghapus <span className="font-bold">{selectedPeserta.length} peserta</span>
              </p>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>Data peserta akan dihapus permanen</li>
                <li>Riwayat ujian akan ikut terhapus</li>
                <li>Aksi ini tidak dapat dibatalkan</li>
              </ul>
            </div>

            {isDeleting && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-700 font-medium">Menghapus data...</span>
                </div>
                <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full animate-pulse w-full"></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsBulkDeleteOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Ya, Hapus Semua
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
