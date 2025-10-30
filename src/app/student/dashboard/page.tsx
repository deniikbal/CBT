'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, BookOpen, Award, User, GraduationCap, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

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
  bankSoal: {
    kodeBankSoal: string
  } | null
  acakSoal: boolean
  acakOpsi: boolean
  tampilkanNilai: boolean
  sudahDikerjakan?: boolean
}

export default function StudentDashboard() {
  const router = useRouter()
  const [peserta, setPeserta] = useState<Peserta | null>(null)
  const [jadwalList, setJadwalList] = useState<JadwalUjian[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedPeserta = localStorage.getItem('peserta')
    if (storedPeserta) {
      const pesertaData = JSON.parse(storedPeserta)
      setPeserta(pesertaData)
      fetchJadwal(pesertaData.id)
    }
  }, [])

  const fetchJadwal = async (pesertaId: string) => {
    try {
      const response = await fetch(`/api/peserta/${pesertaId}/jadwal`)
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

  const isUjianActive = (tanggal: string, jamMulai: string, durasi: number) => {
    const now = new Date()
    const ujianDate = new Date(tanggal)
    const [hours, minutes] = jamMulai.split(':').map(Number)
    ujianDate.setHours(hours, minutes, 0)
    
    const ujianEnd = new Date(ujianDate)
    ujianEnd.setMinutes(ujianEnd.getMinutes() + durasi)
    
    return now >= ujianDate && now <= ujianEnd
  }

  const handleMulaiUjian = (jadwalId: string) => {
    router.push(`/student/ujian/${jadwalId}/mulai`)
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
        <Card className="lg:col-span-1 rounded-md shadow-sm">
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
          <Card className="rounded-md shadow-sm">
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

          <Card className="rounded-md shadow-sm">
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
          <Card className="rounded-md shadow-sm">
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
                <Card key={jadwal.id} className={isActive ? 'border-green-500 border-2 rounded-md shadow-sm' : 'rounded-md shadow-sm'}>
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
                    
                    <div className="pt-2">
                      {isActive ? (
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 text-sm md:text-base h-10 md:h-11"
                          onClick={() => handleMulaiUjian(jadwal.id)}
                        >
                          Mulai Ujian
                        </Button>
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
              <Card key={jadwal.id} className="rounded-md shadow-sm border-green-200 bg-green-50/30 opacity-75">
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
    </div>
  )
}
