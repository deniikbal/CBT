'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Plus, Edit, Trash2, ArrowLeft, FileText, CheckCircle2, BookOpen, Target, TrendingUp } from 'lucide-react'
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
    <div className="space-y-4">
      {/* Header dengan Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/admin/persiapan/bank-soal')}
          className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Bank Soal</span>
        </Button>
      </div>

      {/* Compact Header Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-lg">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm text-blue-100">Bank Soal</div>
              <h1 className="text-2xl font-bold">{bankSoal.kodeBankSoal}</h1>
              {bankSoal.mataPelajaran && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                    {bankSoal.mataPelajaran.kodeMatpel}
                  </Badge>
                  <span className="text-sm text-blue-100">{bankSoal.mataPelajaran.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-blue-200" />
                <div className="text-xs text-blue-100">Target</div>
              </div>
              <div className="text-2xl font-bold">{targetSoal}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-blue-200" />
                <div className="text-xs text-blue-100">Terbuat</div>
              </div>
              <div className="text-2xl font-bold">{soalCount}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <div className="text-xs text-blue-100">Progress</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{percentage}%</div>
                {percentage >= 100 && (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  percentage >= 100 ? 'bg-green-400' : 'bg-white'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Soal List */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Daftar Soal</CardTitle>
              <CardDescription className="text-sm mt-1">
                {soalCount > 0 ? `${soalCount} soal telah dibuat` : 'Belum ada soal'}
              </CardDescription>
            </div>
            <Button 
              onClick={() => router.push(`/admin/persiapan/bank-soal/${bankSoalId}/soal/tambah`)} 
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Soal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={soalList}
            columns={[
              {
                header: 'No',
                accessor: 'nomorSoal',
                cell: (row) => (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                    {row.nomorSoal}
                  </div>
                ),
                className: 'w-20',
              },
              {
                header: 'Soal',
                accessor: 'soal',
                cell: (row) => (
                  <div className="max-w-2xl">
                    <div className="text-sm text-gray-800 line-clamp-2 [&_*]:my-0 [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0 [&_li]:list-disc [&_ol>li]:list-decimal [&_li]:ml-4 [&_img]:max-h-16 [&_img]:object-contain [&_img]:inline">
                      {row.soal ? parse(row.soal) : <span className="text-sm text-gray-400 italic">Soal kosong</span>}
                    </div>
                  </div>
                ),
              },
              {
                header: 'Jawaban',
                accessor: 'jawabanBenar',
                cell: (row) => (
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 font-bold">
                    {row.jawabanBenar}
                  </div>
                ),
                className: 'w-24 text-center',
              },
              {
                header: 'Aksi',
                accessor: () => null,
                cell: (row) => (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="hover:bg-blue-50">
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="hover:bg-red-50">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ),
                className: 'w-24 text-right',
              },
            ]}
            searchPlaceholder="Cari soal..."
            searchKeys={['soal', 'nomorSoal']}
            emptyMessage={
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-gray-700">Belum ada soal</p>
                <p className="text-sm text-gray-500 mt-2 mb-4">Mulai buat soal untuk bank soal ini</p>
                <Button 
                  onClick={() => router.push(`/admin/persiapan/bank-soal/${bankSoalId}/soal/tambah`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Soal Pertama
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
