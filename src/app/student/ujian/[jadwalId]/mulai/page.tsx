'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Clock, AlertCircle, CheckCircle, CheckCircle2, Send, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Shield, Monitor, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useExamSecurity } from '@/hooks/useExamSecurity'
import ExamAgreementDialog from '@/components/ExamAgreementDialog'
import parse from 'html-react-parser'

interface Soal {
  id: string
  nomorSoal: number
  soal: string
  pilihanA: string
  pilihanB: string
  pilihanC: string
  pilihanD: string
  pilihanE: string | null
}

interface JadwalInfo {
  id: string
  namaUjian: string
  durasi: number
  minimumPengerjaan: number | null
  waktuMulai: string
  tampilkanNilai: boolean
  autoSubmitOnViolation: boolean
  requireExamBrowser: boolean
  allowedBrowserPattern: string
}

export default function PengerjaanUjianPage({ params }: { params: Promise<{ jadwalId: string }> }) {
  const router = useRouter()
  const { jadwalId } = use(params)
  
  const [loading, setLoading] = useState(true)
  const [jadwal, setJadwal] = useState<JadwalInfo | null>(null)
  const [soalList, setSoalList] = useState<Soal[]>([])
  const [hasilId, setHasilId] = useState<string>('')
  const [currentSoalIndex, setCurrentSoalIndex] = useState(0)
  const [jawaban, setJawaban] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null) // in seconds, null = not started
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timeExpired, setTimeExpired] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  const [showNavigasi, setShowNavigasi] = useState(true)
  const [showMobileModal, setShowMobileModal] = useState(false)
  const [showAgreement, setShowAgreement] = useState(true)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [pesertaId, setPesertaId] = useState<string>('')
  const [violationCount, setViolationCount] = useState(0)
  const [browserCheckFailed, setBrowserCheckFailed] = useState(false)
  const [browserCheckMessage, setBrowserCheckMessage] = useState('')
  
  // Create auto submit handler ref that will be assigned later
  const autoSubmitRef = useRef<(() => void) | null>(null)
  const autoSubmitTriggeredRef = useRef(false)

  // Exam Security Hooks - must be called before any conditional returns
  const { blurCount, isFullscreen, logActivity, requestFullscreen } = useExamSecurity({
    hasilUjianId: hasilId || 'pending',
    pesertaId: pesertaId || 'pending',
    maxBlurCount: 5,
    enableFullscreen: agreedToTerms && !!hasilId,
    enableRightClickBlock: agreedToTerms && !!hasilId,
    initialBlurCount: violationCount,
    autoSubmitOnViolation: jadwal?.autoSubmitOnViolation || false,
    onAutoSubmit: () => autoSubmitRef.current?.(),
  })

  // Initialize pesertaId on mount
  useEffect(() => {
    const storedPeserta = localStorage.getItem('peserta')
    if (!storedPeserta) {
      console.error('[INIT] No peserta data in localStorage, redirecting to login')
      router.push('/login')
      return
    }

    try {
      const pesertaData = JSON.parse(storedPeserta)
      
      // Check if account is active
      if (pesertaData.isActive === false) {
        console.error('[INIT] Account is not active')
        toast.error('Akun Anda telah dinonaktifkan. Hubungi pengawas untuk mengaktifkan kembali.')
        setTimeout(() => {
          localStorage.removeItem('peserta')
          router.push('/login')
        }, 3000)
        return
      }
      
      setPesertaId(pesertaData.id)
    } catch (error) {
      console.error('[INIT] Error parsing peserta data:', error)
      toast.error('Data tidak valid, silakan login kembali')
      router.push('/login')
    }
  }, [router])

  // Track pesertaId changes
  useEffect(() => {
    // pesertaId is ready
  }, [pesertaId])

  // Agreement will always show on page load (no localStorage check)

  // Fetch jadwal info for agreement dialog
  useEffect(() => {
    if (!jadwal && jadwalId) {
      fetchJadwalInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jadwalId])

  // Check exam browser requirement
  useEffect(() => {
    if (!jadwal) return

    // Check if exam requires exam browser
    if (jadwal.requireExamBrowser) {
      const userAgent = navigator.userAgent
      const pattern = jadwal.allowedBrowserPattern || 'cbt-'
      
      // Check if user agent contains the required pattern
      if (!userAgent.includes(pattern)) {
        setBrowserCheckFailed(true)
        setBrowserCheckMessage(
          `Ujian ini hanya bisa diakses menggunakan Exam Browser. ` +
          `Silakan download aplikasi "Exam Browser" dari Play Store dan akses ujian melalui aplikasi tersebut.`
        )
        toast.error('Ujian ini memerlukan Exam Browser!', { duration: 8000 })
      }
    }
  }, [jadwal])
    
  // Start exam after agreement
  useEffect(() => {
    if (!agreedToTerms) {
      return
    }
    
    if (hasilId) {
      return
    }
    
    if (!pesertaId) {
      return
    }
    
    if (!jadwalId) {
      return
    }
    
    if (loading) {
      return
    }
    
    const storedPeserta = localStorage.getItem('peserta')
    if (storedPeserta) {
      const pesertaData = JSON.parse(storedPeserta)
      startUjian(pesertaData.id)
    } else {
      console.error('No peserta in localStorage when trying to start')
      toast.error('Sesi berakhir, silakan login kembali')
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreedToTerms, pesertaId, hasilId])

  // Auto-save jawaban ke localStorage setiap kali berubah
  useEffect(() => {
    if (Object.keys(jawaban).length > 0 && jadwalId) {
      localStorage.setItem(`ujian_${jadwalId}_jawaban`, JSON.stringify(jawaban))
    }
  }, [jawaban, jadwalId])

  // Periodic auto-save ke database (setiap 10 detik)
  useEffect(() => {
    if (!hasilId || submitting) return

    const autoSaveInterval = setInterval(() => {
      saveProgress()
    }, 10000) // 10 seconds (faster for real-time monitoring)

    return () => clearInterval(autoSaveInterval)
  }, [hasilId, jawaban, submitting])

  useEffect(() => {
    // Don't start timer if timeLeft is null (not loaded yet)
    if (timeLeft === null) return

    // Time expired - auto submit
    if (timeLeft <= 0) {
      if (!timeExpired) {
        setTimeExpired(true)
        toast.error('⏰ Waktu ujian telah habis! Ujian akan disubmit otomatis...', {
          duration: 5000,
        })
      }
      
      // Auto-submit once when time expires
      if (!autoSubmitTriggeredRef.current && autoSubmitRef.current) {
        autoSubmitTriggeredRef.current = true
        // Delay slightly to ensure toast is visible
        setTimeout(() => {
          autoSubmitRef.current?.()
        }, 500)
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev !== null ? prev - 1 : null)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, timeExpired])

  const fetchJadwalInfo = async () => {
    try {
      const response = await fetch(`/api/ujian/${jadwalId}/info`)
      if (response.ok) {
        const data = await response.json()
        setJadwal({
          id: data.id,
          namaUjian: data.namaUjian,
          durasi: data.durasi,
          minimumPengerjaan: data.minimumPengerjaan,
          waktuMulai: data.waktuMulai,
          tampilkanNilai: data.tampilkanNilai,
          autoSubmitOnViolation: data.autoSubmitOnViolation || false,
          requireExamBrowser: data.requireExamBrowser || false,
          allowedBrowserPattern: data.allowedBrowserPattern || 'cbt-',
        })
        setLoading(false)
      } else {
        console.error('Failed to fetch jadwal info:', response.status)
      }
    } catch (error) {
      console.error('Error fetching jadwal info:', error)
    }
  }

  const startUjian = async (pesertaId: string) => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/ujian/${jadwalId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesertaId })
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Gagal memulai ujian', { duration: 5000 })
        
        // Don't redirect immediately, let user see the error
        setTimeout(() => {
          router.push('/student/ujian')
        }, 3000)
        return
      }

      const data = await response.json()

      if (!data.hasilId) {
        toast.error('Data ujian tidak lengkap (hasilId)')
        setTimeout(() => {
          router.push('/student/ujian')
        }, 3000)
        return
      }

      if (!data.soal || data.soal.length === 0) {
        toast.error('Data ujian tidak lengkap (soal)')
        setTimeout(() => {
          router.push('/student/ujian')
        }, 3000)
        return
      }

      if (!data.jadwal) {
        toast.error('Data ujian tidak lengkap (jadwal)')
        setTimeout(() => {
          router.push('/student/ujian')
        }, 3000)
        return
      }
      setJadwal(data.jadwal)
      setSoalList(data.soal)
      setHasilId(data.hasilId)
      
      // Load existing violation count from database
      if (data.existingViolationCount !== undefined) {
        setViolationCount(data.existingViolationCount)
      }

      // Load existing answers from database if available
      if (data.existingAnswers) {
        try {
          const dbAnswers = typeof data.existingAnswers === 'string' 
            ? JSON.parse(data.existingAnswers) 
            : data.existingAnswers
          
          // Merge dengan localStorage answers (localStorage prioritas karena lebih baru)
          const localAnswers = localStorage.getItem(`ujian_${jadwalId}_jawaban`)
          if (localAnswers) {
            const parsed = JSON.parse(localAnswers)
            const mergedAnswers = { ...dbAnswers, ...parsed }
            setJawaban(mergedAnswers)
            if (Object.keys(mergedAnswers).length > 0) {
              toast.info('Jawaban sebelumnya berhasil dimuat', { duration: 3000 })
            }
          } else {
            setJawaban(dbAnswers)
            if (Object.keys(dbAnswers).length > 0) {
              toast.info('Melanjutkan ujian sebelumnya', { duration: 3000 })
            }
          }
        } catch (e) {
          console.error('Error parsing existing answers:', e)
        }
      }

      // Calculate time left
      const waktuMulai = new Date(data.jadwal.waktuMulai)
      const waktuSelesai = new Date(waktuMulai.getTime() + data.jadwal.durasi * 60000)
      const sekarang = new Date()
      const secondsLeft = Math.max(0, Math.floor((waktuSelesai.getTime() - sekarang.getTime()) / 1000))
      
      setTimeLeft(secondsLeft)
      setLoading(false)
    } catch (error) {
      console.error('[START] Exception error starting ujian:', error)
      toast.error('Terjadi kesalahan saat memulai ujian', { duration: 5000 })
      setLoading(false)
      
      // Don't redirect immediately
      setTimeout(() => {
        router.push('/student/ujian')
      }, 3000)
    }
  }

  const saveProgress = async (showToast = false) => {
    if (saving || !hasilId || Object.keys(jawaban).length === 0) return

    setSaving(true)
    try {
      const storedPeserta = localStorage.getItem('peserta')
      if (!storedPeserta) return

      const pesertaData = JSON.parse(storedPeserta)

      const response = await fetch(`/api/ujian/${jadwalId}/save-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pesertaId: pesertaData.id,
          hasilId,
          jawaban
        })
      })

      if (response.ok) {
        setLastSaved(new Date())
        if (showToast) {
          toast.success('Progress berhasil disimpan!')
        }
      } else {
        if (showToast) {
          toast.error('Gagal menyimpan progress')
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error)
      if (showToast) {
        toast.error('Gagal menyimpan progress')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSelectJawaban = (soalId: string, pilihan: string) => {
    setJawaban(prev => ({
      ...prev,
      [soalId]: pilihan
    }))
  }

  const handleSubmit = async () => {
    // Close dialog first
    setShowSubmitDialog(false)
    setSubmitting(true)

    try {
      const storedPeserta = localStorage.getItem('peserta')
      if (!storedPeserta) {
        toast.error('Data peserta tidak ditemukan', { duration: 5000 })
        setSubmitting(false)
        return
      }

      const pesertaData = JSON.parse(storedPeserta)

      const submitData = {
        pesertaId: pesertaData.id,
        hasilId,
        jawaban
      }

      const response = await fetch(`/api/ujian/${jadwalId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      let data: any = {}
      try {
        const responseText = await response.text()
        if (responseText) {
          data = JSON.parse(responseText)
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        data = { error: 'Server error: Invalid response format' }
      }

      if (response.ok) {
        // Clear localStorage setelah submit berhasil
        localStorage.removeItem(`ujian_${jadwalId}_jawaban`)
        toast.success('Ujian berhasil disubmit!', { duration: 3000 })
        router.push(`/student/ujian/${jadwalId}/hasil?skor=${data.skor}&maksimal=${data.skorMaksimal}&tampilkan=${data.tampilkanNilai}`)
      } else {
        const errorMessage = data?.error || `Server error: ${response.status} ${response.statusText}`
        console.error('Submit failed:', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorMessage, 
          data,
          responseComplete: !!data
        })
        
        // Special styling for minimum time error - show toast in center with clean minimal style
        if (errorMessage.includes('harus mengerjakan minimal')) {
          toast.error(errorMessage, { 
            duration: 8000,
            position: 'top-center',
            className: 'text-center',
            description: 'Silakan kerjakan ujian lebih lama sebelum submit.',
          })
        } else {
          // Regular error toast with better formatting
          const description = data?.details 
            ? `${data.details}` 
            : (response.status === 500 ? 'Terjadi kesalahan server. Silakan coba lagi.' : undefined)
          
          toast.error(errorMessage, { 
            duration: 7000,
            description
          })
        }
        setSubmitting(false)
      }
    } catch (error) {
      console.error('Error submitting:', error)
      toast.error('Terjadi kesalahan saat submit ujian', { 
        duration: 5000,
        description: error instanceof Error ? error.message : 'Silakan coba lagi'
      })
      setSubmitting(false)
    }
  }

  const handleAutoSubmit = async () => {
    if (submitting) return
    
    toast.warning('Waktu habis! Ujian akan disubmit otomatis.', {
      duration: 5000,
    })
    await handleSubmit()
  }

  // Assign handleSubmit to ref for auto-submit callback
  // This runs after handleSubmit is defined
  autoSubmitRef.current = handleSubmit

  // Agreement handler
  const handleAgreeToTerms = async () => {
    // Request fullscreen for all devices (desktop and mobile)
    if (requestFullscreen) {
      try {
        const success = await requestFullscreen()
        if (success) {
          toast.success('Mode fullscreen aktif', { duration: 2000 })
        } else {
          toast.info('Mode fullscreen tidak tersedia di browser Anda', { duration: 3000 })
        }
      } catch (error) {
        console.error('[AGREEMENT] Fullscreen error:', error)
        toast.info('Tidak dapat mengaktifkan fullscreen, lanjut tanpa mode fullscreen', { duration: 3000 })
      }
    }
    
    setShowAgreement(false)
    setAgreedToTerms(true)
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (timeLeft === null) return 'text-gray-600'
    if (timeLeft <= 300) return 'text-red-600' // < 5 minutes
    if (timeLeft <= 600) return 'text-yellow-600' // < 10 minutes
    return 'text-green-600'
  }

  const getJumlahDijawab = () => {
    return Object.keys(jawaban).length
  }

  // Show browser check error if failed
  if (browserCheckFailed && jadwal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-3 sm:p-4">
        <Card className="max-w-md w-full border-red-200 shadow-xl">
          <CardHeader className="text-center pb-3 px-4 sm:px-6 pt-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-red-600" />
            </div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl text-red-900 leading-tight">Browser Tidak Diizinkan</CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
              {jadwal.namaUjian}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-5">
            <Alert variant="destructive" className="py-2 sm:py-3">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <AlertDescription className="text-xs sm:text-sm leading-snug">
                Ujian ini hanya bisa diakses menggunakan Exam Browser. Silakan download aplikasi Exam Browser dari Play Store.
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
                <li>Mulai ujian melalui aplikasi</li>
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
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full text-xs sm:text-sm h-9 sm:h-10"
                  onClick={() => router.push('/student/ujian')}
                >
                  Kembali
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:text-sm h-9 sm:h-10"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show agreement dialog first (once jadwal is loaded)
  if (showAgreement && jadwal && !browserCheckFailed) {
    return (
      <>
        <ExamAgreementDialog
          open={showAgreement}
          onAgree={handleAgreeToTerms}
          examTitle={jadwal.namaUjian}
        />
        {/* Show loading skeleton behind dialog */}
        <div className="min-h-screen bg-gray-50 blur-sm">
          <div className="container mx-auto p-4">
            <div className="text-center py-20">
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-3 space-y-4">
              {/* Timer Card */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </CardContent>
              </Card>

              {/* Question Card */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                  <div className="flex justify-between mt-6">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Skip error display if data is still loading
  // Modal petunjuk will show first, then data will load
  if (!jadwal || soalList.length === 0) {
    // Return nothing, let the agreement dialog show
    return null
  }

  const currentSoal = soalList[currentSoalIndex]
  const totalSoal = soalList.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Timer */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center gap-4">
            {/* Left: Title & Progress */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base lg:text-lg font-bold text-gray-800 truncate">{jadwal.namaUjian}</h1>
              <div className="flex items-center gap-2 lg:gap-3 mt-0.5">
                <p className="text-xs lg:text-sm text-gray-600">Soal {currentSoalIndex + 1}/{totalSoal}</p>
                
                {/* Auto-save indicator */}
                {saving && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <span className="animate-pulse">●</span> 
                    <span className="hidden sm:inline">Menyimpan</span>
                  </span>
                )}
                
                {/* Security status - only show if there's a warning */}
                {agreedToTerms && blurCount > 0 && (
                  <span className={cn("text-xs font-medium flex items-center gap-1", blurCount >= 3 ? "text-red-600" : "text-orange-600")}>
                    <Shield className="h-3 w-3" />
                    <span className="hidden sm:inline">Peringatan</span> {blurCount}/5
                  </span>
                )}
              </div>
            </div>

            {/* Right: Timer - Compact Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md px-3 py-2 lg:px-4 lg:py-2.5 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-2">
                <Clock className={cn("h-4 w-4 lg:h-5 lg:w-5", getTimeColor())} />
                <div>
                  <div className={cn("text-lg lg:text-2xl font-bold leading-none", getTimeColor())}>
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-[10px] lg:text-xs text-gray-500 mt-0.5">Waktu tersisa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 gap-6" style={{ gridTemplateColumns: showNavigasi ? '1fr auto' : '1fr' }}>
          {/* Main Content - Soal */}
          <div className="space-y-4">
            {/* Warning time expired */}
            {timeExpired && (
              <Alert variant="destructive" className="animate-pulse">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ⏰ Waktu ujian telah habis! Silakan submit jawaban Anda sekarang.
                </AlertDescription>
              </Alert>
            )}

            {/* Soal Card */}
            <Card className="rounded-sm shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Soal Nomor {currentSoal.nomorSoal}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMobileModal(true)}
                    className="lg:hidden"
                  >
                    <PanelLeftOpen className="h-4 w-4 mr-1" />
                    <span className="text-xs">Navigasi</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* Question Text */}
                <div className="prose max-w-none text-sm leading-normal">
                  {parse(currentSoal.soal || '')}
                </div>

                {/* Options */}
                <RadioGroup
                  value={jawaban[currentSoal.id] || ''}
                  onValueChange={(value) => handleSelectJawaban(currentSoal.id, value)}
                >
                  <div className="space-y-2">
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all",
                      jawaban[currentSoal.id] === 'A' 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    )}>
                      <RadioGroupItem value="A" id="option-a" />
                      <Label htmlFor="option-a" className="flex-1 cursor-pointer">
                        <span className="font-semibold mr-2">A.</span>
                        <span className="inline">{parse(currentSoal.pilihanA || '')}</span>
                      </Label>
                      {jawaban[currentSoal.id] === 'A' && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>

                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all",
                      jawaban[currentSoal.id] === 'B' 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    )}>
                      <RadioGroupItem value="B" id="option-b" />
                      <Label htmlFor="option-b" className="flex-1 cursor-pointer">
                        <span className="font-semibold mr-2">B.</span>
                        <span className="inline">{parse(currentSoal.pilihanB || '')}</span>
                      </Label>
                      {jawaban[currentSoal.id] === 'B' && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>

                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all",
                      jawaban[currentSoal.id] === 'C' 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    )}>
                      <RadioGroupItem value="C" id="option-c" />
                      <Label htmlFor="option-c" className="flex-1 cursor-pointer">
                        <span className="font-semibold mr-2">C.</span>
                        <span className="inline">{parse(currentSoal.pilihanC || '')}</span>
                      </Label>
                      {jawaban[currentSoal.id] === 'C' && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>

                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all",
                      jawaban[currentSoal.id] === 'D' 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    )}>
                      <RadioGroupItem value="D" id="option-d" />
                      <Label htmlFor="option-d" className="flex-1 cursor-pointer">
                        <span className="font-semibold mr-2">D.</span>
                        <span className="inline">{parse(currentSoal.pilihanD || '')}</span>
                      </Label>
                      {jawaban[currentSoal.id] === 'D' && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>

                    {currentSoal.pilihanE && (
                      <div className={cn(
                        "flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all",
                        jawaban[currentSoal.id] === 'E' 
                          ? 'border-blue-500 bg-blue-50 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      )}>
                        <RadioGroupItem value="E" id="option-e" />
                        <Label htmlFor="option-e" className="flex-1 cursor-pointer">
                          <span className="font-semibold mr-2">E.</span>
                          <span className="inline">{parse(currentSoal.pilihanE || '')}</span>
                        </Label>
                        {jawaban[currentSoal.id] === 'E' && (
                          <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    )}
                  </div>
                </RadioGroup>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentSoalIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentSoalIndex === 0}
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Sebelumnya
                  </Button>

                  {currentSoalIndex === totalSoal - 1 ? (
                    <Button
                      size="sm"
                      className={cn(
                        "text-white",
                        timeExpired 
                          ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                          : "bg-green-600 hover:bg-green-700"
                      )}
                      onClick={() => {
                        const unanswered = totalSoal - getJumlahDijawab()
                        if (unanswered > 0) {
                          toast.warning(`Masih ada ${unanswered} soal yang belum dijawab!`, {
                            duration: 4000,
                            description: 'Anda tetap bisa submit, tapi soal kosong akan dianggap salah.'
                          })
                        }
                        setShowSubmitDialog(true)
                      }}
                      disabled={submitting}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {timeExpired ? 'Submit Sekarang!' : 'Submit Ujian'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentSoalIndex(prev => Math.min(totalSoal - 1, prev + 1))}
                    >
                      Selanjutnya
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Nomor Soal */}
          <div className="hidden lg:block">
            {/* Toggle Button - Above navigation */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNavigasi(!showNavigasi)}
              className="mb-4 w-full"
            >
              {showNavigasi ? (
                <>
                  <PanelLeftClose className="h-4 w-4 mr-2" />
                  Sembunyikan Navigasi
                </>
              ) : (
                <>
                  <PanelLeftOpen className="h-4 w-4 mr-2" />
                  Tampilkan Navigasi
                </>
              )}
            </Button>

            {showNavigasi && (
              <Card className="rounded-sm shadow-sm sticky top-24 w-64">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Navigasi Soal</CardTitle>
                  <CardDescription className="text-xs">
                    {getJumlahDijawab()} dari {totalSoal} terjawab
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {soalList.map((soal, index) => (
                      <button
                        key={soal.id}
                        onClick={() => setCurrentSoalIndex(index)}
                        className={cn(
                          "aspect-square rounded-md font-semibold text-sm transition-colors",
                          currentSoalIndex === index
                            ? "bg-blue-600 text-white"
                            : jawaban[soal.id]
                            ? "bg-green-100 text-green-700 border-2 border-green-500"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-blue-600"></div>
                      <span>Soal aktif</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-green-100 border-2 border-green-500"></div>
                      <span>Sudah dijawab</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-gray-100"></div>
                      <span>Belum dijawab</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Modal */}
      <Dialog open={showMobileModal} onOpenChange={setShowMobileModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Navigasi Soal</DialogTitle>
            <DialogDescription>
              {getJumlahDijawab()} dari {totalSoal} soal sudah dijawab
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-5 gap-2">
              {soalList.map((soal, index) => (
                <button
                  key={soal.id}
                  onClick={() => {
                    setCurrentSoalIndex(index)
                    setShowMobileModal(false)
                  }}
                  className={cn(
                    "aspect-square rounded-md font-semibold text-sm transition-colors",
                    currentSoalIndex === index
                      ? "bg-blue-600 text-white"
                      : jawaban[soal.id]
                      ? "bg-green-100 text-green-700 border-2 border-green-500"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-600"></div>
                <span>Soal aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-green-100 border-2 border-green-500"></div>
                <span>Sudah dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gray-100"></div>
                <span>Belum dijawab</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={(open) => !submitting && setShowSubmitDialog(open)}>
        <DialogContent className={submitting ? "opacity-100" : ""}>
          <DialogHeader>
            <DialogTitle>Konfirmasi Submit Ujian</DialogTitle>
            <DialogDescription>
              {submitting 
                ? 'Sedang mengirim jawaban ujian Anda...' 
                : totalSoal - getJumlahDijawab() === 0 
                  ? 'Apakah Anda yakin ingin mengirim jawaban ujian?' 
                  : 'Anda belum menjawab semua soal!'}
            </DialogDescription>
          </DialogHeader>

          {/* Loading State */}
          {submitting && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
              <p className="text-sm font-semibold text-gray-700 text-center">Menyimpan jawaban Anda...</p>
              <p className="text-xs text-gray-500 text-center mt-2">Jangan tutup dialog ini atau refresh halaman</p>
            </div>
          )}

          {/* Content (Hidden when submitting) */}
          {!submitting && (
            <>
              <div className="py-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Soal:</span>
                    <span className="font-semibold">{totalSoal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sudah Dijawab:</span>
                    <span className="font-semibold text-green-600">{getJumlahDijawab()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Belum Dijawab:</span>
                    <span className={cn(
                      "font-semibold",
                      totalSoal - getJumlahDijawab() > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {totalSoal - getJumlahDijawab()}
                    </span>
                  </div>
                </div>

                {totalSoal - getJumlahDijawab() > 0 && (
                  <Alert className="mt-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-1">
                        Anda harus menjawab semua soal sebelum submit!
                      </div>
                      <div className="text-sm">
                        Masih ada {totalSoal - getJumlahDijawab()} soal yang belum dijawab. Silakan periksa kembali.
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {totalSoal - getJumlahDijawab() === 0 && (
                  <Alert className="mt-4 border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      Semua soal sudah dijawab. Siap untuk submit!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                  {totalSoal - getJumlahDijawab() > 0 ? 'Tutup' : 'Batal'}
                </Button>
                <Button 
                  className={cn(
                    totalSoal - getJumlahDijawab() === 0 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-gray-400 cursor-not-allowed"
                  )}
                  onClick={handleSubmit} 
                  disabled={totalSoal - getJumlahDijawab() > 0}
                >
                  Ya, Submit Sekarang
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
