'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Award, Eye, FileText } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface HasilUjian {
  id: string
  pesertaId: string
  pesertaName: string
  pesertaNoUjian: string
  kelasName: string
  namaUjian: string
  bankSoalKode: string
  waktuMulai: string
  waktuSelesai: string
  durasi: number
  nilai: number
  totalSoal: number
  benar: number
  salah: number
  kosong: number
  status: string
}

interface JawabanDetail {
  nomorSoal: number
  soal: string
  pilihanA: string
  pilihanB: string
  pilihanC: string
  pilihanD: string
  pilihanE?: string
  jawabanBenar: string
  jawabanSiswa: string
  pembahasan: string
  benar: boolean
}

export default function HasilUjianPage() {
  const [hasilList, setHasilList] = useState<HasilUjian[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHasil, setSelectedHasil] = useState<HasilUjian | null>(null)
  const [jawabanDetail, setJawabanDetail] = useState<JawabanDetail[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [errorDetail, setErrorDetail] = useState<string>('')

  useEffect(() => {
    fetchHasil()
  }, [])

  const fetchHasil = async () => {
    try {
      console.log('[Hasil Ujian Page] Fetching hasil ujian...')
      const response = await fetch('/api/admin/hasil-ujian')
      console.log('[Hasil Ujian Page] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Hasil Ujian Page] Fetched data:', data.length, 'results')
        setHasilList(data)
      } else {
        const error = await response.json()
        console.error('[Hasil Ujian Page] API error:', error)
      }
    } catch (error) {
      console.error('[Hasil Ujian Page] Failed to fetch hasil ujian:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (hasil: HasilUjian) => {
    setSelectedHasil(hasil)
    setJawabanDetail([])
    setErrorDetail('')
    setLoadingDetail(true)
    try {
      console.log('[Detail] Fetching detail untuk hasilId:', hasil.id)
      const response = await fetch(`/api/admin/hasil-ujian/${hasil.id}/detail`)
      console.log('[Detail] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Detail] Fetched detail data:', data.length, 'soal')
        console.log('[Detail] First 3 soal:', data.slice(0, 3))
        setJawabanDetail(data)
        if (data.length === 0) {
          setErrorDetail('Belum ada soal untuk ujian ini')
        }
      } else {
        const error = await response.json()
        console.error('[Detail] API error:', error)
        setErrorDetail(error.error || 'Gagal memuat detail jawaban')
        setJawabanDetail([])
      }
    } catch (error) {
      console.error('[Detail] Failed to fetch jawaban detail:', error)
      setErrorDetail(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat detail')
      setJawabanDetail([])
    } finally {
      setLoadingDetail(false)
    }
  }

  const getNilaiGrade = (nilai: number) => {
    if (nilai >= 85) return { grade: 'A', color: 'bg-green-500' }
    if (nilai >= 75) return { grade: 'B', color: 'bg-blue-500' }
    if (nilai >= 65) return { grade: 'C', color: 'bg-yellow-500' }
    if (nilai >= 55) return { grade: 'D', color: 'bg-orange-500' }
    return { grade: 'E', color: 'bg-red-500' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hasil Ujian</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Lihat hasil ujian siswa yang sudah selesai</p>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Hasil Ujian</CardTitle>
          <CardDescription>Klik "Detail" untuk melihat jawaban siswa</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={hasilList}
            columns={[
              {
                header: 'Peserta',
                accessor: 'pesertaName',
                cell: (row) => (
                  <div>
                    <div className="font-semibold">{row.pesertaName}</div>
                    <div className="text-sm text-gray-500">{row.pesertaNoUjian}</div>
                  </div>
                ),
              },
              {
                header: 'Kelas',
                accessor: 'kelasName',
              },
              {
                header: 'Ujian',
                accessor: 'namaUjian',
              },
              {
                header: 'Nilai',
                accessor: 'nilai',
                cell: (row) => (
                  <span className="font-semibold text-lg">{row.nilai}</span>
                ),
              },
              {
                header: 'Benar/Salah/Kosong',
                accessor: 'benar',
                cell: (row) => (
                  <div className="text-sm space-y-1">
                    <div className="flex gap-2">
                      <Badge className="bg-green-500">✓ {row.benar}</Badge>
                      <Badge className="bg-red-500">✗ {row.salah}</Badge>
                      <Badge variant="outline">- {row.kosong}</Badge>
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
                header: 'Waktu Selesai',
                accessor: 'waktuSelesai',
                cell: (row) => row.waktuSelesai ? format(new Date(row.waktuSelesai), 'dd MMM yyyy HH:mm', { locale: localeId }) : '-',
              },
              {
                header: 'Aksi',
                accessor: () => null,
                cell: (row) => (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetail(row)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detail
                  </Button>
                ),
                className: 'text-right',
              },
            ]}
            searchPlaceholder="Cari peserta atau ujian..."
            searchKeys={['pesertaName', 'pesertaNoUjian', 'namaUjian']}
            filters={[
              {
                key: 'kelasName',
                label: 'Kelas',
                options: [...new Set(hasilList.map(h => h.kelasName))].map(kelas => ({
                  value: kelas,
                  label: kelas,
                })),
              },
              {
                key: 'namaUjian',
                label: 'Ujian',
                options: [...new Set(hasilList.map(h => h.namaUjian))].map(ujian => ({
                  value: ujian,
                  label: ujian,
                })),
              },
            ]}
            emptyMessage={
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Belum ada hasil ujian yang tersedia</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedHasil} onOpenChange={() => setSelectedHasil(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detail Jawaban - {selectedHasil?.pesertaName}
            </DialogTitle>
            <DialogDescription>
              Ujian: {selectedHasil?.namaUjian} | Nilai: {selectedHasil?.nilai} | Benar: {selectedHasil?.benar}/{selectedHasil?.totalSoal}
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : errorDetail ? (
            <div className="text-center py-8 p-4 bg-red-50 border border-red-200 rounded text-red-600">
              {errorDetail}
            </div>
          ) : jawabanDetail.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Belum ada data jawaban</div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {jawabanDetail.map((jawaban) => {
                const statusBg = jawaban.benar ? 'bg-green-50' : jawaban.jawabanSiswa ? 'bg-red-50' : 'bg-gray-50';
                const statusBorder = jawaban.benar ? 'border-green-200' : jawaban.jawabanSiswa ? 'border-red-200' : 'border-gray-200';
                
                return (
                  <div key={jawaban.nomorSoal} className={`p-4 border rounded-lg ${statusBg} ${statusBorder}`}>
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-base">Soal {jawaban.nomorSoal}</span>
                      {jawaban.benar ? (
                        <Badge className="bg-green-500">✓ Benar</Badge>
                      ) : jawaban.jawabanSiswa ? (
                        <Badge className="bg-red-500">✗ Salah</Badge>
                      ) : (
                        <Badge variant="outline">- Kosong</Badge>
                      )}
                    </div>

                    {/* Soal Text */}
                    <div className="mb-3 p-2 bg-white rounded border border-gray-200">
                      <p className="text-sm">{jawaban.soal}</p>
                    </div>

                    {/* Jawaban Siswa Section */}
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2 text-gray-700">Jawaban Siswa:</p>
                      {jawaban.jawabanSiswa ? (
                        <div className="p-3 bg-blue-50 border border-blue-300 rounded">
                          <div className="flex gap-2">
                            <span className="font-bold text-blue-900 min-w-6">{jawaban.jawabanSiswa}.</span>
                            <span className="text-blue-900">
                              {jawaban[`pilihan${jawaban.jawabanSiswa}` as any] || '(Teks pilihan tidak ditemukan)'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-100 border border-gray-300 rounded text-gray-700">
                          <span>Tidak menjawab (Kosong)</span>
                        </div>
                      )}
                    </div>

                    {/* Jawaban Benar Section */}
                    <div className="mb-3">
                      <p className="text-sm font-semibold mb-2 text-gray-700">Jawaban Benar:</p>
                      <div className="p-3 bg-green-50 border border-green-300 rounded">
                        <div className="flex gap-2">
                          <span className="font-bold text-green-900 min-w-6">{jawaban.jawabanBenar}.</span>
                          <span className="text-green-900">
                            {jawaban[`pilihan${jawaban.jawabanBenar}` as any] || '(Teks pilihan tidak ditemukan)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pembahasan */}
                    {jawaban.pembahasan && (
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="font-semibold text-blue-900 text-sm mb-1">Pembahasan:</p>
                        <p className="text-sm text-blue-800">{jawaban.pembahasan}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
