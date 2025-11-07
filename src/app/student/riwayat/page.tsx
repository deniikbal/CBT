'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, Trophy, BookOpen, Eye, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Peserta {
  id: string
  name: string
}

interface RiwayatUjian {
  id: string
  namaUjian: string
  bankSoal: string
  tanggalUjian: string
  waktuPengerjaan: number
  nilaiDiperoleh: number
  nilaiMaksimal: number
  persentase: number
  status: string
  tampilkanNilai: boolean
}

export default function RiwayatUjianPage() {
  const [peserta, setPeserta] = useState<Peserta | null>(null)
  const [riwayatList, setRiwayatList] = useState<RiwayatUjian[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    const storedPeserta = localStorage.getItem('peserta')
    if (storedPeserta) {
      const pesertaData = JSON.parse(storedPeserta)
      setPeserta(pesertaData)
      fetchRiwayat(pesertaData.id)
    }
  }, [])

  const fetchRiwayat = async (pesertaId: string) => {
    try {
      const response = await fetch(`/api/peserta/${pesertaId}/riwayat`)
      if (response.ok) {
        const data = await response.json()
        setRiwayatList(data)
      }
    } catch (error) {
      console.error('Error fetching riwayat:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (persentase: number) => {
    if (persentase >= 80) return 'text-green-600'
    if (persentase >= 60) return 'text-blue-600'
    if (persentase >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBadge = (persentase: number) => {
    if (persentase >= 80) return { label: 'SB', color: 'bg-green-100 text-green-800 border-green-200' }
    if (persentase >= 60) return { label: 'B', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    if (persentase >= 40) return { label: 'C', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    return { label: 'PP', color: 'bg-red-100 text-red-800 border-red-200' }
  }

  const calculateStats = () => {
    if (riwayatList.length === 0) {
      return {
        totalUjian: 0,
        rataRata: 0,
        tertinggi: 0,
        terendah: 0
      }
    }

    const visibleScores = riwayatList.filter(r => r.tampilkanNilai)
    
    if (visibleScores.length === 0) {
      return {
        totalUjian: riwayatList.length,
        rataRata: 0,
        tertinggi: 0,
        terendah: 0
      }
    }

    const scores = visibleScores.map(r => r.persentase)
    return {
      totalUjian: riwayatList.length,
      rataRata: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      tertinggi: Math.max(...scores),
      terendah: Math.min(...scores)
    }
  }

  const stats = calculateStats()

  // Pagination logic
  const totalPages = Math.ceil(riwayatList.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = riwayatList.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 rounded-sm">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16 mt-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-sm" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-right">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-4 w-20 mt-1" />
                  </div>
                  <Skeleton className="h-8 w-12 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Riwayat Ujian</h1>
          <p className="text-sm text-gray-600 mt-1">Lihat hasil dan performa ujian Anda</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 rounded-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-blue-100">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Ujian</p>
              <p className="text-lg font-bold">{stats.totalUjian}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-sm border-0 shadow-sm bg-green-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Rata-Rata</p>
              <p className="text-lg font-bold">{stats.rataRata || '-'}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-sm border-0 shadow-sm bg-yellow-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-yellow-100">
              <Trophy className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Tertinggi</p>
              <p className="text-lg font-bold">{stats.tertinggi || '-'}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-sm border-0 shadow-sm bg-red-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Terendah</p>
              <p className="text-lg font-bold">{stats.terendah || '-'}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Riwayat Cards */}
      <div className="space-y-3">
        {riwayatList.length === 0 ? (
          <Card className="rounded-sm p-8 text-center border-2 border-dashed border-gray-200">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada riwayat ujian</h3>
            <p className="text-gray-600">Riwayat ujian yang sudah dikerjakan akan muncul di sini</p>
          </Card>
        ) : (
          <>
            {currentData.map((riwayat) => {
              const badge = getGradeBadge(riwayat.persentase)
              
              return (
                <Card key={riwayat.id} className="rounded-sm p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-sm bg-blue-100 flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{riwayat.namaUjian}</h3>
                        <p className="text-xs text-gray-600 truncate">{riwayat.bankSoal}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(riwayat.tanggalUjian), 'dd MMM yyyy', { locale: localeId })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{riwayat.waktuPengerjaan} menit</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {riwayat.tampilkanNilai ? (
                        <>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Nilai</p>
                            <p className="text-base font-bold">{riwayat.nilaiDiperoleh}/{riwayat.nilaiMaksimal}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Persentase</p>
                            <p className={`text-lg font-bold ${getGradeColor(riwayat.persentase)}`}>
                              {riwayat.persentase}%
                            </p>
                          </div>
                          <Badge className={`${badge.color} border text-xs font-medium`}>
                            {badge.label}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <div className="text-center">
                            <p className="text-xs text-gray-600">Nilai</p>
                            <p className="text-xs text-gray-400">-</p>
                          </div>
                          <Badge variant="secondary" className="text-xs font-medium">
                            Disembunyikan
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
            
            {/* Pagination */}
            {riwayatList.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
                <div className="text-sm text-gray-600">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, riwayatList.length)} dari {riwayatList.length} ujian
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
