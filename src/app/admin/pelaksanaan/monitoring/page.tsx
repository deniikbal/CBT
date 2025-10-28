'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface ActiveExam {
  id: string
  pesertaId: string
  pesertaName: string
  pesertaNoUjian: string
  namaUjian: string
  bankSoalKode: string
  mataPelajaran: string
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

  // Fetch active exams
  const fetchActiveExams = async () => {
    try {
      console.log('[Monitoring Page] Fetching active exams...')
      const response = await fetch('/api/admin/monitoring/active-exams')
      
      console.log('[Monitoring Page] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Monitoring Page] Received data:', data.length, 'exams')
        setActiveExams(data)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[Monitoring Page] API error:', errorData)
      }
    } catch (error) {
      console.error('[Monitoring Page] Failed to fetch active exams:', error)
      console.error('[Monitoring Page] Error details:', error instanceof Error ? error.message : String(error))
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

  // Auto refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchActiveExams()
      if (selectedExam) {
        fetchActivities(selectedExam.id)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh, selectedExam])

  const handleViewDetails = (exam: ActiveExam) => {
    setSelectedExam(exam)
    fetchActivities(exam.id)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoring Ujian</h1>
          <p className="text-gray-600 mt-1">Monitor aktivitas peserta secara real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto Refresh' : 'Refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchActiveExams()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Manual
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Aktif</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risiko Tinggi</p>
                <p className="text-3xl font-bold text-red-600">{stats.highRisk}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risiko Sedang</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.mediumRisk}</p>
              </div>
              <Activity className="h-10 w-10 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aman</p>
                <p className="text-3xl font-bold text-green-600">{stats.safe}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Exams List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Ujian Sedang Berlangsung
          </CardTitle>
          <CardDescription>
            Daftar peserta yang sedang mengerjakan ujian dengan status monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : activeExams.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Tidak ada ujian yang sedang berlangsung</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeExams.map((exam) => (
                <div
                  key={exam.id}
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                    exam.riskLevel === 'high' 
                      ? 'border-red-300 bg-red-50' 
                      : exam.riskLevel === 'medium'
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{exam.pesertaName}</h3>
                        {getRiskBadge(exam.riskLevel)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="text-gray-500">No Ujian:</span>
                          <p className="font-medium">{exam.pesertaNoUjian}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Ujian:</span>
                          <p className="font-medium">{exam.namaUjian}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Durasi:</span>
                          <p className="font-medium">{exam.duration} menit</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Progress:</span>
                          <p className="font-medium">{exam.progress} jawaban</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {exam.activityCounts.TAB_BLUR > 0 && (
                          <Badge variant="outline" className="text-xs">
                            🔄 Keluar Tab: {exam.activityCounts.TAB_BLUR}x
                          </Badge>
                        )}
                        {exam.activityCounts.ATTEMPTED_DEVTOOLS > 0 && (
                          <Badge variant="outline" className="text-xs text-red-600">
                            ⚠️ DevTools: {exam.activityCounts.ATTEMPTED_DEVTOOLS}x
                          </Badge>
                        )}
                        {exam.activityCounts.SCREENSHOT_ATTEMPT > 0 && (
                          <Badge variant="outline" className="text-xs">
                            📸 Screenshot: {exam.activityCounts.SCREENSHOT_ATTEMPT}x
                          </Badge>
                        )}
                        {exam.totalSuspicious === 0 && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            ✓ Tidak Ada Aktivitas Mencurigakan
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(exam)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Detail Dialog */}
      <Dialog open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Detail Aktivitas - {selectedExam?.pesertaName}
            </DialogTitle>
            <DialogDescription>
              No Ujian: {selectedExam?.pesertaNoUjian} • {selectedExam?.namaUjian}
            </DialogDescription>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-4 mt-4">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
