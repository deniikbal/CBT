'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, BookOpen, Award, User, GraduationCap, CheckCircle, AlertCircle, Monitor, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface Peserta {
  id: string
  name: string
  noUjian: string
  kelas: {
    name: string
  } | null
  jurusan: {
    name: string
    kodeJurusan: string
  } | null
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
  sourceType?: string
  sudahDikerjakan?: boolean
  hasilUjian?: {
    id: string
    status: string
    skor: number | null
    skorMaksimal: number | null
    waktuSelesai: string | null
    waktuMulai: string | null
  } | null
}

export default function StudentDashboard() {
  const router = useRouter()
  const [peserta, setPeserta] = useState<Peserta | null>(null)
  const [jadwalList, setJadwalList] = useState<JadwalUjian[]>([])
  const [loading, setLoading] = useState(true)
  const [browserCheckFailed, setBrowserCheckFailed] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmModalData, setConfirmModalData] = useState<{ jadwalId: string; namaUjian: string } | null>(null)
  const [confirmCheckbox, setConfirmCheckbox] = useState(false)
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false)

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

  const isUjianActive = (tanggal: string, jamMulai: string, durasi: number) => {
    const now = new Date()
    const ujianDate = new Date(tanggal)
    const [hours, minutes] = jamMulai.split(':').map(Number)
    ujianDate.setHours(hours, minutes, 0)
    
    const ujianEnd = new Date(ujianDate)
    ujianEnd.setMinutes(ujianEnd.getMinutes() + durasi)
    
    return now >= ujianDate && now <= ujianEnd
  }

  const isFormStarted = (jadwal: JadwalUjian): boolean => {
    // Check if user has opened the form (status should be 'mulai' or 'in_progress')
    return jadwal.hasilUjian?.status === 'mulai' || jadwal.hasilUjian?.status === 'in_progress'
  }

  const getMinimumTimeReached = (jadwal: JadwalUjian): boolean => {
    if (!jadwal.minimumPengerjaan || !jadwal.hasilUjian?.waktuMulai) {
      return true
    }

    const waktuMulai = new Date(jadwal.hasilUjian.waktuMulai)
    const minimumMs = jadwal.minimumPengerjaan * 60 * 1000
    const waktuMinimumTercapai = new Date(waktuMulai.getTime() + minimumMs)

    return currentTime >= waktuMinimumTercapai
  }

  const getRemainingMinimumTime = (jadwal: JadwalUjian): number => {
    if (!jadwal.minimumPengerjaan || !jadwal.hasilUjian?.waktuMulai) {
      return 0
    }

    const waktuMulai = new Date(jadwal.hasilUjian.waktuMulai)
    const minimumMs = jadwal.minimumPengerjaan * 60 * 1000
    const waktuMinimumTercapai = new Date(waktuMulai.getTime() + minimumMs)

    const remaining = waktuMinimumTercapai.getTime() - currentTime.getTime()
    return Math.max(0, Math.ceil(remaining / 1000 / 60))
  }

  const handleBukaKonfirmasiModal = (jadwalId: string, namaUjian: string) => {
    setConfirmModalData({ jadwalId, namaUjian })
    setConfirmCheckbox(false)
    setConfirmModalOpen(true)
  }

  const handleConfirmSubmit = async () => {
    if (!confirmCheckbox || !confirmModalData) return

    try {
      setIsSubmittingConfirm(true)
      const pesertaId = peserta?.id
      if (!pesertaId) return

      const response = await fetch(
        '/api/jadwal-ujian/google-form/mark-submitted',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jadwalId: confirmModalData.jadwalId, pesertaId }),
        }
      )

      const data = await response.json()
      if (response.ok && data.success) {
        setConfirmModalOpen(false)
        setConfirmModalData(null)
        setConfirmCheckbox(false)
        fetchJadwal(pesertaId)
      } else {
        alert('Gagal mencatat ujian: ' + (data.error || 'Kesalahan server'))
      }
    } catch (error) {
      console.error('Error marking exam as submitted:', error)
      alert('Terjadi kesalahan saat mencatat ujian')
    } finally {
      setIsSubmittingConfirm(false)
    }
  }

  const handleMulaiUjian = (jadwalId: string) => {
    router.push(`/student/ujian/${jadwalId}/mulai`)
  }

  const handleBukaGoogleForm = (jadwalId: string) => {
    router.push(`/student/google-form/${jadwalId}`)
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
              Sistem CBT - Computer Based Test
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
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card Skeleton */}
          <Card className="md:col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards Skeleton */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ujian Cards Skeleton */}
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-32 mt-2" />
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-xs md:text-sm text-gray-600 mt-1">Selamat datang, {peserta?.name}!</p>
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="lg:col-span-1 rounded-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Profil Saya
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Nama</p>
              <p className="font-medium">{peserta?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nomor Ujian</p>
              <p className="font-medium">{peserta?.noUjian}</p>
            </div>
            {peserta?.kelas && (
              <div>
                <p className="text-sm text-gray-600">Kelas</p>
                <p className="font-medium">{peserta.kelas.name}</p>
              </div>
            )}
            {peserta?.jurusan && (
              <div>
                <p className="text-sm text-gray-600">Jurusan</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{peserta.jurusan.kodeJurusan}</Badge>
                  <span className="text-sm">{peserta.jurusan.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <Card className="rounded-sm shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">Total Ujian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 md:h-8 w-6 md:w-8 text-blue-600" />
                <div>
                  <p className="text-2xl md:text-3xl font-bold">{jadwalList.filter(j => !j.sudahDikerjakan).length}</p>
                  <p className="text-xs text-gray-600">Tersedia</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">Ujian Selesai</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="h-6 md:h-8 w-6 md:w-8 text-green-600" />
                <div>
                  <p className="text-2xl md:text-3xl font-bold">{jadwalList.filter(j => j.sudahDikerjakan).length}</p>
                  <p className="text-xs text-gray-600">Selesai</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ujian Tersedia */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">Ujian Tersedia</h2>
        
        {jadwalList.filter(j => !j.sudahDikerjakan).length === 0 ? (
          <Card className="rounded-sm shadow-sm">
            <CardContent className="py-8 md:py-12 text-center text-gray-500">
              <BookOpen className="h-12 md:h-16 w-12 md:w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-base md:text-lg font-medium">Tidak ada ujian tersedia</p>
              <p className="text-xs md:text-sm mt-1">Ujian akan muncul di sini saat sudah dijadwalkan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jadwalList.filter(j => !j.sudahDikerjakan).map((jadwal) => {
              const isActive = isUjianActive(jadwal.tanggalUjian, jadwal.jamMulai, jadwal.durasi)
              
              return (
                <Card key={jadwal.id} className={isActive ? 'border-green-500 border-2 rounded-sm shadow-sm' : 'rounded-sm shadow-sm'}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-sm md:text-base">{jadwal.namaUjian}</CardTitle>
                      {isActive && (
                        <Badge className="bg-green-600 text-xs shrink-0">Berlangsung</Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs md:text-sm">
                      {jadwal.bankSoal?.kodeBankSoal || 'Bank Soal'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                      <Calendar className="h-3 md:h-4 w-3 md:w-4 shrink-0" />
                      <span className="line-clamp-1">{format(new Date(jadwal.tanggalUjian), 'dd MMMM yyyy', { locale: localeId })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                      <Clock className="h-3 md:h-4 w-3 md:w-4 shrink-0" />
                      {jadwal.jamMulai} ({jadwal.durasi} menit)
                    </div>
                    
                    <div className="pt-2 space-y-2">
                      {isActive ? (
                        jadwal.sourceType === 'GOOGLE_FORM' ? (
                          <>
                            {isFormStarted(jadwal) ? (
                              <>
                                {getMinimumTimeReached(jadwal) ? (
                                  <>
                                    <Button 
                                      className="w-full bg-green-600 hover:bg-green-700 text-sm md:text-base h-10 md:h-11"
                                      onClick={() => handleBukaGoogleForm(jadwal.id)}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Buka Google Form
                                    </Button>
                                    <Button 
                                      className="w-full bg-blue-600 hover:bg-blue-700 text-sm md:text-base h-10 md:h-11"
                                      onClick={() => handleBukaKonfirmasiModal(jadwal.id, jadwal.namaUjian)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Konfirmasi Sudah Ujian
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button 
                                      className="w-full bg-green-600 hover:bg-green-700 text-sm md:text-base h-10 md:h-11"
                                      onClick={() => handleBukaGoogleForm(jadwal.id)}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Buka Google Form
                                    </Button>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
                                      <p className="text-xs text-yellow-800">
                                        Tunggu {getRemainingMinimumTime(jadwal)} menit lagi
                                      </p>
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              <Button 
                                className="w-full bg-green-600 hover:bg-green-700 text-sm md:text-base h-10 md:h-11"
                                onClick={() => handleBukaGoogleForm(jadwal.id)}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Buka Google Form
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-sm md:text-base h-10 md:h-11"
                            onClick={() => handleMulaiUjian(jadwal.id)}
                          >
                            Mulai Ujian
                          </Button>
                        )
                      ) : (
                        <Button className="w-full text-sm md:text-base h-10 md:h-11" variant="outline" disabled>
                          Belum Waktunya
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Ujian Sudah Selesai */}
      {jadwalList.filter(j => j.sudahDikerjakan).length > 0 && (
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">Ujian Sudah Selesai</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jadwalList.filter(j => j.sudahDikerjakan).map((jadwal) => (
              <Card key={jadwal.id} className="rounded-sm shadow-sm border-green-200 bg-green-50/30 opacity-75">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-gray-700">{jadwal.namaUjian}</CardTitle>
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Selesai
                    </Badge>
                  </div>
                  <CardDescription>
                    {jadwal.bankSoal?.kodeBankSoal || 'Bank Soal'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(jadwal.tanggalUjian), 'dd MMMM yyyy', { locale: localeId })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {jadwal.jamMulai} ({jadwal.durasi} menit)
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => router.push('/student/riwayat')}
                    >
                      Lihat Hasil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Ujian */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Konfirmasi Ujian
            </DialogTitle>
            <DialogDescription>
              Pastikan Anda sudah menyelesaikan ujian Google Form sebelum mengkonfirmasi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Ujian yang akan dikonfirmasi:</p>
              <p className="text-lg font-bold text-blue-600">{confirmModalData?.namaUjian}</p>
            </div>

            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-800">
                Setelah konfirmasi, ujian ini akan dicatat sebagai selesai dan tidak dapat diubah.
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
              <Checkbox 
                id="confirm-checkbox"
                checked={confirmCheckbox}
                onCheckedChange={(checked) => setConfirmCheckbox(checked as boolean)}
                className="mt-1"
              />
              <label 
                htmlFor="confirm-checkbox"
                className="text-sm text-gray-700 cursor-pointer flex-1"
              >
                Saya sudah menyelesaikan ujian Google Form dan siap mengkonfirmasi
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleConfirmSubmit}
              disabled={!confirmCheckbox || isSubmittingConfirm}
            >
              {isSubmittingConfirm ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
