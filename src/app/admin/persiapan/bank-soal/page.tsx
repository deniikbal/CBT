'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, BookOpen, FileText, Loader2, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
  jumlahSoal: number
  sourceType: 'MANUAL' | 'GOOGLE_FORM'
  googleFormUrl?: string
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [formData, setFormData] = useState({ 
    kodeBankSoal: '', 
    matpelId: '', 
    jumlahSoal: 0,
    sourceType: 'MANUAL' as 'MANUAL' | 'GOOGLE_FORM',
    googleFormUrl: ''
  })

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
    fetchBankSoal()
    fetchMataPelajaran()
  }, [])

  const fetchBankSoal = async () => {
    try {
      const user = currentUser || JSON.parse(localStorage.getItem('user') || '{}')
      const url = user.role === 'USER' ? `/api/bank-soal?createdById=${user.id}` : '/api/bank-soal'
      const response = await fetch(url)
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
    
    setIsSubmitting(true)

    try {
      const url = editingId ? `/api/bank-soal/${editingId}` : '/api/bank-soal'
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
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (bankSoal: BankSoal) => {
    setEditingId(bankSoal.id)
    setFormData({ 
      kodeBankSoal: bankSoal.kodeBankSoal, 
      matpelId: bankSoal.matpelId,
      jumlahSoal: bankSoal.jumlahSoal,
      sourceType: bankSoal.sourceType,
      googleFormUrl: bankSoal.googleFormUrl || ''
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
    setFormData({ kodeBankSoal: '', matpelId: '', jumlahSoal: 0, sourceType: 'MANUAL', googleFormUrl: '' })
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Bank Soal</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola bank soal ujian</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Daftar Bank Soal</CardTitle>
              <CardDescription>Total: {bankSoalList.length} bank soal</CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
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
                    <Label htmlFor="kodeBankSoal">Kode Bank Soal *</Label>
                    <Input
                      id="kodeBankSoal"
                      placeholder="Contoh: BS-MTK-001"
                      value={formData.kodeBankSoal}
                      onChange={(e) => setFormData({ ...formData, kodeBankSoal: e.target.value })}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matpelId">Mata Pelajaran *</Label>
                    <Select 
                      value={formData.matpelId} 
                      onValueChange={(value) => setFormData({ ...formData, matpelId: value })}
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
                  <div className="space-y-2">
                    <Label htmlFor="jumlahSoal">Jumlah Soal *</Label>
                    <Input
                      id="jumlahSoal"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.jumlahSoal}
                      onChange={(e) => setFormData({ ...formData, jumlahSoal: parseInt(e.target.value) || 0 })}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sourceType">Sumber Soal *</Label>
                    <Select 
                      value={formData.sourceType} 
                      onValueChange={(value) => setFormData({ ...formData, sourceType: value as 'MANUAL' | 'GOOGLE_FORM', googleFormUrl: '' })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih sumber soal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Soal Manual</SelectItem>
                        <SelectItem value="GOOGLE_FORM">Google Form</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.sourceType === 'GOOGLE_FORM' && (
                    <div className="space-y-2">
                      <Label htmlFor="googleFormUrl">Link Google Form *</Label>
                      <Input
                        id="googleFormUrl"
                        placeholder="https://forms.google.com/..."
                        value={formData.googleFormUrl}
                        onChange={(e) => setFormData({ ...formData, googleFormUrl: e.target.value })}
                        required={formData.sourceType === 'GOOGLE_FORM'}
                        className="w-full"
                      />
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                      Batal
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingId ? 'Mengupdate...' : 'Menyimpan...'}
                        </>
                      ) : (
                        editingId ? 'Update' : 'Simpan'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={bankSoalList}
            columns={[
              {
                header: 'No',
                accessor: 'id',
                cell: (row, index) => index + 1,
                className: 'w-16',
              },
              {
                header: 'Kode Bank Soal',
                accessor: 'kodeBankSoal',
                cell: (row) => <span className="font-medium">{row.kodeBankSoal}</span>,
              },
              {
                header: 'Mata Pelajaran',
                accessor: 'matpelId',
                cell: (row) => (
                  row.mataPelajaran ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {row.mataPelajaran.kodeMatpel}
                      </span>
                      <span>{row.mataPelajaran.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )
                ),
              },
              {
                header: 'Sumber Soal',
                accessor: 'sourceType',
                cell: (row) => (
                  <div className="flex items-center gap-2">
                    {row.sourceType === 'GOOGLE_FORM' ? (
                      <>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Google Form</span>
                        {row.googleFormUrl && (
                          <a 
                            href={row.googleFormUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            title="Buka Google Form"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Manual</span>
                    )}
                  </div>
                ),
              },
              {
                header: 'Target Soal',
                accessor: 'jumlahSoal',
                cell: (row) => (
                  <span><span className="font-semibold">{row.jumlahSoal}</span> soal</span>
                ),
              },
              {
                header: 'Soal Terbuat',
                accessor: 'soalCount',
                cell: (row) => {
                  const soalCount = row.soalCount || 0
                  const targetSoal = row.jumlahSoal
                  const percentage = targetSoal > 0 ? Math.round((soalCount / targetSoal) * 100) : 0
                  return (
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${soalCount >= targetSoal ? 'text-green-600' : 'text-orange-600'}`}>
                        {soalCount}/{targetSoal}
                      </span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  )
                },
              },
              {
                header: 'Aksi',
                accessor: () => null,
                cell: (row) => (
                  <div className="flex justify-end gap-2">
                    {row.sourceType === 'MANUAL' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => router.push(`/admin/persiapan/bank-soal/${row.id}/soal`)}
                        className="gap-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        <FileText className="h-4 w-4" />
                        Kelola Soal
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
            searchPlaceholder="Cari bank soal..."
            searchKeys={['kodeBankSoal']}
            filters={[
              {
                key: 'matpelId',
                label: 'Mata Pelajaran',
                options: matpelList.map(m => ({ value: m.id, label: `${m.kodeMatpel} - ${m.name}` })),
              },
            ]}
            emptyMessage={
              <div className="flex flex-col items-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mb-2" />
                <p>Belum ada data bank soal</p>
                <p className="text-sm text-gray-500">Tambahkan bank soal untuk memulai</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
