'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Clock, AlertCircle, CheckCircle, Send, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useExamSecurity } from '@/hooks/useExamSecurity'
import ExamAgreementDialog from '@/components/ExamAgreementDialog'

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

  // Exam Security Hooks - must be called before any conditional returns
  const { blurCount, isFullscreen, logActivity, requestFullscreen } = useExamSecurity({
    hasilUjianId: hasilId || 'pending',
    pesertaId: pesertaId || 'pending',
    maxBlurCount: 5,
    enableFullscreen: agreedToTerms && !!hasilId,
    enableRightClickBlock: agreedToTerms && !!hasilId,
  })

  // Initialize pesertaId on mount
  useEffect(() => {
    const storedPeserta = localStorage.getItem('peserta')
    if (!storedPeserta) {
      console.log('No peserta data in localStorage, redirecting to login')
      router.push('/login')
      return
    }

    const pesertaData = JSON.parse(storedPeserta)
    console.log('Peserta data from localStorage:', pesertaData)
    
    // Check if account is active
    if (pesertaData.isActive === false) {
      console.log('Account is not active')
      toast.error('Akun Anda telah dinonaktifkan. Hubungi pengawas untuk mengaktifkan kembali.')
      setTimeout(() => {
        localStorage.removeItem('peserta')
        router.push('/login')
      }, 3000)
      return
    }
    
    console.log('Setting pesertaId:', pesertaData.id)
    setPesertaId(pesertaData.id)
  }, [router])

  // Log pesertaId changes
  useEffect(() => {
    console.log('pesertaId updated to:', pesertaId)
  }, [pesertaId])

  // Fetch jadwal info for agreement dialog
  useEffect(() => {
    if (!jadwal && !agreedToTerms && jadwalId) {
      fetchJadwalInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jadwalId])
    
  // Start exam after agreement
  useEffect(() => {
    console.log('=== START EXAM USEEFFECT ===')
    console.log('Checking start exam conditions:', { 
      agreedToTerms, 
      hasilId, 
      pesertaId, 
      jadwalId,
      loading 
    })
    
    if (!agreedToTerms) {
      console.log('Waiting for agreement...')
      return
    }
    
    if (hasilId) {
      console.log('Exam already started, hasilId exists:', hasilId)
      return
    }
    
    if (!pesertaId) {
      console.log('pesertaId not ready yet, waiting...')
      return
    }
    
    if (!jadwalId) {
      console.log('jadwalId missing')
      return
    }
    
    if (loading) {
      console.log('Already loading, skip...')
      return
    }
    
    console.log('All conditions met, starting ujian...')
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

  // Periodic auto-save ke database (setiap 30 detik)
  useEffect(() => {
    if (!hasilId || submitting) return

    const autoSaveInterval = setInterval(() => {
      saveProgress()
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [hasilId, jawaban, submitting])

  useEffect(() => {
    // Don't start timer if timeLeft is null (not loaded yet)
    if (timeLeft === null) return

    // Time expired - show warning but don't auto submit
    // Let student submit manually
    if (timeLeft <= 0) {
      if (!timeExpired) {
        setTimeExpired(true)
        toast.error('⏰ Waktu ujian telah habis! Silakan submit jawaban Anda sekarang.', {
          duration: 10000,
        })
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
      console.log('Fetching jadwal info for:', jadwalId)
      const response = await fetch(`/api/ujian/${jadwalId}/info`)
      if (response.ok) {
        const data = await response.json()
        console.log('Jadwal info fetched:', data)
        setJadwal({
          id: data.id,
          namaUjian: data.namaUjian,
          durasi: data.durasi,
          minimumPengerjaan: data.minimumPengerjaan,
          waktuMulai: data.waktuMulai,
          tampilkanNilai: data.tampilkanNilai,
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
    console.log('Starting exam for peserta:', pesertaId)
    setLoading(true)
    try {
      const response = await fetch(`/api/ujian/${jadwalId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesertaId })
      })

      console.log('Start ujian response:', response.status)

      if (!response.ok) {
        const data = await response.json()
        console.error('Failed to start ujian:', data)
        toast.error(data.error || 'Gagal memulai ujian', { duration: 5000 })
        
        // Don't redirect immediately, let user see the error
        setTimeout(() => {
          router.push('/student/ujian')
        }, 3000)
        return
      }

      const data = await response.json()
      console.log('Start ujian data:', { 
        hasilId: data.hasilId, 
        soalCount: data.soal?.length,
        jadwalNama: data.jadwal?.namaUjian 
      })

      if (!data.hasilId || !data.soal || !data.jadwal) {
        console.error('Invalid response data:', data)
        toast.error('Data ujian tidak lengkap')
        setTimeout(() => {
          router.push('/student/ujian')
        }, 3000)
        return
      }

      setJadwal(data.jadwal)
      setSoalList(data.soal)
      setHasilId(data.hasilId)

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
      
      console.log('Ujian started successfully')
    } catch (error) {
      console.error('Error starting ujian:', error)
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

      console.log('Submitting exam:', { 
        pesertaId: submitData.pesertaId, 
        hasilId: submitData.hasilId, 
        jawabanCount: Object.keys(submitData.jawaban).length 
      })

      const response = await fetch(`/api/ujian/${jadwalId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()
      console.log('Submit response:', response.status, data)

      if (response.ok) {
        // Clear localStorage setelah submit berhasil
        localStorage.removeItem(`ujian_${jadwalId}_jawaban`)
        toast.success('Ujian berhasil disubmit!', { duration: 3000 })
        router.push(`/student/ujian/${jadwalId}/hasil?skor=${data.skor}&maksimal=${data.skorMaksimal}&tampilkan=${data.tampilkanNilai}`)
      } else {
        console.error('Submit failed:', data)
        // Display error message to user with toast
        const errorMessage = data.error || 'Gagal submit ujian'
        toast.error(errorMessage, { 
          duration: 7000,
          description: data.details || undefined 
        })
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

  // Agreement handler
  const handleAgreeToTerms = async () => {
    console.log('Agreement accepted, starting exam...')
    
    // Detect if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
    
    // Request fullscreen only on desktop
    if (requestFullscreen && !isMobile) {
      console.log('Requesting fullscreen (desktop)...')
      const success = await requestFullscreen()
      if (success) {
        console.log('Fullscreen mode activated')
      } else {
        console.log('Fullscreen not activated, continuing without it')
      }
    } else {
      console.log('Skipping fullscreen (mobile device)')
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

  // Show agreement dialog first (once jadwal is loaded)
  if (showAgreement && jadwal) {
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

  if (!jadwal || soalList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tidak dapat memuat soal ujian. Silakan hubungi pengawas.
          </AlertDescription>
        </Alert>
      </div>
    )
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
            {/* Warning minimum time */}
            {jadwal.minimumPengerjaan && !timeExpired && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Anda harus mengerjakan minimal {jadwal.minimumPengerjaan} menit sebelum submit
                </AlertDescription>
              </Alert>
            )}

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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
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
              <CardContent className="space-y-6">
                {/* Question Text */}
                <div className="prose max-w-none">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{currentSoal.soal}</p>
                </div>

                {/* Options */}
                <RadioGroup
                  value={jawaban[currentSoal.id] || ''}
                  onValueChange={(value) => handleSelectJawaban(currentSoal.id, value)}
                >
                  <div className="space-y-3">
                    <div className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                      jawaban[currentSoal.id] === 'A' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    )}>
                      <RadioGroupItem value="A" id="option-a" className="mt-1" />
                      <Label htmlFor="option-a" className="flex-1 cursor-pointer">
                        <span className="font-semibold mr-2">A.</span>
                        {currentSoal.pilihanA}
                      </Label>
                    </div>

                    <div className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                      jawaban[currentSoal.id] === 'B' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    )}>
                      <RadioGroupItem value="B" id="option-b" className="mt-1" />
                      <Label htmlFor="option-b" className="flex-1 cursor-pointer">
                        <span className="font-semibold mr-2">B.</span>
                        {currentSoal.pilihanB}
                      </Label>
                    </div>

                    <div className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                      jawaban[currentSoal.id] === 'C' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    )}>
                      <RadioGroupItem value="C" id="option-c" className="mt-1" />
                      <Label htmlFor="option-c" className="flex-1 cursor-pointer">
                        <span className="font-semibold mr-2">C.</span>
                        {currentSoal.pilihanC}
                      </Label>
                    </div>

                    <div className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                      jawaban[currentSoal.id] === 'D' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    )}>
                      <RadioGroupItem value="D" id="option-d" className="mt-1" />
                      <Label htmlFor="option-d" className="flex-1 cursor-pointer">
                        <span className="font-semibold mr-2">D.</span>
                        {currentSoal.pilihanD}
                      </Label>
                    </div>

                    {currentSoal.pilihanE && (
                      <div className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                        jawaban[currentSoal.id] === 'E' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                      )}>
                        <RadioGroupItem value="E" id="option-e" className="mt-1" />
                        <Label htmlFor="option-e" className="flex-1 cursor-pointer">
                          <span className="font-semibold mr-2">E.</span>
                          {currentSoal.pilihanE}
                        </Label>
                      </div>
                    )}
                  </div>
                </RadioGroup>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentSoalIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentSoalIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Sebelumnya
                  </Button>

                  {currentSoalIndex === totalSoal - 1 ? (
                    <div className="flex flex-col items-end gap-2">
                      {totalSoal - getJumlahDijawab() > 0 && !timeExpired && (
                        <span className="text-xs text-orange-600">
                          {totalSoal - getJumlahDijawab()} soal belum dijawab
                        </span>
                      )}
                      <Button
                        className={cn(
                          "text-white",
                          timeExpired 
                            ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                            : "bg-green-600 hover:bg-green-700"
                        )}
                        onClick={() => setShowSubmitDialog(true)}
                        disabled={submitting}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {timeExpired ? 'Submit Sekarang!' : 'Submit Ujian'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentSoalIndex(prev => Math.min(totalSoal - 1, prev + 1))}
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-2" />
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
              <Card className="sticky top-24 w-64">
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
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Submit Ujian</DialogTitle>
            <DialogDescription>
              {totalSoal - getJumlahDijawab() === 0 
                ? 'Apakah Anda yakin ingin mengirim jawaban ujian?' 
                : 'Anda belum menjawab semua soal!'}
            </DialogDescription>
          </DialogHeader>
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
                <AlertDescription className="text-green-800">
                  Semua soal sudah dijawab. Anda dapat submit sekarang.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} disabled={submitting}>
              {totalSoal - getJumlahDijawab() > 0 ? 'Tutup' : 'Batal'}
            </Button>
            <Button 
              className={cn(
                totalSoal - getJumlahDijawab() === 0 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-gray-400 cursor-not-allowed"
              )}
              onClick={handleSubmit} 
              disabled={submitting || totalSoal - getJumlahDijawab() > 0}
            >
              {submitting ? 'Mengirim...' : totalSoal - getJumlahDijawab() > 0 ? 'Belum Bisa Submit' : 'Ya, Submit Sekarang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
