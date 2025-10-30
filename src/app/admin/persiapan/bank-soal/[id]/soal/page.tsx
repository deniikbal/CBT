'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Plus, Edit, Trash2, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { DataTable, Column } from '@/components/ui/data-table'
import parse from 'html-react-parser'

interface BankSoal {
  id: string
  kodeBankSoal: string
  jumlahSoal: number
  mataPelajaran: {
    name: string
    kodeMatpel: string
  } | null
}

interface Soal {
  id: string
  bankSoalId: string
  nomorSoal: number
  soal: string
  pilihanA: string
  pilihanB: string
  pilihanC: string
  pilihanD: string
  pilihanE: string | null
  jawabanBenar: 'A' | 'B' | 'C' | 'D' | 'E'
}

export default function KelolaSoalPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: bankSoalId } = use(params)

  const [bankSoal, setBankSoal] = useState<BankSoal | null>(null)
  const [soalList, setSoalList] = useState<Soal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBankSoal()
    fetchSoal()
  }, [])

  const fetchBankSoal = async () => {
    try {
      const response = await fetch(`/api/bank-soal/${bankSoalId}`)
      if (response.ok) {
        const data = await response.json()
        setBankSoal(data)
      } else {
        toast.error('Bank soal tidak ditemukan')
        router.push('/admin/persiapan/bank-soal')
      }
    } catch (error) {
      console.error('Error fetching bank soal:', error)
      toast.error('Gagal memuat data bank soal')
    }
  }

  const fetchSoal = async () => {
    try {
      const response = await fetch(`/api/bank-soal/${bankSoalId}/soal`)
      if (response.ok) {
        const data = await response.json()
        setSoalList(data)
      }
    } catch (error) {
      console.error('Error fetching soal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (soal: Soal) => {
    // Navigate to edit page with soal data
    router.push(`/admin/persiapan/bank-soal/${bankSoalId}/soal/${soal.id}/edit`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return

    try {
      const response = await fetch(`/api/bank-soal/${bankSoalId}/soal/${id}`, { 
        method: 'DELETE' 
      })
      const data = await response.json()

      if (response.ok) {
        await fetchSoal()
        toast.success('Soal berhasil dihapus')
      } else {
        toast.error(data.error || 'Gagal menghapus soal')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat menghapus soal')
    }
  }

  if (loading || !bankSoal) {
    return (
      <div className="flex justify-center items-center p-8 md:p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const soalCount = soalList.length
  const targetSoal = bankSoal.jumlahSoal
  const percentage = targetSoal > 0 ? Math.round((soalCount / targetSoal) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/admin/persiapan/bank-soal')}
          className="gap-2 text-xs sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Button>
      </div>

      {/* Header Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Kelola Soal</CardTitle>
          <CardDescription>
            <div className="mt-2 space-y-1 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-semibold text-gray-700">Bank Soal:</span>
                <span className="text-base sm:text-lg font-bold text-blue-600">{bankSoal.kodeBankSoal}</span>
              </div>
              {bankSoal.mataPelajaran && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="font-semibold text-gray-700">Mata Pelajaran:</span>
                  <Badge variant="secondary" className="w-fit">
                    {bankSoal.mataPelajaran.kodeMatpel}
                  </Badge>
                  <span className="text-gray-700">{bankSoal.mataPelajaran.name}</span>
                </div>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs sm:text-sm text-gray-600">Target Soal</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800">{targetSoal}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs sm:text-sm text-gray-600">Soal Terbuat</div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{soalCount}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs sm:text-sm text-gray-600">Progress</div>
              <div className="flex items-end gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{percentage}%</div>
                {percentage >= 100 && (
                  <CheckCircle2 className="h-5 sm:h-6 w-5 sm:w-6 text-green-600 mb-1" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-lg sm:text-xl font-semibold">Daftar Soal</h2>
        <Button onClick={() => router.push(`/admin/persiapan/bank-soal/${bankSoalId}/soal/tambah`)} className="gap-2 w-full sm:w-auto text-xs sm:text-sm">
          <Plus className="h-4 w-4" />
          <span>Tambah Soal</span>
        </Button>
      </div>

      {/* Soal List */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={soalList}
            columns={[
              {
                header: 'No',
                accessor: 'nomorSoal',
                cell: (row) => <span className="font-medium">{row.nomorSoal}</span>,
                className: 'w-16',
              },
              {
                header: 'Soal',
                accessor: 'soal',
                cell: (row) => (
                  <div className="max-w-2xl max-h-32 overflow-hidden rounded border border-gray-200 bg-white p-3">
                    <div className="text-sm text-gray-800 [&_*]:my-0 [&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_li]:list-disc [&_ol>li]:list-decimal [&_li]:ml-4 [&_img]:max-h-24 [&_img]:object-contain">
                      {row.soal ? parse(row.soal) : <span className="text-sm text-gray-500">(Soal kosong)</span>}
                    </div>
                  </div>
                ),
              },
              {
                header: 'Jawaban',
                accessor: 'jawabanBenar',
                cell: (row) => (
                  <Badge variant="outline" className="font-bold">
                    {row.jawabanBenar}
                  </Badge>
                ),
                className: 'w-24',
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
                className: 'w-32 text-right',
              },
            ]}
            searchPlaceholder="Cari soal..."
            searchKeys={['soal', 'nomorSoal']}
            emptyMessage={
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium">Belum ada soal</p>
                <p className="text-sm mt-1">Klik tombol "Tambah Soal" untuk membuat soal baru</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
