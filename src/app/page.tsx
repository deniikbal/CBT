'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Clock, 
  Shield, 
  GraduationCap, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Lock
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CBT System</h1>
                <p className="text-xs text-gray-500">Computer Based Test</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <a href="#fitur" className="text-gray-600 hover:text-gray-900 transition-colors">Fitur</a>
              <a href="#tentang" className="text-gray-600 hover:text-gray-900 transition-colors">Tentang</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Platform Ujian Online Modern
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Sistem Ujian Online
              <span className="block text-blue-600 mt-2">Cepat & Efisien</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Platform ujian berbasis komputer yang memudahkan pengelolaan soal, pelaksanaan ujian, 
              dan monitoring hasil secara real-time untuk lembaga pendidikan Anda.
            </p>
          </div>

          {/* Login Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
            {/* Admin Login Card */}
            <Card className="border-2 hover:border-blue-500 transition-all hover:shadow-xl group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl">Login Admin</CardTitle>
                <CardDescription className="text-base">
                  Kelola bank soal, jadwal ujian, dan monitoring hasil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Kelola data master (jurusan, kelas, peserta)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Buat dan kelola bank soal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Monitoring hasil ujian real-time</span>
                  </div>
                </div>
                <Link href="/adm" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12 group">
                    Masuk sebagai Admin
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Student Login Card */}
            <Card className="border-2 hover:border-green-500 transition-all hover:shadow-xl group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl">Login Peserta</CardTitle>
                <CardDescription className="text-base">
                  Akses ujian online dan lihat hasil ujian Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Kerjakan ujian online kapan saja</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Interface yang mudah digunakan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Lihat hasil dan pembahasan</span>
                  </div>
                </div>
                <Link href="/login" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-lg h-12 group">
                    Masuk sebagai Peserta
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div id="fitur" className="grid md:grid-cols-4 gap-6 mb-20">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Bank Soal</h3>
                <p className="text-sm text-gray-600">Kelola ribuan soal dengan mudah</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Jadwal Fleksibel</h3>
                <p className="text-sm text-gray-600">Atur jadwal ujian sesuai kebutuhan</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Hasil Real-time</h3>
                <p className="text-sm text-gray-600">Monitoring dan laporan instan</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Aman & Terpercaya</h3>
                <p className="text-sm text-gray-600">Enkripsi data dan akses terkontrol</p>
              </CardContent>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Kenapa Memilih CBT System?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
                <p className="text-gray-600">Otomatis & Efisien</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">Real-time</div>
                <p className="text-gray-600">Monitoring Langsung</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">Unlimited</div>
                <p className="text-gray-600">Soal & Peserta</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">CBT System</p>
                <p className="text-sm text-gray-400">Computer Based Test</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">
                © 2025 CBT System. All rights reserved.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Platform ujian online untuk lembaga pendidikan
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}