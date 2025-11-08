'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, Clock, CheckCircle, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { getCurrentWIBTime } from '@/lib/timezone'

interface GoogleFormAccess {
  success: boolean
  url?: string
  namaUjian?: string
  tanggalUjian?: string
  jamMulai?: string
  durasi?: number
  remainingTime?: number
  error?: string
  minutesUntilStart?: number
  startTime?: string
  endTime?: string
}

export default function GoogleFormPage() {
  const params = useParams()
  const router = useRouter()
  const jadwalId = params.jadwalId as string

  const [formAccess, setFormAccess] = useState<GoogleFormAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [pesertaId, setPesertaId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<{
    minutes: number
    seconds: number
  } | null>(null)

  // Timer untuk update waktu setiap detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Get peserta ID dan validasi akses
  useEffect(() => {
    const storedPeserta = localStorage.getItem('peserta')
    if (!storedPeserta) {
      router.push('/login')
      return
    }

    const pesertaData = JSON.parse(storedPeserta)
    setPesertaId(pesertaData.id)
    fetchFormAccess(pesertaData.id)
  }, [])

  // Update countdown
  useEffect(() => {
    if (formAccess?.error === 'Ujian belum dimulai' && formAccess.startTime) {
      const startTime = new Date(formAccess.startTime)
      // Allow 5 minutes before
      const allowedStartTime = new Date(startTime.getTime() - 5 * 60 * 1000)
      const now = getCurrentWIBTime()
      
      const diff = allowedStartTime.getTime() - now.getTime()
      if (diff > 0) {
        const minutes = Math.floor(diff / (60 * 1000))
        const seconds = Math.floor((diff % (60 * 1000)) / 1000)
        setCountdown({ minutes, seconds })
      } else {
        setCountdown(null)
      }
    } else {
      setCountdown(null)
    }
  }, [currentTime, formAccess])

  const fetchFormAccess = async (pId: string) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/jadwal-ujian/google-form/${jadwalId}?pesertaId=${pId}`
      )

      const data: GoogleFormAccess = await response.json()

      if (response.ok && data.success) {
        setFormAccess(data)
        setError(null)
      } else {
        setFormAccess(data)
        setError(data.error || 'Gagal mengakses ujian')
      }
    } catch (err) {
      console.error('Error fetching form access:', err)
      setError('Terjadi kesalahan saat mengakses ujian')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = () => {
    if (formAccess?.url) {
      window.open(formAccess.url, '_blank')
    }
  }

  const handleRefresh = () => {
    if (pesertaId) {
      fetchFormAccess(pesertaId)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Memproses...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sedang memeriksa akses ujian Anda...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Ujian belum dimulai
  if (formAccess?.error === 'Ujian belum dimulai') {
    const startTime = formAccess.startTime
      ? new Date(formAccess.startTime)
      : null

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <Clock className="w-5 h-5" />
              Ujian Belum Dimulai
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Ujian akan dimulai pada waktu yang telah ditentukan
              </AlertDescription>
            </Alert>

            {startTime && (
              <div className="space-y-3 bg-slate-100 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Jam Mulai
                  </p>
                  <p className="font-semibold">
                    {format(startTime, 'EEEE, dd MMMM yyyy HH:mm', {
                      locale: localeId,
                    })}
                  </p>
                </div>

                {countdown && countdown.minutes >= 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Waktu Tersisa
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {countdown.minutes}:{String(countdown.seconds).padStart(2, '0')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {formAccess.namaUjian && (
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Nama Ujian
                </p>
                <p className="font-semibold">{formAccess.namaUjian}</p>
              </div>
            )}

            <Button onClick={handleRefresh} className="w-full" variant="outline">
              Cek Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Waktu ujian telah berakhir
  if (formAccess?.error === 'Waktu ujian telah berakhir') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Ujian Telah Berakhir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Waktu ujian telah melampaui batas yang ditentukan
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => router.push('/student/ujian')}
              className="w-full"
            >
              Kembali ke Ujian Saya
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error lainnya
  if (error || formAccess?.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Tidak Dapat Mengakses Ujian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error || formAccess?.error}
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => router.push('/student/ujian')}
              className="w-full"
            >
              Kembali ke Ujian Saya
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sukses - menampilkan form dan countdown
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <CheckCircle className="w-5 h-5" />
            Akses Tersedia
          </CardTitle>
          <CardDescription>Ujian Anda siap dimulai</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formAccess?.namaUjian && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Nama Ujian</p>
              <p className="text-base font-semibold text-slate-700">
                {formAccess.namaUjian}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {formAccess?.jamMulai && (
              <div className="bg-slate-100 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Jam Mulai</p>
                <p className="font-semibold text-sm">
                  {formAccess.jamMulai}
                </p>
              </div>
            )}

            {formAccess?.durasi && (
              <div className="bg-slate-100 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Durasi</p>
                <p className="font-semibold text-sm">
                  {formAccess.durasi} menit
                </p>
              </div>
            )}
          </div>

          {formAccess?.remainingTime !== undefined && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Waktu Tersisa</p>
              <p className="text-lg font-bold text-blue-700">
                {formAccess.remainingTime} menit
              </p>
            </div>
          )}

          <Alert className="border-blue-200 bg-blue-50">
            <ExternalLink className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              Klik tombol di bawah untuk membuka Google Form dalam tab baru
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleOpenForm}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Buka Google Form
          </Button>

          <Button
            onClick={() => router.push('/student/ujian')}
            variant="outline"
            className="w-full"
          >
            Kembali
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
