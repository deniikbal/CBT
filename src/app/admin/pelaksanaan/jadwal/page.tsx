'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Calendar, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface BankSoal {
  id: string
  kodeBankSoal: string
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
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [pesertaList, setPesertaList] = useState<Peserta[]>([])
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    namaUjian: '',
    bankSoalId: '',
    kelasId: '',
    pesertaIds: [] as string[],
    tanggalUjian: '',
    jamMulai: '',
    durasi: 60,
    minimumPengerjaan: null as number | null,
    acakSoal: false,
    acakOpsi: false,
    tampilkanNilai: true,
  })

  useEffect(() => {
    fetchJadwal()
    fetchBankSoal()
    fetchKelas()
    fetchPeserta()
  }, [])

  useEffect(() => {
    if (formData.kelasId) {
      const filtered = pesertaList.filter(p => p.kelasId === formData.kelasId)
      setFilteredPeserta(filtered)
    } else {
      setFilteredPeserta(pesertaList)
    }
  }, [formData.kelasId, pesertaList])

  const fetchJadwal = async () => {
    try {
      const response = await fetch('/api/jadwal-ujian')
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
      const response = await fetch('/api/bank-soal')
      if (response.ok) {
        const data = await response.json()
        setBankSoalList(data)
      }
    } catch (error) {
      console.error('Error fetching bank soal:', error)
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

    try {
      const url = editingId ? `/api/jadwal-ujian/${editingId}` : '/api/jadwal-ujian'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
    }
  }

  const handleEdit = async (jadwal: JadwalUjian) => {
    setEditingId(jadwal.id)
    
    // Fetch detail to get peserta list
    const response = await fetch(`/api/jadwal-ujian/${jadwal.id}`)
    if (response.ok) {
      const data = await response.json()
      setFormData({
        namaUjian: jadwal.namaUjian,
        bankSoalId: jadwal.bankSoalId,
        kelasId: jadwal.kelasId || '',
        pesertaIds: data.peserta?.map((p: Peserta) => p.id) || [],
        tanggalUjian: format(new Date(jadwal.tanggalUjian), 'yyyy-MM-dd'),
        jamMulai: jadwal.jamMulai,
        durasi: jadwal.durasi,
        minimumPengerjaan: jadwal.minimumPengerjaan,
        acakSoal: jadwal.acakSoal,
        acakOpsi: jadwal.acakOpsi,
        tampilkanNilai: jadwal.tampilkanNilai,
      })
      setIsDialogOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ujian ini?')) return

    try {
      const response = await fetch(`/api/jadwal-ujian/${id}`, { method: 'DELETE' })
      const data = await response.json()

      if (response.ok) {
        await fetchJadwal()
        toast.success('Jadwal ujian berhasil dihapus')
      } else {
        toast.error(data.error || 'Gagal menghapus jadwal ujian')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat menghapus jadwal ujian')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      namaUjian: '',
      bankSoalId: '',
      kelasId: '',
      pesertaIds: [],
      tanggalUjian: '',
      jamMulai: '',
      durasi: 60,
      minimumPengerjaan: null,
      acakSoal: false,
      acakOpsi: false,
      tampilkanNilai: true,
    })
  }

  const handleOpenDialog = () => {
    resetForm()
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
      <div className="p-8">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Jadwal Ujian</h1>
          <p className="text-gray-600 mt-1">Kelola jadwal dan pengaturan ujian</p>
        </div>
        <Button onClick={handleOpenDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Buat Jadwal
        </Button>
      </div>

      {/* Jadwal List */}
      <Card>
        <CardContent className="pt-6">
          {jadwalList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium">Belum ada jadwal ujian</p>
              <p className="text-sm mt-1">Klik tombol "Buat Jadwal" untuk membuat jadwal baru</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Ujian</TableHead>
                  <TableHead>Bank Soal</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Pengaturan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jadwalList.map((jadwal) => (
                  <TableRow key={jadwal.id}>
                    <TableCell className="font-medium">{jadwal.namaUjian}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {jadwal.bankSoal?.kodeBankSoal || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{jadwal.kelas?.name || 'Semua Kelas'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(jadwal.tanggalUjian), 'dd MMM yyyy', { locale: localeId })}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          {jadwal.jamMulai}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{jadwal.durasi} menit</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        {jadwal.acakSoal && <Badge variant="outline" className="w-fit">Acak Soal</Badge>}
                        {jadwal.acakOpsi && <Badge variant="outline" className="w-fit">Acak Opsi</Badge>}
                        {jadwal.tampilkanNilai && <Badge variant="outline" className="w-fit">Tampilkan Nilai</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(jadwal)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(jadwal.id)}>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Jadwal Ujian' : 'Buat Jadwal Ujian Baru'}
            </DialogTitle>
            <DialogDescription>
              Isi form di bawah untuk {editingId ? 'mengupdate' : 'membuat'} jadwal ujian
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Nama Ujian */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="namaUjian">Nama Ujian *</Label>
                <Input
                  id="namaUjian"
                  value={formData.namaUjian}
                  onChange={(e) => setFormData({ ...formData, namaUjian: e.target.value })}
                  placeholder="Contoh: Ujian Tengah Semester Matematika"
                  required
                />
              </div>

              {/* Bank Soal */}
              <div className="space-y-2">
                <Label htmlFor="bankSoal">Bank Soal *</Label>
                <Select
                  value={formData.bankSoalId}
                  onValueChange={(value) => setFormData({ ...formData, bankSoalId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bank soal" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankSoalList.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.kodeBankSoal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Kelas */}
              <div className="space-y-2">
                <Label htmlFor="kelas">Kelas (Opsional)</Label>
                <div className="space-y-2">
                  <Select
                    value={formData.kelasId || undefined}
                    onValueChange={(value) => setFormData({ ...formData, kelasId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {kelasList.map((kls) => (
                        <SelectItem key={kls.id} value={kls.id}>
                          {kls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.kelasId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, kelasId: '' })}
                      className="h-8 text-xs"
                    >
                      Hapus filter kelas
                    </Button>
                  )}
                </div>
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
                />
              </div>

              {/* Minimum Pengerjaan */}
              <div className="space-y-2">
                <Label htmlFor="minimumPengerjaan">Minimum Pengerjaan (menit, opsional)</Label>
                <Input
                  id="minimumPengerjaan"
                  type="number"
                  min="0"
                  value={formData.minimumPengerjaan || ''}
                  onChange={(e) => setFormData({ ...formData, minimumPengerjaan: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Kosongkan jika tidak ada"
                />
              </div>
            </div>

            {/* Peserta */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Peserta Ujian *</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={selectAllPeserta}>
                    Pilih Semua
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={deselectAllPeserta}>
                    Hapus Semua
                  </Button>
                </div>
              </div>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                {filteredPeserta.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Tidak ada peserta{formData.kelasId ? ' di kelas ini' : ''}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredPeserta.map((peserta) => (
                      <label key={peserta.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.pesertaIds.includes(peserta.id)}
                          onChange={() => togglePeserta(peserta.id)}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {peserta.name} ({peserta.noUjian})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {formData.pesertaIds.length} peserta dipilih
              </p>
            </div>

            {/* Pengaturan */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-base font-semibold">Pengaturan Ujian</Label>
              
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
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingId ? 'Update Jadwal' : 'Buat Jadwal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
