'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertTriangle, Home } from 'lucide-react'
import { toast } from 'sonner'

export default function ConfirmSubmissionPage() {
  const params = useParams()
  const router = useRouter()
  const jadwalId = params.jadwalId as string

  const [status, setStatus] = useState<'ready' | 'loading' | 'success' | 'error'>('ready')
  const [message, setMessage] = useState('')
  const [pesertaName, setPesertaName] = useState('')

  useEffect(() => {
    // Get peserta dari localStorage
    const storedPeserta = localStorage.getItem('peserta')
    if (!storedPeserta) {
      setStatus('error')
      setMessage('Anda harus login terlebih dahulu')
      return
    }

    const pesertaData = JSON.parse(storedPeserta)
    setPesertaName(pesertaData.name)
  }, [])

  const handleConfirmSubmission = async () => {
    try {
      setStatus('loading')

      const storedPeserta = localStorage.getItem('peserta')
      if (!storedPeserta) {
        setStatus('error')
        setMessage('Data peserta tidak ditemukan')
        return
      }

      const pesertaData = JSON.parse(storedPeserta)

      const response = await fetch(
        `/api/jadwal-ujian/google-form/confirm-simple/${jadwalId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pesertaId: pesertaData.id }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setMessage(data.message || 'Ujian berhasil dicatat!')
        toast.success('Ujian berhasil dikonfirmasi!')
      } else {
        setStatus('error')
        setMessage(data.error || 'Gagal mencatat ujian')
        toast.error(data.error || 'Gagal mencatat ujian')
      }
    } catch (error) {
      console.error('Error confirming submission:', error)
      setStatus('error')
      setMessage('Terjadi kesalahan saat mencatat ujian')
      toast.error('Terjadi kesalahan')
    }
  }

  if (status === 'loading') {
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
              Sedang mencatat submission Anda...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Gagal Mencatat Ujian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {message}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={() => router.push('/student/ujian')}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Ujian Saya
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              Ujian Berhasil Dicatat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>

            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Peserta:
              </p>
              <p className="text-base font-semibold text-slate-900">
                {pesertaName}
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => {
                  window.location.href = '/student/ujian'
                }}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Ujian Saya
              </Button>

              <Button
                onClick={() => router.push('/student/riwayat')}
                variant="outline"
                className="w-full"
              >
                Lihat Hasil Ujian
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Ready state - show confirm button
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <CheckCircle className="w-5 h-5" />
            Konfirmasi Ujian Selesai
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800 text-sm">
              Apakah Anda sudah submit Google Form? Klik tombol di bawah untuk mengkonfirmasi bahwa ujian telah selesai.
            </AlertDescription>
          </Alert>

          {pesertaName && (
            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Login sebagai:</p>
              <p className="font-semibold text-slate-900">{pesertaName}</p>
            </div>
          )}

          <Button
            onClick={handleConfirmSubmission}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            ✓ Konfirmasi Ujian Selesai
          </Button>

          <Button
            onClick={() => router.push('/student/ujian')}
            variant="outline"
            className="w-full"
          >
            Batal
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
