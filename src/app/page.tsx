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
  Lock,
  Monitor,
  FileCheck,
  Target,
  TrendingUp
} from 'lucide-react'

export default function LandingPage() {
  return (
    <>
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CBT System</h1>
                <p className="text-xs text-blue-100">Computer Based Test</p>
              </div>
            </div>
            <nav className="flex items-center gap-3 md:gap-6">
              <a href="#fitur" className="hidden md:block text-white/90 hover:text-white transition-colors font-medium">Fitur</a>
              <a href="#keunggulan" className="hidden md:block text-white/90 hover:text-white transition-colors font-medium">Keunggulan</a>
              <Link href="/test-browser">
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-medium shadow-md backdrop-blur-sm">
                  <Monitor className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Test Browser</span>
                  <span className="sm:hidden">Test</span>
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-md">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Login Peserta</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg">
                <Zap className="h-4 w-4" />
                Platform Ujian Online Modern
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Sistem Ujian Online
                <span className="block text-blue-600 mt-2">Cepat, Aman & Efisien</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Platform ujian berbasis komputer yang memudahkan pengelolaan soal, pelaksanaan ujian, 
                dan monitoring hasil secara real-time untuk lembaga pendidikan Anda.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/login">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg h-14 px-8 shadow-lg">
                    Mulai Ujian
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#fitur">
                  <Button size="lg" variant="outline" className="text-lg h-14 px-8 border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                    Lihat Fitur
                  </Button>
                </a>
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                    <Monitor className="h-8 w-8 text-white" />
                    <div>
                      <p className="text-white font-semibold">Ujian Online</p>
                      <p className="text-blue-100 text-sm">Akses Kapan Saja</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                    <FileCheck className="h-8 w-8 text-white" />
                    <div>
                      <p className="text-white font-semibold">Hasil Instan</p>
                      <p className="text-blue-100 text-sm">Real-time Monitoring</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                    <Shield className="h-8 w-8 text-white" />
                    <div>
                      <p className="text-white font-semibold">Aman Terpercaya</p>
                      <p className="text-blue-100 text-sm">Data Terenkripsi</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div id="fitur" className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Fitur Unggulan</h2>
              <p className="text-gray-600 text-lg">Solusi lengkap untuk ujian online Anda</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-2 border-blue-100 hover:border-blue-500 hover:shadow-xl transition-all group">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">Bank Soal</h3>
                  <p className="text-sm text-gray-600">Kelola ribuan soal dengan mudah dan terstruktur</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100 hover:border-blue-500 hover:shadow-xl transition-all group">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">Jadwal Fleksibel</h3>
                  <p className="text-sm text-gray-600">Atur jadwal ujian sesuai kebutuhan institusi</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100 hover:border-blue-500 hover:shadow-xl transition-all group">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">Hasil Real-time</h3>
                  <p className="text-sm text-gray-600">Monitoring dan laporan hasil secara instan</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100 hover:border-blue-500 hover:shadow-xl transition-all group">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">Aman & Terpercaya</h3>
                  <p className="text-sm text-gray-600">Enkripsi data dan sistem keamanan berlapis</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats Section */}
          <div id="keunggulan" className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-2xl p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Kenapa Memilih CBT System?
            </h2>
            <p className="text-center text-blue-100 mb-10 text-lg">Keunggulan yang membuat kami berbeda</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all">
                <Target className="h-12 w-12 mx-auto mb-4 text-white" />
                <div className="text-4xl font-bold mb-2">100%</div>
                <p className="text-blue-100">Otomatis & Efisien</p>
                <p className="text-sm text-blue-200 mt-2">Proses penilaian otomatis dan cepat</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-white" />
                <div className="text-4xl font-bold mb-2">Real-time</div>
                <p className="text-blue-100">Monitoring Langsung</p>
                <p className="text-sm text-blue-200 mt-2">Pantau progres ujian secara real-time</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all">
                <Users className="h-12 w-12 mx-auto mb-4 text-white" />
                <div className="text-4xl font-bold mb-2">Unlimited</div>
                <p className="text-blue-100">Soal & Peserta</p>
                <p className="text-sm text-blue-200 mt-2">Tanpa batasan jumlah soal dan peserta</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-700 to-blue-800 text-white py-12 mt-20 border-t-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">CBT System</p>
                  <p className="text-sm text-blue-200">Computer Based Test</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">
                Platform ujian online modern untuk meningkatkan efisiensi dan akurasi evaluasi pendidikan.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-lg">Tautan Cepat</h3>
              <ul className="space-y-2 text-blue-100">
                <li><a href="#fitur" className="hover:text-white transition-colors">Fitur</a></li>
                <li><a href="#keunggulan" className="hover:text-white transition-colors">Keunggulan</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login Peserta</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-lg">Kontak</h3>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li>Email: info@cbtsystem.com</li>
                <li>Telepon: (021) 1234-5678</li>
                <li>Support: support@cbtsystem.com</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-600 pt-6 text-center">
            <p className="text-sm text-blue-100">
              © 2025 CBT System. All rights reserved.
            </p>
            <p className="text-xs text-blue-200 mt-2">
              Dikembangkan dengan ❤️ untuk pendidikan Indonesia
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}