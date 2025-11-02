'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, Calendar, Clock, Users, Loader2, AlertTriangle, Download } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { DataTable, Column } from '@/components/ui/data-table'

interface MataPelajaran {
  id: string
  name: string
  kodeMatpel: string
}

interface BankSoal {
  id: string
  kodeBankSoal: string
  matpelId: string
}

interface Kelas {
  id: string
  name: string
}

interface Peserta {
  id: string
  name: string
  noUjian: string
  kelasId?: string
  kelasName?: string | null
}

interface JadwalUjian {
  id: string
  namaUjian: string
  bankSoalId: string
  kelasId: string | null
  tanggalUjian: string
  jamMulai: string
  durasi: number
  minimumPengerjaan: number | null
  acakSoal: boolean
  acakOpsi: boolean
  tampilkanNilai: boolean
  resetPelanggaranOnEnable: boolean
  autoSubmitOnViolation: boolean
  isActive: boolean
  bankSoal: {
    id: string
    kodeBankSoal: string
  } | null
  kelas: {
    id: string
    name: string
  } | null
  peserta?: Peserta[]
}

export default function JadwalUjianPage() {
  const [jadwalList, setJadwalList] = useState<JadwalUjian[]>([])
  const [bankSoalList, setBankSoalList] = useState<BankSoal[]>([])
  const [filteredBankSoal, setFilteredBankSoal] = useState<BankSoal[]>([])
  const [matpelList, setMatpelList] = useState<MataPelajaran[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [pesertaList, setPesertaList] = useState<Peserta[]>([])
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterKelas, setFilterKelas] = useState<string>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loadingExport, setLoadingExport] = useState<Set<string>>(new Set())
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportJadwalId, setExportJadwalId] = useState<string | null>(null)
  const [exportNamaUjian, setExportNamaUjian] = useState<string>('')
  const [exportKelasId, setExportKelasId] = useState<string>('all')
  const [exportKelasList, setExportKelasList] = useState<Kelas[]>([])
  
  const [formData, setFormData] = useState({
    namaUjian: '',
    matpelId: '',
    bankSoalId: '',
    pesertaIds: [] as string[],
    tanggalUjian: '',
    jamMulai: '',
    durasi: 60,
    minimumPengerjaan: null as number | null,
    acakSoal: false,
    acakOpsi: false,
    tampilkanNilai: true,
    resetPelanggaranOnEnable: true,
    autoSubmitOnViolation: false,
    isActive: true,
  })

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
    fetchJadwal()
    fetchBankSoal()
    fetchMataPelajaran()
    fetchKelas()
    fetchPeserta()
  }, [])

  useEffect(() => {
    if (filterKelas && filterKelas !== 'all') {
      const filtered = pesertaList.filter(p => p.kelasId === filterKelas)
      setFilteredPeserta(filtered)
    } else {
      setFilteredPeserta(pesertaList)
    }
  }, [filterKelas, pesertaList])

  useEffect(() => {
    if (formData.matpelId) {
      const filtered = bankSoalList.filter(b => b.matpelId === formData.matpelId)
      setFilteredBankSoal(filtered)
    } else {
      setFilteredBankSoal(bankSoalList)
    }
  }, [formData.matpelId, bankSoalList])

  const fetchJadwal = async () => {
    try {
      const user = currentUser || JSON.parse(localStorage.getItem('user') || '{}')
      const url = user.role === 'USER' ? `/api/jadwal-ujian?createdById=${user.id}` : '/api/jadwal-ujian'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setJadwalList(data)
      }
    } catch (error) {
      console.error('Error fetching jadwal:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBankSoal = async () => {
    try {
      const user = currentUser || JSON.parse(localStorage.getItem('user') || '{}')
      const url = user.role === 'USER' ? `/api/bank-soal?createdById=${user.id}` : '/api/bank-soal'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setBankSoalList(data)
      }
    } catch (error) {
      console.error('Error fetching bank soal:', error)
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

  const fetchKelas = async () => {
    try {
      const response = await fetch('/api/kelas')
      if (response.ok) {
        const data = await response.json()
        // Sort dengan natural order (X1, X2, X3, ... X10, X11)
        const sorted = data.sort((a: Kelas, b: Kelas) => 
          a.name.localeCompare(b.name, 'id-ID', { numeric: true, sensitivity: 'base' })
        )
        setKelasList(sorted)
      }
    } catch (error) {
      console.error('Error fetching kelas:', error)
    }
  }

  const fetchPeserta = async () => {
    try {
      const response = await fetch('/api/peserta')
      if (response.ok) {
        const data = await response.json()
        setPesertaList(data)
      }
    } catch (error) {
      console.error('Error fetching peserta:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.pesertaIds.length === 0) {
      toast.error('Pilih minimal 1 peserta')
      return
    }

    setIsSubmitting(true)

    try {
      const url = editingId ? `/api/jadwal-ujian/${editingId}` : '/api/jadwal-ujian'
      const method = editingId ? 'PUT' : 'POST'
      const user = currentUser || JSON.parse(localStorage.getItem('user') || '{}')
      
      const payload = {
        ...formData,
        ...(method === 'POST' && { createdBy: user.id })
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchJadwal()
        setIsDialogOpen(false)
        resetForm()
        toast.success(editingId ? 'Jadwal ujian berhasil diupdate' : 'Jadwal ujian berhasil dibuat')
      } else {
        toast.error(data.error || 'Terjadi kesalahan saat menyimpan jadwal')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportKartu = async (jadwalId: string, namaUjian: string) => {
    try {
      // Fetch jadwal detail to get peserta and their kelas
      const response = await fetch(`/api/jadwal-ujian/${jadwalId}`)
      if (!response.ok) {
        toast.error('Gagal mengambil data jadwal')
        return
      }

      const jadwal = await response.json()
      
      // Get unique kelas from peserta
      const uniqueKelas = new Map<string, Kelas>()
      jadwal.peserta?.forEach((p: Peserta) => {
        if (p.kelasId) {
          const kelasData = kelasList.find(k => k.id === p.kelasId)
          if (kelasData && !uniqueKelas.has(kelasData.id)) {
            uniqueKelas.set(kelasData.id, kelasData)
          }
        }
      })

      // Sort kelas dengan natural order
      const sortedKelas = Array.from(uniqueKelas.values()).sort((a, b) =>
        a.name.localeCompare(b.name, 'id-ID', { numeric: true, sensitivity: 'base' })
      )

      // Open dialog with kelas options
      setExportJadwalId(jadwalId)
      setExportNamaUjian(namaUjian)
      setExportKelasList(sortedKelas)
      setExportKelasId('all')
      setIsExportDialogOpen(true)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const confirmExportKartu = async () => {
    if (!exportJadwalId) return

    try {
      // Set loading state
      setLoadingExport(prev => new Set(prev).add(exportJadwalId))
      setIsExportDialogOpen(false)

      // Build URL with kelasId query param if not 'all'
      const url = exportKelasId === 'all' 
        ? `/api/jadwal-ujian/${exportJadwalId}/export-kartu`
        : `/api/jadwal-ujian/${exportJadwalId}/export-kartu?kelasId=${exportKelasId}`

      const response = await fetch(url)
      
      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        
        // Add kelas name to filename if filtered
        let filename = `Kartu-Ujian-${exportNamaUjian.replace(/\s+/g, '-')}`
        if (exportKelasId !== 'all') {
          const selectedKelas = exportKelasList.find(k => k.id === exportKelasId)
          if (selectedKelas) {
            filename += `-${selectedKelas.name}`
          }
        }
        a.download = `${filename}.pdf`
        
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
        toast.success('Kartu ujian berhasil diunduh')
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Gagal mengunduh kartu ujian')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat mengunduh kartu ujian')
    } finally {
      // Remove loading state
      setLoadingExport(prev => {
        const newSet = new Set(prev)
        newSet.delete(exportJadwalId)
        return newSet
      })
      // Reset export states
      setExportJadwalId(null)
      setExportNamaUjian('')
      setExportKelasId('all')
      setExportKelasList([])
    }
  }

  const handleEdit = async (jadwal: JadwalUjian) => {
    setEditingId(jadwal.id)
    
    // Fetch detail to get peserta list
    const response = await fetch(`/api/jadwal-ujian/${jadwal.id}`)
    if (response.ok) {
      const data = await response.json()
      
      // Find matpelId from selected bank soal
      const selectedBankSoal = bankSoalList.find(b => b.id === jadwal.bankSoalId)
      const matpelId = selectedBankSoal?.matpelId || ''
      
      setFormData({
        namaUjian: jadwal.namaUjian,
        matpelId: matpelId,
        bankSoalId: jadwal.bankSoalId,
        pesertaIds: data.peserta?.map((p: Peserta) => p.id) || [],
        tanggalUjian: format(new Date(jadwal.tanggalUjian), 'yyyy-MM-dd'),
        jamMulai: jadwal.jamMulai,
        durasi: jadwal.durasi,
        minimumPengerjaan: jadwal.minimumPengerjaan,
        acakSoal: jadwal.acakSoal,
        acakOpsi: jadwal.acakOpsi,
        tampilkanNilai: jadwal.tampilkanNilai,
        resetPelanggaranOnEnable: jadwal.resetPelanggaranOnEnable ?? true,
        autoSubmitOnViolation: jadwal.autoSubmitOnViolation ?? false,
        isActive: jadwal.isActive,
      })
      setIsDialogOpen(true)
    }
  }

  const toggleIsActive = async (jadwalId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/jadwal-ujian/${jadwalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        await fetchJadwal()
        toast.success(`Jadwal berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal mengubah status jadwal')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  const toggleSelectJadwal = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === jadwalList.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(jadwalList.map(j => j.id))
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('Pilih minimal 1 jadwal untuk dihapus')
      return
    }
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    setIsBulkDeleting(true)

    try {
      const response = await fetch('/api/jadwal-ujian/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })

      const data = await response.json()

      if (response.ok) {
        await fetchJadwal()
        setIsBulkDeleteDialogOpen(false)
        setSelectedIds([])
        toast.success(`${data.count} jadwal berhasil dihapus`)
      } else {
        toast.error(data.error || 'Gagal menghapus jadwal')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat menghapus jadwal')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/jadwal-ujian/${deleteId}`, { method: 'DELETE' })
      const data = await response.json()

      if (response.ok) {
        await fetchJadwal()
        setIsDeleteDialogOpen(false)
        setDeleteId(null)
        toast.success('Jadwal ujian berhasil dihapus')
      } else {
        toast.error(data.error || 'Gagal menghapus jadwal ujian')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat menghapus jadwal ujian')
    } finally {
      setIsDeleting(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      namaUjian: '',
      matpelId: '',
      bankSoalId: '',
      pesertaIds: [],
      tanggalUjian: '',
      jamMulai: '',
      durasi: 60,
      minimumPengerjaan: null,
      acakSoal: false,
      acakOpsi: false,
      tampilkanNilai: true,
      resetPelanggaranOnEnable: true,
      autoSubmitOnViolation: false,
      isActive: true,
    })
  }

  const handleOpenDialog = () => {
    resetForm()
    setFilterKelas('all')
    setIsDialogOpen(true)
  }

  const togglePeserta = (pesertaId: string) => {
    setFormData(prev => ({
      ...prev,
      pesertaIds: prev.pesertaIds.includes(pesertaId)
        ? prev.pesertaIds.filter(id => id !== pesertaId)
        : [...prev.pesertaIds, pesertaId]
    }))
  }

  const selectAllPeserta = () => {
    setFormData(prev => ({
      ...prev,
      pesertaIds: filteredPeserta.map(p => p.id)
    }))
  }

  const deselectAllPeserta = () => {
    setFormData(prev => ({ ...prev, pesertaIds: [] }))
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
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Jadwal Ujian</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Kelola jadwal dan pengaturan ujian</p>
      </div>

      {/* Jadwal List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Daftar Jadwal Ujian</CardTitle>
              <CardDescription>Kelola jadwal ujian yang telah dibuat</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Hapus Terpilih ({selectedIds.length})</span>
                </Button>
              )}
              <Button onClick={handleOpenDialog} size="sm" className="gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4" />
                Buat Jadwal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={jadwalList}
            columns={[
              {
                header: () => (
                  <input
                    type="checkbox"
                    checked={selectedIds.length === jadwalList.length && jadwalList.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                ),
                accessor: () => null,
                cell: (row) => (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleSelectJadwal(row.id)}
                    className="rounded border-gray-300"
                  />
                ),
                className: 'w-12',
              },
              {
                header: 'Nama Ujian',
                accessor: 'namaUjian',
                cell: (row) => <span className="font-medium">{row.namaUjian}</span>,
              },
              {
                header: 'Bank Soal',
                accessor: 'bankSoalId',
                cell: (row) => (
                  <Badge variant="secondary">
                    {row.bankSoal?.kodeBankSoal || '-'}
                  </Badge>
                ),
              },
              {
                header: 'Kelas',
                accessor: 'kelasId',
                cell: (row) => row.kelas?.name || '-',
              },
              {
                header: 'Tanggal & Waktu',
                accessor: 'tanggalUjian',
                cell: (row) => (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(row.tanggalUjian), 'dd MMM yyyy', { locale: localeId })}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      {row.jamMulai}
                    </div>
                  </div>
                ),
              },
              {
                header: 'Durasi',
                accessor: 'durasi',
                cell: (row) => `${row.durasi} menit`,
              },
              {
                header: 'Pengaturan',
                accessor: () => null,
                cell: (row) => (
                  <div className="flex flex-col gap-1 text-xs">
                    {row.acakSoal && <Badge variant="outline" className="w-fit">Acak Soal</Badge>}
                    {row.acakOpsi && <Badge variant="outline" className="w-fit">Acak Opsi</Badge>}
                    {row.tampilkanNilai && <Badge variant="outline" className="w-fit">Tampilkan Nilai</Badge>}
                  </div>
                ),
              },
              {
                header: 'Status',
                accessor: 'isActive',
                cell: (row) => (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={row.isActive}
                      onCheckedChange={() => toggleIsActive(row.id, row.isActive)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <span className="text-xs">
                      {row.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
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
                      onClick={() => handleExportKartu(row.id, row.namaUjian)}
                      title="Export Kartu Ujian PDF"
                      disabled={loadingExport.has(row.id)}
                      className="relative text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      {loadingExport.has(row.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
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
            searchPlaceholder="Cari jadwal ujian..."
            searchKeys={['namaUjian']}
            filters={[
              {
                key: 'bankSoalId',
                label: 'Bank Soal',
                options: bankSoalList.map(b => ({ value: b.id, label: b.kodeBankSoal })),
              },
              {
                key: 'kelasId',
                label: 'Kelas',
                options: kelasList.map(k => ({ value: k.id, label: k.name })),
              },
            ]}
            emptyMessage={
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium">Belum ada jadwal ujian</p>
                <p className="text-sm mt-1">Klik tombol "Buat Jadwal" untuk membuat jadwal baru</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl sm:max-w-5xl md:max-w-5xl lg:max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Jadwal Ujian' : 'Buat Jadwal Ujian Baru'}
            </DialogTitle>
            <DialogDescription>
              Isi form di bawah untuk {editingId ? 'mengupdate' : 'membuat'} jadwal ujian
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Grid 2 Kolom untuk Form */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {/* Nama Ujian */}
              <div className="space-y-2">
                <Label htmlFor="namaUjian">Nama Ujian *</Label>
                <Input
                  id="namaUjian"
                  value={formData.namaUjian}
                  onChange={(e) => setFormData({ ...formData, namaUjian: e.target.value })}
                  placeholder="Contoh: Ujian Tengah Semester Matematika"
                  required
                  className="w-full"
                />
              </div>

              {/* Mata Pelajaran */}
              <div className="space-y-2">
                <Label htmlFor="matpel">Mata Pelajaran *</Label>
                <Select
                  value={formData.matpelId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, matpelId: value, bankSoalId: '' })
                  }}
                  required
                >
                  <SelectTrigger className="w-full">
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

              {/* Bank Soal */}
              <div className="space-y-2">
                <Label htmlFor="bankSoal">Bank Soal *</Label>
                <Select
                  value={formData.bankSoalId}
                  onValueChange={(value) => setFormData({ ...formData, bankSoalId: value })}
                  required
                  disabled={!formData.matpelId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={formData.matpelId ? "Pilih bank soal" : "Pilih mata pelajaran dulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBankSoal.length > 0 ? (
                      filteredBankSoal.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.kodeBankSoal}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        Tidak ada bank soal untuk mata pelajaran ini
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Tanggal Ujian */}
              <div className="space-y-2">
                <Label htmlFor="tanggalUjian">Tanggal Ujian *</Label>
                <Input
                  id="tanggalUjian"
                  type="date"
                  value={formData.tanggalUjian}
                  onChange={(e) => setFormData({ ...formData, tanggalUjian: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              {/* Jam Mulai */}
              <div className="space-y-2">
                <Label htmlFor="jamMulai">Jam Mulai *</Label>
                <Input
                  id="jamMulai"
                  type="time"
                  value={formData.jamMulai}
                  onChange={(e) => setFormData({ ...formData, jamMulai: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              {/* Durasi */}
              <div className="space-y-2">
                <Label htmlFor="durasi">Durasi (menit) *</Label>
                <Input
                  id="durasi"
                  type="number"
                  min="1"
                  value={formData.durasi}
                  onChange={(e) => setFormData({ ...formData, durasi: parseInt(e.target.value) || 60 })}
                  required
                  className="w-full"
                />
              </div>

              {/* Minimum Pengerjaan */}
              <div className="space-y-2">
                <Label htmlFor="minimumPengerjaan">Minimum Pengerjaan (menit)</Label>
                <Input
                  id="minimumPengerjaan"
                  type="number"
                  min="0"
                  value={formData.minimumPengerjaan || ''}
                  onChange={(e) => setFormData({ ...formData, minimumPengerjaan: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Kosongkan jika tidak ada"
                  className="w-full"
                />
              </div>
            </div>

            {/* Peserta */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-12 gap-4 items-start">
                {/* Left: Filter */}
                <div className="col-span-3 space-y-3">
                  <Label className="text-base font-semibold">Filter Kelas</Label>
                  <Select
                    value={filterKelas || 'all'}
                    onValueChange={(value) => setFilterKelas(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Semua Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {kelasList.map((kls) => (
                        <SelectItem key={kls.id} value={kls.id}>
                          {kls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-col gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAllPeserta} className="w-full">
                      Pilih Semua
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={deselectAllPeserta} className="w-full">
                      Hapus Semua
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600 font-medium pt-2">
                    {formData.pesertaIds.length} / {filteredPeserta.length} dipilih
                  </p>
                </div>

                {/* Right: Peserta List */}
                <div className="col-span-9 space-y-2">
                  <Label className="text-base font-semibold">Peserta Ujian *</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
                    {filteredPeserta.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Tidak ada peserta{filterKelas && filterKelas !== 'all' ? ' di kelas ini' : ''}
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {filteredPeserta.map((peserta) => (
                          <label key={peserta.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded border border-transparent hover:border-blue-200 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.pesertaIds.includes(peserta.id)}
                              onChange={() => togglePeserta(peserta.id)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm truncate">
                              {peserta.name} ({peserta.noUjian})
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pengaturan */}
            <div className="border-t pt-3">
              <Label className="text-base font-semibold mb-3 block">Pengaturan Ujian</Label>
              
              {/* Row 1: Acak Soal & Acak Opsi */}
              <div className="grid grid-cols-2 gap-8 mb-4">
                {/* Acak Soal */}
                <div className="space-y-2">
                  <Label>Acak Soal</Label>
                  <RadioGroup
                    value={formData.acakSoal ? 'true' : 'false'}
                    onValueChange={(value) => setFormData({ ...formData, acakSoal: value === 'true' })}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="acak-soal-ya" />
                        <Label htmlFor="acak-soal-ya" className="cursor-pointer font-normal">Ya</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="acak-soal-tidak" />
                        <Label htmlFor="acak-soal-tidak" className="cursor-pointer font-normal">Tidak</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Acak Opsi */}
                <div className="space-y-2">
                  <Label>Acak Opsi Jawaban</Label>
                  <RadioGroup
                    value={formData.acakOpsi ? 'true' : 'false'}
                    onValueChange={(value) => setFormData({ ...formData, acakOpsi: value === 'true' })}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="acak-opsi-ya" />
                        <Label htmlFor="acak-opsi-ya" className="cursor-pointer font-normal">Ya</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="acak-opsi-tidak" />
                        <Label htmlFor="acak-opsi-tidak" className="cursor-pointer font-normal">Tidak</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Row 2: Tampilkan Nilai & Reset Pelanggaran */}
              <div className="grid grid-cols-2 gap-8 mb-4">
                {/* Tampilkan Nilai Siswa */}
                <div className="space-y-2">
                  <Label>Tampilkan Nilai ke Siswa</Label>
                  <RadioGroup
                    value={formData.tampilkanNilai ? 'true' : 'false'}
                    onValueChange={(value) => setFormData({ ...formData, tampilkanNilai: value === 'true' })}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="tampilkan-nilai-ya" />
                        <Label htmlFor="tampilkan-nilai-ya" className="cursor-pointer font-normal">Ya</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="tampilkan-nilai-tidak" />
                        <Label htmlFor="tampilkan-nilai-tidak" className="cursor-pointer font-normal">Tidak</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Reset Pelanggaran Saat Enable */}
                <div className="space-y-2">
                  <Label>Reset Pelanggaran Saat Aktivasi</Label>
                  <p className="text-xs text-gray-500">Reset counter pelanggaran saat admin aktifkan akun peserta</p>
                  <RadioGroup
                    value={formData.resetPelanggaranOnEnable ? 'true' : 'false'}
                    onValueChange={(value) => setFormData({ ...formData, resetPelanggaranOnEnable: value === 'true' })}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="reset-pelanggaran-ya" />
                        <Label htmlFor="reset-pelanggaran-ya" className="cursor-pointer font-normal">Ya</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="reset-pelanggaran-tidak" />
                        <Label htmlFor="reset-pelanggaran-tidak" className="cursor-pointer font-normal">Tidak</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Row 3: Auto Submit & Status */}
              <div className="grid grid-cols-2 gap-8">
                {/* Auto Submit On Violation */}
                <div className="space-y-2">
                  <Label>Auto Submit Saat 5x Pelanggaran</Label>
                  <p className="text-xs text-gray-500">Jawaban otomatis terkirim saat peserta blur 5x (mode strict)</p>
                  <RadioGroup
                    value={formData.autoSubmitOnViolation ? 'true' : 'false'}
                    onValueChange={(value) => setFormData({ ...formData, autoSubmitOnViolation: value === 'true' })}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="auto-submit-ya" />
                        <Label htmlFor="auto-submit-ya" className="cursor-pointer font-normal">Ya</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="auto-submit-tidak" />
                        <Label htmlFor="auto-submit-tidak" className="cursor-pointer font-normal">Tidak</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Status Aktif */}
                <div className="space-y-2">
                  <Label>Status Jadwal</Label>
                  <RadioGroup
                    value={formData.isActive ? 'true' : 'false'}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="status-aktif" />
                        <Label htmlFor="status-aktif" className="cursor-pointer font-normal">Aktif</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="status-nonaktif" />
                        <Label htmlFor="status-nonaktif" className="cursor-pointer font-normal">Nonaktif</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingId ? 'Mengupdate...' : 'Membuat...'}
                  </>
                ) : (
                  editingId ? 'Update Jadwal' : 'Buat Jadwal'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Hapus Jadwal Ujian
            </DialogTitle>
            <DialogDescription className="pt-3">
              Apakah Anda yakin ingin menghapus jadwal ujian ini?
              <br />
              <span className="text-red-600 font-medium">Tindakan ini tidak dapat dibatalkan.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Hapus {selectedIds.length} Jadwal Ujian
            </DialogTitle>
            <DialogDescription className="pt-3">
              Apakah Anda yakin ingin menghapus {selectedIds.length} jadwal ujian yang dipilih?
              <br />
              <span className="text-red-600 font-medium">Tindakan ini tidak dapat dibatalkan.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
              disabled={isBulkDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={isBulkDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Semua
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Kartu Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Download className="h-5 w-5" />
              Export Kartu Ujian
            </DialogTitle>
            <DialogDescription className="pt-3">
              Pilih kelas untuk export kartu ujian
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="exportKelas">Filter Kelas</Label>
              <Select
                value={exportKelasId}
                onValueChange={setExportKelasId}
              >
                <SelectTrigger id="exportKelas" className="w-full">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {exportKelasList.map((kls) => (
                    <SelectItem key={kls.id} value={kls.id}>
                      {kls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {exportKelasId === 'all' 
                  ? 'Kartu ujian akan digenerate untuk semua kelas'
                  : `Kartu ujian hanya untuk kelas ${exportKelasList.find(k => k.id === exportKelasId)?.name || ''}`
                }
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExportDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={confirmExportKartu}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
