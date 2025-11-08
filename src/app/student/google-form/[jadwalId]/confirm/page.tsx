'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertTriangle, Home } from 'lucide-react'

export default function ConfirmSubmissionPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const jadwalId = params.jadwalId as string
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token tidak ditemukan')
      return
    }

    confirmSubmission()
  }, [token])

  const confirmSubmission = async () => {
    try {
      setStatus('loading')
      const response = await fetch(
        `/api/jadwal-ujian/google-form/confirm?token=${token}`
      )

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setMessage(data.message || 'Ujian berhasil dicatat!')
        setAlreadySubmitted(data.alreadySubmitted || false)
      } else {
        setStatus('error')
        setMessage(
          data.error || 'Gagal mencatat ujian. Silakan coba lagi.'
        )
      }
    } catch (error) {
      console.error('Error confirming submission:', error)
      setStatus('error')
      setMessage('Terjadi kesalahan saat mencatat ujian')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <CheckCircle className="w-5 h-5" />
            {alreadySubmitted ? 'Ujian Sudah Tercatat' : 'Ujian Berhasil Dicatat'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {message}
            </AlertDescription>
          </Alert>

          {alreadySubmitted && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Ujian ini sudah pernah dicatat sebelumnya
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-slate-100 p-4 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Informasi Ujian
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>✓ Form Google berhasil disubmit</li>
              <li>✓ Data ujian telah direkam di sistem</li>
              <li>✓ Anda dapat melihat hasil di dashboard</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => {
                // Refresh halaman ujian untuk update status
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
