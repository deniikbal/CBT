'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, BookOpen, Trophy, User, CheckCircle2 } from 'lucide-react'
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Profile Card Skeleton */}
          <Card className="lg:col-span-1 p-4 rounded-sm">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </Card>

          {/* Stats Cards Skeleton */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <Card key={i} className="p-4 rounded-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-12 mt-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Ujian Cards Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 rounded-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Selamat datang, {peserta?.name}!</p>
        </div>
      </div>

      {/* Profile and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-1 p-4 rounded-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-sm bg-blue-100">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Profil Saya</h3>
              <div className="mt-2 space-y-1 text-sm">
                <div>
                  <p className="text-gray-600">Nama</p>
                  <p className="font-medium">{peserta?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Nomor Ujian</p>
                  <p className="font-medium">{peserta?.noUjian}</p>
                </div>
                {peserta?.kelas && (
                  <div>
                    <p className="text-gray-600">Kelas</p>
                    <p className="font-medium">{peserta.kelas.name}</p>
                  </div>
                )}
                {peserta?.jurusan && (
                  <div>
                    <p className="text-gray-600">Jurusan</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        {peserta.jurusan.kodeJurusan}
                      </Badge>
                      <span className="text-sm">{peserta.jurusan.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <Card className="p-4 rounded-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-sm bg-blue-100">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Ujian Tersedia</p>
                <p className="text-xl font-bold">{jadwalList.filter(j => !j.sudahDikerjakan).length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-sm bg-green-100">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Ujian Selesai</p>
                <p className="text-xl font-bold">{jadwalList.filter(j => j.sudahDikerjakan).length}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Ujian Tersedia */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Ujian Tersedia</h2>
        
        {jadwalList.filter(j => !j.sudahDikerjakan).length === 0 ? (
          <Card className="p-8 text-center border-2 border-dashed border-gray-200 rounded-sm">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada ujian tersedia</h3>
            <p className="text-gray-600">Ujian akan muncul di sini saat sudah dijadwalkan</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jadwalList.filter(j => !j.sudahDikerjakan).map((jadwal) => {
              const isActive = isUjianActive(jadwal.tanggalUjian, jadwal.jamMulai, jadwal.durasi)
              
              return (
                <Card key={jadwal.id} className={`p-4 rounded-sm ${isActive ? 'border-2 border-green-500' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-sm ${isActive ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <BookOpen className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{jadwal.namaUjian}</h3>
                      <p className="text-xs text-gray-500 truncate">{jadwal.bankSoal?.kodeBankSoal || 'Bank Soal'}</p>
                      
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(jadwal.tanggalUjian), 'dd MMM yyyy', { locale: localeId })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{jadwal.jamMulai}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{jadwal.durasi}m</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        {isActive ? (
                          <Button 
                            className="w-full h-9 text-sm"
                            onClick={() => handleMulaiUjian(jadwal.id)}
                          >
                            Mulai Ujian
                          </Button>
                        ) : (
                          <Button className="w-full h-9 text-sm" variant="outline" disabled>
                            Belum Waktunya
                          </Button>
                        )}
                      </div>
                      
                      {isActive && (
                        <div className="mt-2">
                          <Badge className="text-xs bg-green-100 text-green-800 border border-green-200">
                            Sedang Berlangsung
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Ujian Sudah Selesai */}
      {jadwalList.filter(j => j.sudahDikerjakan).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Ujian Sudah Selesai</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jadwalList.filter(j => j.sudahDikerjakan).map((jadwal) => (
              <Card key={jadwal.id} className="p-4 rounded-sm bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-sm bg-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{jadwal.namaUjian}</h3>
                    <p className="text-xs text-gray-500 truncate">{jadwal.bankSoal?.kodeBankSoal || 'Bank Soal'}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(jadwal.tanggalUjian), 'dd MMM yyyy', { locale: localeId })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{jadwal.jamMulai}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{jadwal.durasi}m</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Button 
                        className="w-full h-9 text-sm" 
                        variant="outline"
                        onClick={() => router.push('/student/riwayat')}
                      >
                        Lihat Hasil
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
