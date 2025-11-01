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
                key: 'namaUjian',
                label: 'Ujian',
                options: [...new Set(hasilList.map(h => h.namaUjian))].map(ujian => ({
                  value: ujian,
                  label: ujian,
                })),
              },
              {
                key: 'kelasName',
                label: 'Kelas',
                options: [...new Set(hasilList.map(h => h.kelasName))].map(kelas => ({
                  value: kelas,
                  label: kelas,
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
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-bold">{selectedHasil?.pesertaName}</div>
                <div className="text-sm font-normal text-gray-500">{selectedHasil?.pesertaNoUjian}</div>
              </div>
            </DialogTitle>
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <span className="text-xs text-gray-600">Ujian:</span>
                <span className="text-sm font-semibold text-blue-900">{selectedHasil?.namaUjian}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
                <span className="text-xs text-gray-600">Nilai:</span>
                <span className="text-sm font-bold text-purple-900">{selectedHasil?.nilai}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                <span className="text-xs text-gray-600">Benar:</span>
                <span className="text-sm font-semibold text-green-900">{selectedHasil?.benar}/{selectedHasil?.totalSoal}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
                <span className="text-xs text-gray-600">Salah:</span>
                <span className="text-sm font-semibold text-red-900">{selectedHasil?.salah}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Kosong:</span>
                <span className="text-sm font-semibold text-gray-900">{selectedHasil?.kosong}</span>
              </div>
            </div>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">Memuat detail jawaban...</p>
              </div>
            </div>
          ) : errorDetail ? (
            <div className="text-center py-12">
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg inline-block">
                <div className="text-red-600 font-semibold mb-2">Terjadi Kesalahan</div>
                <div className="text-red-500 text-sm">{errorDetail}</div>
              </div>
            </div>
          ) : jawabanDetail.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">📝</div>
              <p className="text-gray-500">Belum ada data jawaban</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-1">
              <div className="space-y-4 py-4">
                {jawabanDetail.map((jawaban, index) => {
                  const isBenar = jawaban.benar;
                  const isSalah = !jawaban.benar && jawaban.jawabanSiswa;
                  const isKosong = !jawaban.jawabanSiswa;
                  
                  return (
                    <div 
                      key={jawaban.nomorSoal} 
                      className="bg-white border-2 rounded-xl overflow-hidden transition-all hover:shadow-md"
                      style={{
                        borderColor: isBenar ? '#10b981' : isSalah ? '#ef4444' : '#e5e7eb'
                      }}
                    >
                      {/* Header */}
                      <div 
                        className="px-4 py-3 flex items-center justify-between"
                        style={{
                          backgroundColor: isBenar ? '#d1fae5' : isSalah ? '#fee2e2' : '#f9fafb'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{
                              backgroundColor: isBenar ? '#10b981' : isSalah ? '#ef4444' : '#9ca3af',
                              color: 'white'
                            }}
                          >
                            {jawaban.nomorSoal}
                          </div>
                          <span className="font-semibold text-gray-700">Soal Nomor {jawaban.nomorSoal}</span>
                        </div>
                        <Badge 
                          className={
                            isBenar ? 'bg-green-500 hover:bg-green-600' : 
                            isSalah ? 'bg-red-500 hover:bg-red-600' : 
                            'bg-gray-400 hover:bg-gray-500'
                          }
                        >
                          {isBenar ? '✓ Benar' : isSalah ? '✗ Salah' : '− Kosong'}
                        </Badge>
                      </div>

                      {/* Soal Text */}
                      <div className="px-4 py-4 bg-gray-50">
                        <div className="text-sm font-semibold text-gray-600 mb-2">Pertanyaan:</div>
                        <div 
                          className="prose prose-sm max-w-none bg-white p-4 rounded-lg border border-gray-200"
                          dangerouslySetInnerHTML={{ __html: jawaban.soal }}
                        />
                      </div>

                      {/* Pilihan Jawaban */}
                      <div className="px-4 py-4 space-y-2">
                        {['A', 'B', 'C', 'D', 'E'].map((option) => {
                          const pilihanText = jawaban[`pilihan${option}` as keyof typeof jawaban];
                          if (!pilihanText) return null;
                          
                          const isJawabanSiswa = jawaban.jawabanSiswa === option;
                          const isJawabanBenar = jawaban.jawabanBenar === option;
                          
                          let bgColor = 'bg-white';
                          let borderColor = 'border-gray-200';
                          let textColor = 'text-gray-700';
                          let badgeElement = null;
                          
                          if (isJawabanBenar) {
                            bgColor = 'bg-green-50';
                            borderColor = 'border-green-400';
                            badgeElement = (
                              <Badge className="bg-green-500 text-xs">Jawaban Benar</Badge>
                            );
                          }
                          
                          if (isJawabanSiswa && !isBenar) {
                            bgColor = 'bg-red-50';
                            borderColor = 'border-red-400';
                            badgeElement = (
                              <Badge className="bg-red-500 text-xs">Jawaban Siswa</Badge>
                            );
                          }
                          
                          if (isJawabanSiswa && isBenar) {
                            badgeElement = (
                              <Badge className="bg-green-500 text-xs">Jawaban Siswa (Benar)</Badge>
                            );
                          }
                          
                          return (
                            <div
                              key={option}
                              className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor} transition-all`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                  isJawabanBenar ? 'bg-green-500 text-white' :
                                  isJawabanSiswa && !isBenar ? 'bg-red-500 text-white' :
                                  'bg-gray-200 text-gray-600'
                                }`}>
                                  {option}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div 
                                    className={`prose prose-sm max-w-none ${textColor}`}
                                    dangerouslySetInnerHTML={{ __html: pilihanText as string }}
                                  />
                                </div>
                                {badgeElement && (
                                  <div className="flex-shrink-0">
                                    {badgeElement}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Status Footer */}
                      {isKosong && (
                        <div className="px-4 py-3 bg-gray-100 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-semibold">Status:</span>
                            <span>Siswa tidak menjawab soal ini</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
