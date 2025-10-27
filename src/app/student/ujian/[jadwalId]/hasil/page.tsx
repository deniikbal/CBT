'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Trophy, Home, FileText, TrendingUp } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function HasilUjianPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const skor = parseInt(searchParams.get('skor') || '0')
  const maksimal = parseInt(searchParams.get('maksimal') || '0')
  const tampilkan = searchParams.get('tampilkan') === 'true'
  
  const persentase = maksimal > 0 ? Math.round((skor / maksimal) * 100) : 0

  useEffect(() => {
    // Celebration effect for good scores
    if (persentase >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }, [persentase])

  const getGrade = () => {
    if (persentase >= 90) return { label: 'Luar Biasa!', color: 'text-green-600', emoji: '🎉' }
    if (persentase >= 80) return { label: 'Sangat Baik!', color: 'text-blue-600', emoji: '⭐' }
    if (persentase >= 70) return { label: 'Baik', color: 'text-blue-500', emoji: '👍' }
    if (persentase >= 60) return { label: 'Cukup', color: 'text-yellow-600', emoji: '📝' }
    return { label: 'Perlu Peningkatan', color: 'text-red-600', emoji: '📚' }
  }

  const grade = getGrade()

  if (!tampilkan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 pt-20 lg:pt-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 md:p-4 rounded-full">
                <CheckCircle className="h-12 md:h-16 w-12 md:w-16 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl md:text-2xl">Ujian Berhasil Disubmit!</CardTitle>
            <CardDescription className="text-sm md:text-base mt-2">
              Terima kasih sudah mengerjakan ujian. Nilai Anda akan diumumkan kemudian oleh pengawas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-xs md:text-sm">
                Anda telah menyelesaikan ujian dengan baik. Hasil ujian akan tersedia di menu Riwayat Ujian setelah pengawas melakukan penilaian.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col md:flex-row gap-3">
              <Button 
                className="flex-1 text-sm md:text-base h-10 md:h-11" 
                onClick={() => router.push('/student/dashboard')}
              >
                <Home className="h-4 w-4 mr-2" />
                Kembali ke Dashboard
              </Button>
              <Button 
                className="flex-1 text-sm md:text-base h-10 md:h-11" 
                variant="outline"
                onClick={() => router.push('/student/riwayat')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Lihat Riwayat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 pt-20 lg:pt-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={cn(
              "p-4 md:p-6 rounded-full",
              persentase >= 80 ? "bg-green-100" : persentase >= 60 ? "bg-blue-100" : "bg-yellow-100"
            )}>
              <Trophy className={cn(
                "h-16 md:h-20 w-16 md:w-20",
                persentase >= 80 ? "text-green-600" : persentase >= 60 ? "text-blue-600" : "text-yellow-600"
              )} />
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            {grade.emoji} {grade.label}
          </CardTitle>
          <CardDescription className="text-sm md:text-base mt-2">
            Anda telah menyelesaikan ujian
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 md:p-6 text-center">
            <p className="text-xs md:text-sm text-gray-600 mb-2">Nilai Anda</p>
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <div>
                <p className={cn("text-4xl md:text-6xl font-bold", grade.color)}>{skor}</p>
                <p className="text-gray-600 text-xs md:text-sm mt-1">dari {maksimal}</p>
              </div>
              <div className="h-16 md:h-20 w-px bg-gray-300"></div>
              <div>
                <p className={cn("text-4xl md:text-6xl font-bold", grade.color)}>{persentase}%</p>
                <p className="text-gray-600 text-xs md:text-sm mt-1">Persentase</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <CheckCircle className="h-6 md:h-8 w-6 md:w-8 mx-auto text-green-600 mb-2" />
                <p className="text-lg md:text-2xl font-bold text-green-600">{skor}</p>
                <p className="text-xs text-gray-600">Benar</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <FileText className="h-6 md:h-8 w-6 md:w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-lg md:text-2xl font-bold text-blue-600">{maksimal}</p>
                <p className="text-xs text-gray-600">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <TrendingUp className="h-6 md:h-8 w-6 md:w-8 mx-auto text-purple-600 mb-2" />
                <p className="text-lg md:text-2xl font-bold text-purple-600">{persentase}%</p>
                <p className="text-xs text-gray-600">Akurasi</p>
              </CardContent>
            </Card>
          </div>

          {/* Message based on score */}
          <Alert className={cn(
            persentase >= 80 ? "border-green-500 bg-green-50" : 
            persentase >= 60 ? "border-blue-500 bg-blue-50" : 
            "border-yellow-500 bg-yellow-50"
          )}>
            <AlertDescription className="text-center text-xs md:text-sm">
              {persentase >= 90 && "Prestasi luar biasa! Anda menguasai materi dengan sangat baik."}
              {persentase >= 80 && persentase < 90 && "Kerja bagus! Pertahankan semangat belajar Anda."}
              {persentase >= 70 && persentase < 80 && "Hasil yang baik! Terus tingkatkan pemahaman Anda."}
              {persentase >= 60 && persentase < 70 && "Hasil cukup baik. Ada ruang untuk peningkatan."}
              {persentase < 60 && "Jangan menyerah! Terus belajar dan Anda pasti bisa lebih baik."}
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-3">
            <Button 
              className="flex-1 text-sm md:text-base h-10 md:h-11" 
              onClick={() => router.push('/student/dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button 
              className="flex-1 text-sm md:text-base h-10 md:h-11" 
              variant="outline"
              onClick={() => router.push('/student/riwayat')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Riwayat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
