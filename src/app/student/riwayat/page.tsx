'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, Award, BookOpen, Eye, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, AlertCircle, Monitor } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Peserta {
  id: string
  name: string
}

interface JadwalUjian {
  id: string
  requireExamBrowser: boolean
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
  const router = useRouter()
  const [peserta, setPeserta] = useState<Peserta | null>(null)
  const [riwayatList, setRiwayatList] = useState<RiwayatUjian[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [browserCheckFailed, setBrowserCheckFailed] = useState(false)
  const itemsPerPage = 5

  useEffect(() => {
    const storedPeserta = localStorage.getItem('peserta')
    if (storedPeserta) {
      const pesertaData = JSON.parse(storedPeserta)
      setPeserta(pesertaData)
      fetchRiwayat(pesertaData.id)
      checkBrowserRequirement(pesertaData.id)
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

  const checkBrowserRequirement = async (pesertaId: string) => {
    try {
      const response = await fetch(`/api/peserta/${pesertaId}/jadwal`)
      if (response.ok) {
        const data = await response.json()
        
        // Check if any exam requires exam browser
        const requiresBrowser = data.some((jadwal: JadwalUjian) => jadwal.requireExamBrowser)
        
        if (requiresBrowser) {
          const userAgent = navigator.userAgent
          const hasExamBrowser = userAgent.includes('cbt-')
          
          if (!hasExamBrowser) {
            setBrowserCheckFailed(true)
          }
        }
      }
    } catch (error) {
      console.error('Error checking browser requirement:', error)
    }
  }

  const getGradeColor = (persentase: number) => {
    if (persentase >= 80) return 'text-green-600'
    if (persentase >= 60) return 'text-blue-600'
    if (persentase >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBadge = (persentase: number) => {
    if (persentase >= 80) return { label: 'Sangat Baik', color: 'bg-green-500' }
    if (persentase >= 60) return { label: 'Baik', color: 'bg-blue-500' }
    if (persentase >= 40) return { label: 'Cukup', color: 'bg-yellow-500' }
    return { label: 'Perlu Peningkatan', color: 'bg-red-500' }
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

    // Only calculate from ujian yang ditampilkan nilainya
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

  const handleLogout = () => {
    localStorage.removeItem('peserta')
    router.push('/login')
  }

  // Show browser check error if failed
  if (browserCheckFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-3 sm:p-4">
        <Card className="max-w-md w-full border-red-200 shadow-xl">
          <CardHeader className="text-center pb-3 px-4 sm:px-6 pt-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-red-600" />
            </div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl text-red-900 leading-tight">Browser Tidak Diizinkan</CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
              Riwayat Ujian - CBT System
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-5">
            <Alert variant="destructive" className="py-2 sm:py-3">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <AlertDescription className="text-xs sm:text-sm leading-snug">
                Sistem ini hanya bisa diakses menggunakan Exam Browser. Silakan download aplikasi Exam Browser dari Play Store.
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 md:p-4">
              <h3 className="font-semibold text-blue-900 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
                <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                Cara Download Exam Browser:
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-blue-900 leading-relaxed">
                <li>Klik tombol <strong>"Download"</strong> di bawah</li>
                <li>Install aplikasi dari Play Store</li>
                <li>Buka aplikasi <strong>Exam Browser</strong></li>
                <li>Login dengan nomor ujian Anda</li>
                <li>Akses sistem melalui aplikasi</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-xs sm:text-sm h-10 sm:h-11"
                onClick={() => window.open('https://play.google.com/store/apps/details?id=id.sch.manbulungan.exampatra', '_blank')}
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                Download Exam Browser
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                className="w-full text-xs sm:text-sm h-9 sm:h-10"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Riwayat Ujian</h1>
        <p className="text-xs md:text-sm text-gray-600 mt-1">Lihat hasil dan performa ujian Anda</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Card className="rounded-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600">Total Ujian</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUjian}</p>
                <p className="text-xs text-gray-600">Ujian selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600">Rata-Rata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.rataRata || '-'}%</p>
                <p className="text-xs text-gray-600">Skor rata-rata</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600">Nilai Tertinggi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.tertinggi || '-'}%</p>
                <p className="text-xs text-gray-600">Best score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600">Nilai Terendah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.terendah || '-'}%</p>
                <p className="text-xs text-gray-600">Lowest score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Riwayat Table */}
      <Card className="rounded-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Daftar Riwayat Ujian</CardTitle>
          <CardDescription className="text-xs md:text-sm">Detail hasil ujian yang sudah Anda kerjakan</CardDescription>
        </CardHeader>
        <CardContent>
          {riwayatList.length === 0 ? (
            <div className="text-center py-8 md:py-12 text-gray-500">
              <BookOpen className="h-12 md:h-16 w-12 md:w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-base md:text-lg font-medium">Belum ada riwayat ujian</p>
              <p className="text-xs md:text-sm mt-1">Riwayat ujian yang sudah dikerjakan akan muncul di sini</p>
            </div>
          ) : (
            <>
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {currentData.map((riwayat) => {
                const badge = getGradeBadge(riwayat.persentase)
                
                return (
                  <Card key={riwayat.id} className="rounded-sm shadow-sm border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm line-clamp-2">{riwayat.namaUjian}</p>
                          <p className="text-xs text-gray-600 mt-1">{riwayat.bankSoal}</p>
                        </div>
                        {riwayat.tampilkanNilai ? (
                          <Badge className={`${badge.color} shrink-0 text-xs`}>
                            {badge.label}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            Disembunyikan
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-600 mb-1">Tanggal</p>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="font-medium">{format(new Date(riwayat.tanggalUjian), 'dd MMM yyyy', { locale: localeId })}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Waktu</p>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="font-medium">{riwayat.waktuPengerjaan} menit</span>
                          </div>
                        </div>
                      </div>
                      
                      {riwayat.tampilkanNilai ? (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600">Nilai</p>
                              <p className="text-lg font-bold">{riwayat.nilaiDiperoleh}/{riwayat.nilaiMaksimal}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">Persentase</p>
                              <p className={`text-2xl font-bold ${getGradeColor(riwayat.persentase)}`}>
                                {riwayat.persentase}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600">Nilai tidak ditampilkan oleh pengawas</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {/* Desktop View - Table */}
            <div className="hidden md:block">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Ujian</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-center">Waktu Pengerjaan</TableHead>
                  <TableHead className="text-center">Nilai</TableHead>
                  <TableHead className="text-center">Persentase</TableHead>
                  <TableHead className="text-center">Predikat</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((riwayat) => {
                  const badge = getGradeBadge(riwayat.persentase)
                  
                  return (
                    <TableRow key={riwayat.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{riwayat.namaUjian}</p>
                          <p className="text-sm text-gray-600">{riwayat.bankSoal}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {format(new Date(riwayat.tanggalUjian), 'dd MMM yyyy', { locale: localeId })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {riwayat.waktuPengerjaan} menit
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {riwayat.tampilkanNilai ? (
                          <>{riwayat.nilaiDiperoleh} / {riwayat.nilaiMaksimal}</>
                        ) : (
                          <span className="text-gray-400 text-sm">Tidak ditampilkan</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {riwayat.tampilkanNilai ? (
                          <span className={`text-lg font-bold ${getGradeColor(riwayat.persentase)}`}>
                            {riwayat.persentase}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {riwayat.tampilkanNilai ? (
                          <Badge className={badge.color}>
                            {badge.label}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Disembunyikan
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" disabled>
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>

            {/* Pagination */}
            {riwayatList.length > itemsPerPage && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, riwayatList.length)} dari {riwayatList.length} data
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={
                          currentPage === page
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        }
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
