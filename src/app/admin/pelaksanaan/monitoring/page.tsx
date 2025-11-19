'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { 
  Monitor, 
  AlertTriangle, 
  Eye, 
  Users, 
  Activity,
  Clock,
  Shield,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Info,
  Search,
  User,
  BookOpen
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface ActiveExam {
  id: string
  pesertaId: string
  pesertaName: string
  pesertaNoUjian: string
  jadwalId: string
  namaUjian: string
  bankSoalKode: string
  mataPelajaran: string
  sourceType: string
  waktuMulai: string
  status: string
  ipAddress: string
  progress: number
  duration: number
  activityCounts: Record<string, number>
  totalSuspicious: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface ActivityDetail {
  id: string
  activityType: string
  count: number
  timestamp: string
  metadata: string
}

export default function MonitoringPage() {
  const [activeExams, setActiveExams] = useState<ActiveExam[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState<ActiveExam | null>(null)
  const [activities, setActivities] = useState<ActivityDetail[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [forceSubmitting, setForceSubmitting] = useState(false)
  const [showForceSubmitDialog, setShowForceSubmitDialog] = useState(false)
  const [examToForceSubmit, setExamToForceSubmit] = useState<ActiveExam | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [forceSubmitResult, setForceSubmitResult] = useState<{
    pesertaName: string
    skor: number
    skorMaksimal: number
    persentase: number
  } | null>(null)

  // Fetch active exams
  const fetchActiveExams = async () => {
    try {
      console.log('[Monitoring Page] Fetching active exams...')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch('/api/admin/monitoring/active-exams', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      clearTimeout(timeoutId)
      
      console.log('[Monitoring Page] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Monitoring Page] Received data:', Array.isArray(data) ? data.length : 0, 'exams')
        // Ensure data is array
        setActiveExams(Array.isArray(data) ? data : [])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[Monitoring Page] API error:', errorData)
        setActiveExams([]) // Set empty array on error
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('[Monitoring Page] Request timeout after 30 seconds')
        } else {
          console.error('[Monitoring Page] Failed to fetch active exams:', error.message)
        }
      }
      console.error('[Monitoring Page] Full error:', error)
      setActiveExams([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Fetch activity details for selected exam
  const fetchActivities = async (hasilId: string) => {
    try {
      const response = await fetch(`/api/admin/monitoring/${hasilId}/activities`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchActiveExams()
  }, [])

  // Auto refresh every 5 seconds (faster for real-time monitoring)
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchActiveExams()
      if (selectedExam) {
        fetchActivities(selectedExam.id)
      }
    }, 5000) // 5 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, selectedExam])

  const handleViewDetails = (exam: ActiveExam) => {
    setSelectedExam(exam)
    fetchActivities(exam.id)
  }

  const handleForceSubmit = async () => {
    if (!examToForceSubmit) return
    
    setForceSubmitting(true)
    try {
      const response = await fetch('/api/admin/ujian/force-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasilId: examToForceSubmit.id,
          jadwalId: examToForceSubmit.jadwalId || examToForceSubmit.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        console.log('[Force Submit] Success:', data)
        setShowForceSubmitDialog(false)
        
        // Set success result
        setForceSubmitResult({
          pesertaName: examToForceSubmit.pesertaName,
          skor: data.skor,
          skorMaksimal: data.skorMaksimal,
          persentase: data.persentase
        })
        
        // Show success modal
        setShowSuccessModal(true)
        
        // Refresh exam list after delay
        setTimeout(() => {
          fetchActiveExams()
          setExamToForceSubmit(null)
        }, 2000)
      } else {
        const errorMsg = data.error || 'Gagal force submit ujian'
        console.error('[Force Submit] Error:', errorMsg)
        alert(`✗ Gagal: ${errorMsg}`)
      }
    } catch (error) {
      console.error('[Force Submit] Exception:', error)
      alert(`✗ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    } finally {
      setForceSubmitting(false)
    }
  }

  const getTimeExpiredStatus = (exam: ActiveExam) => {
    if (!exam.duration) return null
    
    const waktuMulai = new Date(exam.waktuMulai)
    const waktuSelesai = new Date(waktuMulai.getTime() + exam.duration * 60000)
    const sekarang = new Date()
    
    return sekarang > waktuSelesai
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-red-500">⚠️ Risiko Tinggi</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500">⚡ Risiko Sedang</Badge>
      default:
        return <Badge className="bg-green-500">✓ Aman</Badge>
    }
  }

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      TAB_BLUR: '🔄 Keluar Tab',
      EXIT_FULLSCREEN: '🖥️ Keluar Fullscreen',
      ATTEMPTED_DEVTOOLS: '⚠️ Buka DevTools',
      SCREENSHOT_ATTEMPT: '📸 Screenshot',
      RIGHT_CLICK: '🖱️ Right Click',
      COPY_ATTEMPT: '📋 Copy',
      PASTE_ATTEMPT: '📋 Paste',
      SESSION_VIOLATION: '🚫 Session Violation',
      FORCE_SUBMIT: '⚡ Force Submit',
    }
    return labels[type] || type
  }

  const stats = {
    total: activeExams.length,
    highRisk: activeExams.filter(e => e.riskLevel === 'high').length,
    mediumRisk: activeExams.filter(e => e.riskLevel === 'medium').length,
    safe: activeExams.filter(e => e.riskLevel === 'low').length,
  }

  // Filter and search exams
  const filteredExams = activeExams.filter(exam => {
    const matchesSearch = 
      exam.pesertaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.pesertaNoUjian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.namaUjian.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterRisk === 'all' || exam.riskLevel === filterRisk
    
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Monitoring Ujian</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Monitor aktivitas peserta secara real-time</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`w-full sm:w-auto text-xs sm:text-sm ${autoRefresh ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto Refresh' : 'Refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchActiveExams()}
            className="w-full sm:w-auto text-xs sm:text-sm border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Manual
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card className="border-blue-100 bg-gradient-to-r from-blue-50 to-white rounded-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari nama peserta, no ujian, atau nama ujian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs border-blue-200 focus:border-blue-400 rounded-sm"
              />
            </div>
            <div className="flex gap-1.5">
              <Button
                variant={filterRisk === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRisk('all')}
                className={`h-8 px-2.5 text-[11px] rounded-sm ${filterRisk === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                Semua ({activeExams.length})
              </Button>
              <Button
                variant={filterRisk === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRisk('high')}
                className={`h-8 px-2.5 text-[11px] rounded-sm ${filterRisk === 'high' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
              >
                Tinggi ({stats.highRisk})
              </Button>
              <Button
                variant={filterRisk === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRisk('medium')}
                className={`h-8 px-2.5 text-[11px] rounded-sm ${filterRisk === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-yellow-300 text-yellow-600 hover:bg-yellow-50'}`}
              >
                Sedang ({stats.mediumRisk})
              </Button>
              <Button
                variant={filterRisk === 'low' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRisk('low')}
                className={`h-8 px-2.5 text-[11px] rounded-sm ${filterRisk === 'low' ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
              >
                Aman ({stats.safe})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Exams Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Ujian Sedang Berlangsung
          </h2>
          <Badge variant="secondary" className="ml-2">
            {filteredExams.length} peserta
          </Badge>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-24">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Memuat data monitoring...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredExams.length === 0 ? (
          <Card>
            <CardContent className="py-24">
              <div className="text-center">
                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {searchQuery || filterRisk !== 'all' 
                    ? 'Tidak ada hasil yang sesuai'
                    : 'Tidak ada ujian yang sedang berlangsung'
                  }
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchQuery || filterRisk !== 'all'
                    ? 'Coba ubah filter atau kata kunci pencarian'
                    : 'Data akan muncul saat ada peserta yang mulai mengerjakan ujian'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {filteredExams.map((exam) => {
              const isTimeExpired = getTimeExpiredStatus(exam)
              
              return (
              <div 
                key={exam.id} 
                className={`relative rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg overflow-hidden ${
                  isTimeExpired ? 'border-red-600 bg-gradient-to-br from-red-100 to-white ring-2 ring-red-300' :
                  exam.riskLevel === 'high' ? 'border-red-500 bg-gradient-to-br from-red-50 to-white' :
                  exam.riskLevel === 'medium' ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-white' :
                  'border-green-500 bg-gradient-to-br from-green-50 to-white'
                }`}
                onClick={() => handleViewDetails(exam)}
              >
                {/* Top Badges */}
                <div className="absolute top-0 right-0 flex gap-1">
                  {/* Time Expired Badge */}
                  {isTimeExpired && (
                    <div className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-bl-md font-bold animate-pulse">
                      ⏰ WAKTU HABIS
                    </div>
                  )}
                  {/* Risk Badge Corner */}
                  {!isTimeExpired && (
                    <>
                      {exam.riskLevel === 'high' ? (
                        <div className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-bl-md">⚠️</div>
                      ) : exam.riskLevel === 'medium' ? (
                        <div className="bg-yellow-500 text-white text-[9px] px-1.5 py-0.5 rounded-bl-md">⚡</div>
                      ) : (
                        <div className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-bl-md">✓</div>
                      )}
                    </>
                  )}
                </div>

                <div className="p-2.5 pt-1.5">
                  {/* Nama Peserta + Badges */}
                  <div className="flex items-center gap-1 mb-1.5">
                    <h3 className="font-bold text-[11px] text-gray-900 truncate flex-1">
                      {exam.pesertaName}
                    </h3>
                    {/* Google Form Badge */}
                    {exam.sourceType === 'GOOGLE_FORM' && (
                      <span className="inline-flex items-center bg-blue-100 text-blue-700 text-[7px] px-1 py-0.5 rounded font-semibold whitespace-nowrap">
                        GF
                      </span>
                    )}
                    {/* Status Badge untuk Google Form */}
                    {exam.sourceType === 'GOOGLE_FORM' && exam.status === 'mulai' && (
                      <span className="inline-flex items-center bg-purple-100 text-purple-700 text-[7px] px-1 py-0.5 rounded font-semibold whitespace-nowrap">
                        MULAI
                      </span>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-1 mb-1.5">
                    <div className="bg-white/60 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5 text-blue-600 flex-shrink-0" />
                      <span className="text-[9px] font-semibold text-gray-700">{exam.progress}</span>
                    </div>
                    <div className="bg-white/60 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5 text-gray-600 flex-shrink-0" />
                      <span className="text-[9px] font-semibold text-gray-700">{exam.duration}m</span>
                    </div>
                  </div>

                  {/* Time Expired Warning */}
                  {isTimeExpired && (
                    <div className="bg-red-100 border-l-4 border-red-600 rounded p-1.5 mb-1.5">
                      <div className="text-[8px] font-bold text-red-700 flex items-center gap-1">
                        <span>⏰ WAKTU HABIS</span>
                      </div>
                      <p className="text-[7px] text-red-600 mt-0.5">
                        Klik untuk force submit jawaban
                      </p>
                    </div>
                  )}

                  {/* Pelanggaran Badge */}
                  {exam.totalSuspicious === 0 ? (
                    <div className="bg-green-100 border border-green-300 rounded py-0.5 text-center">
                      <span className="text-[9px] font-medium text-green-700">✓ Aman</span>
                    </div>
                  ) : (
                    <div className="bg-white/60 rounded p-1 border border-gray-200">
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {exam.activityCounts.TAB_BLUR > 0 && (
                          <span className="inline-flex items-center bg-orange-100 text-orange-700 text-[8px] px-1 py-0.5 rounded font-medium">
                            🔄{exam.activityCounts.TAB_BLUR}
                          </span>
                        )}
                        {exam.activityCounts.EXIT_FULLSCREEN > 0 && (
                          <span className="inline-flex items-center bg-blue-100 text-blue-700 text-[8px] px-1 py-0.5 rounded font-medium">
                            🖥️{exam.activityCounts.EXIT_FULLSCREEN}
                          </span>
                        )}
                        {exam.activityCounts.ATTEMPTED_DEVTOOLS > 0 && (
                          <span className="inline-flex items-center bg-red-100 text-red-700 text-[8px] px-1 py-0.5 rounded font-medium">
                            ⚠️{exam.activityCounts.ATTEMPTED_DEVTOOLS}
                          </span>
                        )}
                        {exam.activityCounts.SCREENSHOT_ATTEMPT > 0 && (
                          <span className="inline-flex items-center bg-purple-100 text-purple-700 text-[8px] px-1 py-0.5 rounded font-medium">
                            📸{exam.activityCounts.SCREENSHOT_ATTEMPT}
                          </span>
                        )}
                        {exam.activityCounts.RIGHT_CLICK > 0 && (
                          <span className="inline-flex items-center bg-gray-100 text-gray-700 text-[8px] px-1 py-0.5 rounded font-medium">
                            🖱️{exam.activityCounts.RIGHT_CLICK}
                          </span>
                        )}
                        {exam.activityCounts.COPY_ATTEMPT > 0 && (
                          <span className="inline-flex items-center bg-indigo-100 text-indigo-700 text-[8px] px-1 py-0.5 rounded font-medium">
                            📋{exam.activityCounts.COPY_ATTEMPT}
                          </span>
                        )}
                        {exam.activityCounts.SESSION_VIOLATION > 0 && (
                          <span className="inline-flex items-center bg-red-200 text-red-800 text-[8px] px-1 py-0.5 rounded font-medium">
                            🚫{exam.activityCounts.SESSION_VIOLATION}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
            })}
          </div>
        )}
      </div>

      {/* Activity Detail Dialog */}
      <Dialog open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Detail Aktivitas - {selectedExam?.pesertaName}
            </DialogTitle>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-4">
              {/* Exam Info */}
              <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="text-gray-600 font-medium">No Ujian:</span> {selectedExam.pesertaNoUjian} • {selectedExam.namaUjian}
                </div>
                <div className="flex gap-2 pt-1 flex-wrap">
                  {selectedExam.sourceType === 'GOOGLE_FORM' && (
                    <>
                      <span className="inline-flex items-center bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-semibold">
                        📋 Google Form
                      </span>
                      {selectedExam.status === 'mulai' && (
                        <span className="inline-flex items-center bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-semibold">
                          Status: Mulai (Baru buka form)
                        </span>
                      )}
                      {selectedExam.status === 'in_progress' && (
                        <span className="inline-flex items-center bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-semibold">
                          Status: Sedang Mengerjakan
                        </span>
                      )}
                      {selectedExam.status === 'submitted' && (
                        <span className="inline-flex items-center bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-semibold">
                          Status: Sudah Submit
                        </span>
                      )}
                    </>
                  )}
                  {selectedExam.sourceType !== 'GOOGLE_FORM' && (
                    <span className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-semibold">
                      📝 Ujian Manual
                    </span>
                  )}
                </div>
              </div>
              {/* Summary */}
              <Alert className={
                selectedExam.riskLevel === 'high' ? 'border-red-500 bg-red-50' :
                selectedExam.riskLevel === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-green-500 bg-green-50'
              }>
                <AlertDescription className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>
                      <strong>Status:</strong> {getRiskBadge(selectedExam.riskLevel)}
                    </span>
                    <span>
                      <strong>Total Pelanggaran:</strong> {selectedExam.totalSuspicious}x
                    </span>
                    <span>
                      <strong>IP Address:</strong> {selectedExam.ipAddress || 'N/A'}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Activity Timeline */}
              <div>
                <h4 className="font-semibold mb-3">Timeline Aktivitas</h4>
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p>Tidak ada aktivitas mencurigakan</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {getActivityLabel(activity.activityType)}
                            </span>
                            {activity.count > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.count}x
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {format(new Date(activity.timestamp), 'HH:mm:ss • dd MMM yyyy', { locale: localeId })}
                          </p>
                          {activity.metadata && (
                            <p className="text-xs text-gray-600 mt-1">
                              {activity.metadata}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Force Submit Section */}
              <div className="border-t pt-4 mt-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-orange-900 flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        Force Submit Ujian
                      </h4>
                      <p className="text-sm text-orange-700">
                        Gunakan tombol ini untuk memaksa submit ujian peserta yang sudah habis waktu atau untuk tindakan administratif lainnya.
                      </p>
                    </div>
                    <Button 
                      className="bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap ml-4"
                      onClick={() => {
                        setExamToForceSubmit(selectedExam)
                        setShowForceSubmitDialog(true)
                      }}
                      disabled={selectedExam?.status === 'submitted'}
                    >
                      ⚡ Force Submit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Force Submit Confirmation Dialog */}
      <Dialog open={showForceSubmitDialog} onOpenChange={setShowForceSubmitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Force Submit
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin memaksa submit ujian ini?
            </DialogDescription>
          </DialogHeader>
          
          {examToForceSubmit && (
            <div className="space-y-3 py-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Peserta:</span>
                  <span className="font-semibold">{examToForceSubmit.pesertaName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">No Ujian:</span>
                  <span className="font-semibold">{examToForceSubmit.pesertaNoUjian}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ujian:</span>
                  <span className="font-semibold">{examToForceSubmit.namaUjian}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold ${getTimeExpiredStatus(examToForceSubmit) ? 'text-red-600' : 'text-blue-600'}`}>
                    {getTimeExpiredStatus(examToForceSubmit) ? '⏰ Waktu Habis' : '⏱️ Masih Berlangsung'}
                  </span>
                </div>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Tindakan ini akan langsung mensubmit ujian peserta dengan jawaban yang sudah mereka kerjakan. Tindakan ini tidak dapat dibatalkan.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline"
              onClick={() => {
                setShowForceSubmitDialog(false)
                setExamToForceSubmit(null)
              }}
              disabled={forceSubmitting}
            >
              Batal
            </Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleForceSubmit}
              disabled={forceSubmitting}
            >
              {forceSubmitting ? '⏳ Sedang Submit...' : '⚡ Ya, Force Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse"></div>
                <div className="relative bg-green-500 rounded-full p-4">
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ujian Berhasil Disubmit!
            </h2>

            {/* Peserta Info */}
            {forceSubmitResult && (
              <>
                <p className="text-gray-600 mb-6">
                  Ujian <span className="font-semibold">{forceSubmitResult.pesertaName}</span> berhasil diforce submit oleh admin
                </p>

                {/* Score Display */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-100">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Nilai Akhir</p>
                      <p className="text-4xl font-bold text-blue-600">
                        {forceSubmitResult.skor}/{forceSubmitResult.skorMaksimal}
                      </p>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                        style={{ width: `${forceSubmitResult.persentase}%` }}
                      ></div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      <span className="text-2xl text-green-600">{forceSubmitResult.persentase}%</span> Benar
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center mb-6">
                  {forceSubmitResult.persentase >= 80 && (
                    <span className="inline-flex items-center bg-green-100 text-green-800 text-sm px-4 py-2 rounded-full font-semibold">
                      ⭐ Sangat Baik
                    </span>
                  )}
                  {forceSubmitResult.persentase >= 60 && forceSubmitResult.persentase < 80 && (
                    <span className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-full font-semibold">
                      ✓ Baik
                    </span>
                  )}
                  {forceSubmitResult.persentase < 60 && (
                    <span className="inline-flex items-center bg-orange-100 text-orange-800 text-sm px-4 py-2 rounded-full font-semibold">
                      ⚠ Perlu Belajar
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Info Text */}
            <p className="text-xs text-gray-500 mb-6">
              Peserta akan otomatis dihapus dari monitoring dalam beberapa detik
            </p>

            {/* Close Button */}
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                setForceSubmitResult(null)
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              ✓ Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
