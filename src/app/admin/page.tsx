'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, GraduationCap, BookOpen, FileText } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStats {
  totalPeserta: number
  totalJurusan: number
  totalBankSoal: number
  totalJadwal: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Selamat datang di CBT Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Peserta
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalPeserta || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Peserta terdaftar</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Jurusan
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalJurusan || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Jurusan tersedia</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Bank Soal
            </CardTitle>
            <BookOpen className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalBankSoal || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Bank soal aktif</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Ujian
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalJadwal || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Ujian tersedia</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selamat Datang!</CardTitle>
          <CardDescription>
            Sistem manajemen Computer Based Test (CBT)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Gunakan menu di sidebar untuk:
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              Mengelola data master (Jurusan, Kelas, Mata Pelajaran, Peserta)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              Membuat dan mengelola bank soal
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              Mengatur ujian dan monitoring hasil
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
