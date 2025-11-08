'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, BookOpen, AlertCircle, CheckCircle, Monitor } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Peserta {
  id: string
  name: string
}

interface JadwalUjian {
  id: string
  namaUjian: string
  tanggalUjian: string
  jamMulai: string
  durasi: number
  minimumPengerjaan: number | null
  bankSoal: {
    kodeBankSoal: string
  } | null
  acakSoal: boolean
  acakOpsi: boolean
  tampilkanNilai: boolean
  requireExamBrowser: boolean
  sudahDikerjakan?: boolean
  hasilUjian?: {
    id: string
    status: string
    skor: number | null
    skorMaksimal: number | null
    waktuSelesai: string | null
  } | null
}

export default function UjianSayaPage() {
  const router = useRouter()
  const [peserta, setPeserta] = useState<Peserta | null>(null)
  const [jadwalList, setJadwalList] = useState<JadwalUjian[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [browserCheckFailed, setBrowserCheckFailed] = useState(false)

  useEffect(() => {
    const storedPeserta = localStorage.getItem('peserta')
    if (storedPeserta) {
      const pesertaData = JSON.parse(storedPeserta)
      setPeserta(pesertaData)
      fetchJadwal(pesertaData.id)
    }
  }, [])

  // Update timer setiap detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchJadwal = async (pesertaId: string) => {
    try {
      const response = await fetch(`/api/peserta/${pesertaId}/jadwal`)
      if (response.ok) {
        const data = await response.json()
        setJadwalList(data)
        
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
      console.error('Error fetching jadwal:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUjianStatus = (tanggal: string, jamMulai: string) => {
    const now = new Date()
    const ujianDate = new Date(tanggal)
    const [hours, minutes] = jamMulai.split(':').map(Number)
    ujianDate.setHours(hours, minutes, 0)
    
    // Hanya check apakah sudah melewati waktu mulai atau belum
    // Tidak ada status expired berdasarkan waktu selesai
    if (now < ujianDate) {
      return {
        status: 'upcoming',
        label: 'Akan Datang',
        color: 'bg-blue-500',
        icon: Clock
      }
    } else {
      // Sudah melewati waktu mulai = active (selama status isActive dari admin)
      return {
        status: 'active',
        label: 'Sedang Berlangsung',
        color: 'bg-green-500',
        icon: CheckCircle
      }
    }
  }

  const getCountdown = (tanggal: string, jamMulai: string) => {
    const ujianDate = new Date(tanggal)
    const [hours, minutes] = jamMulai.split(':').map(Number)
    ujianDate.setHours(hours, minutes, 0)
    
    const diff = ujianDate.getTime() - currentTime.getTime()
    
    if (diff <= 0) {
      return null
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours_remaining = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes_remaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return {
      days,
      hours: hours_remaining,
      minutes: minutes_remaining,
      seconds
    }
  }

  const handleMulaiUjian = (jadwalId: string) => {
    router.push(`/student/ujian/${jadwalId}/mulai`)
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
              Daftar Ujian - CBT System
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

  // Sudah selesai (submitted)
  const selesaiUjian = jadwalList.filter(j => 
    j.sudahDikerjakan === true || j.hasilUjian?.status === 'submitted'
  )
  
  // Sedang dikerjakan (in_progress) - masih bisa dilanjutkan meski waktu expired
  const sedangDikerjakan = jadwalList.filter(j => 
    (j.hasilUjian?.status === 'in_progress' || j.hasilUjian?.status === 'mulai') && 
    j.hasilUjian?.status !== 'submitted' &&
    !j.sudahDikerjakan
  )
  
  // Belum dimulai - waktu akan datang
  const upcomingUjian = jadwalList.filter(j => 
    !j.sudahDikerjakan && 
    !j.hasilUjian && 
    getUjianStatus(j.tanggalUjian, j.jamMulai).status === 'upcoming'
  )
  
  // Belum dimulai - waktu sedang berlangsung
  const activeUjian = jadwalList.filter(j => 
    !j.sudahDikerjakan && 
    !j.hasilUjian && 
    getUjianStatus(j.tanggalUjian, j.jamMulai).status === 'active'
  )
  

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-80 mt-2" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Ujian Saya</h1>
        <p className="text-xs md:text-sm text-gray-600 mt-1">Daftar ujian yang tersedia untuk Anda</p>
      </div>

      {/* Sedang Dikerjakan Alert */}
      {sedangDikerjakan.length > 0 && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600 shrink-0" />
          <AlertDescription className="text-xs md:text-sm text-orange-800">
            Ada {sedangDikerjakan.length} ujian yang belum diselesaikan! Segera lanjutkan sebelum waktu habis.
          </AlertDescription>
        </Alert>
      )}

      {/* Active Ujian Alert */}
      {activeUjian.length > 0 && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          <AlertDescription className="text-xs md:text-sm text-green-800">
            Ada {activeUjian.length} ujian yang sedang berlangsung! Segera kerjakan sebelum waktu habis.
          </AlertDescription>
        </Alert>
      )}

      {/* Sedang Dikerjakan (Belum Selesai) */}
      {sedangDikerjakan.length > 0 && (
        <div className="space-y-2 md:space-y-3">
          <h2 className="text-base md:text-lg font-semibold text-orange-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Sedang Dikerjakan ({sedangDikerjakan.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sedangDikerjakan.map((jadwal) => {
              return (
                <Card key={jadwal.id} className="rounded-sm border-orange-500 border-2 shadow-md bg-orange-50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <CardTitle className="text-sm md:text-base line-clamp-2">{jadwal.namaUjian}</CardTitle>
                      <Badge className="bg-orange-500 text-xs shrink-0">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Belum Selesai</span>
                        <span className="sm:hidden">...</span>
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs md:text-sm">
                      <BookOpen className="h-3 md:h-4 w-3 md:w-4 shrink-0" />
                      {jadwal.bankSoal?.kodeBankSoal || 'Bank Soal'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2 text-xs md:text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-3 md:h-4 w-3 md:w-4 shrink-0" />
                        <span className="line-clamp-1">{format(new Date(jadwal.tanggalUjian), 'EEEE, dd MMMM yyyy', { locale: localeId })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-3 md:h-4 w-3 md:w-4 shrink-0" />
                        {jadwal.jamMulai} WIB · Durasi {jadwal.durasi} menit
                      </div>
                      {jadwal.minimumPengerjaan && (
                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          Minimum: {jadwal.minimumPengerjaan} menit
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-sm md:text-base h-10 md:h-11"
                        onClick={() => handleMulaiUjian(jadwal.id)}
                      >
                        Lanjutkan Ujian
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Sedang Berlangsung (Belum Dimulai) */}
      {activeUjian.length > 0 && (
        <div className="space-y-2 md:space-y-3">
          <h2 className="text-base md:text-lg font-semibold text-green-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Sedang Berlangsung ({activeUjian.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeUjian.map((jadwal) => {
              const status = getUjianStatus(jadwal.tanggalUjian, jadwal.jamMulai)
              const StatusIcon = status.icon
              
              return (
                <Card key={jadwal.id} className="rounded-sm border-green-500 border-2 shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <CardTitle className="text-sm md:text-base line-clamp-2">{jadwal.namaUjian}</CardTitle>
                      <Badge className={`${status.color} text-xs shrink-0`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">{status.label}</span>
                        <span className="sm:hidden">Aktif</span>
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs md:text-sm">
                      <BookOpen className="h-3 md:h-4 w-3 md:w-4 shrink-0" />
                      {jadwal.bankSoal?.kodeBankSoal || 'Bank Soal'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2 text-xs md:text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-3 md:h-4 w-3 md:w-4 shrink-0" />
                        <span className="line-clamp-1">{format(new Date(jadwal.tanggalUjian), 'EEEE, dd MMMM yyyy', { locale: localeId })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-3 md:h-4 w-3 md:w-4 shrink-0" />
                        {jadwal.jamMulai} WIB · Durasi {jadwal.durasi} menit
                      </div>
                      {jadwal.minimumPengerjaan && (
                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          Minimum: {jadwal.minimumPengerjaan} menit
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-sm md:text-base h-10 md:h-11"
                        onClick={() => handleMulaiUjian(jadwal.id)}
                      >
                        Mulai Ujian Sekarang
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Akan Datang */}
      {upcomingUjian.length > 0 && (
        <div className="space-y-2 md:space-y-3">
          <h2 className="text-base md:text-lg font-semibold text-blue-700 flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            Akan Datang ({upcomingUjian.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingUjian.map((jadwal) => {
              const status = getUjianStatus(jadwal.tanggalUjian, jadwal.jamMulai)
              const StatusIcon = status.icon
              const countdown = getCountdown(jadwal.tanggalUjian, jadwal.jamMulai)
              
              return (
                <Card key={jadwal.id} className="rounded-sm shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{jadwal.namaUjian}</CardTitle>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {jadwal.bankSoal?.kodeBankSoal || 'Bank Soal'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(jadwal.tanggalUjian), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        {jadwal.jamMulai} WIB · Durasi {jadwal.durasi} menit
                      </div>
                      {jadwal.minimumPengerjaan && (
                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          Minimum pengerjaan: {jadwal.minimumPengerjaan} menit
                        </div>
                      )}
                    </div>

                    {/* Countdown Timer */}
                    {countdown && (
                      <div className="bg-blue-50 border border-blue-300 rounded p-2">
                        <div className="flex items-center justify-center gap-1 text-blue-700">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs font-medium">Dimulai dalam:</span>
                          <span className="font-mono font-bold text-sm">
                            {countdown.days > 0 && `${countdown.days}h `}
                            {countdown.hours.toString().padStart(2, '0')}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button className="w-full" variant="outline" disabled>
                        Belum Waktunya
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Sudah Selesai */}
      {selesaiUjian.length > 0 && (
        <div className="space-y-2 md:space-y-3">
          <h2 className="text-base md:text-lg font-semibold text-green-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Sudah Selesai ({selesaiUjian.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selesaiUjian.map((jadwal) => {
              const persentase = jadwal.hasilUjian?.skor && jadwal.hasilUjian?.skorMaksimal
                ? Math.round((jadwal.hasilUjian.skor / jadwal.hasilUjian.skorMaksimal) * 100)
                : null

              return (
                <Card key={jadwal.id} className="rounded-sm shadow-sm border-green-200 bg-green-50/30">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{jadwal.namaUjian}</CardTitle>
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selesai
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {jadwal.bankSoal?.kodeBankSoal || 'Bank Soal'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(jadwal.tanggalUjian), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        {jadwal.jamMulai} WIB · Durasi {jadwal.durasi} menit
                      </div>
                      {jadwal.hasilUjian?.waktuSelesai && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Selesai: {format(new Date(jadwal.hasilUjian.waktuSelesai), 'dd MMM yyyy HH:mm', { locale: localeId })}
                        </div>
                      )}
                    </div>

                    {jadwal.tampilkanNilai && persentase !== null && (
                      <div className="bg-white border border-green-200 rounded-lg p-4 mt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600">Nilai Anda</p>
                            <p className="text-2xl font-bold text-green-600">
                              {jadwal.hasilUjian?.skor} / {jadwal.hasilUjian?.skorMaksimal}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Persentase</p>
                            <p className="text-3xl font-bold text-green-600">{persentase}%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!jadwal.tampilkanNilai && (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 mt-3">
                        <p className="text-sm text-center text-gray-600">
                          Nilai tidak ditampilkan oleh pengawas
                        </p>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => router.push('/student/riwayat')}
                      >
                        Lihat Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {jadwalList.length === 0 && (
        <Card className="rounded-sm shadow-sm">
          <CardContent className="py-12 text-center text-gray-500">
            <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium">Tidak ada ujian tersedia</p>
            <p className="text-sm mt-1">Ujian akan muncul di sini saat sudah dijadwalkan untuk Anda</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
