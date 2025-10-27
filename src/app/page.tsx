'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookOpen, Users, BarChart3, Clock } from 'lucide-react'
import QuestionBank from '@/components/admin/QuestionBank'
import ExamManagement from '@/components/admin/ExamManagement'
import ExamList from '@/components/user/ExamList'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '' })
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })

      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      } else {
        setError(data.error || 'Login gagal')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      })

      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      } else {
        setError(data.error || 'Registrasi gagal')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  if (user) {
    if (user.role === 'ADMIN') {
      return (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <h1 className="text-xl font-bold">Sistem Tes Online</h1>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Selamat datang, {user.name}</span>
                  <Button variant="outline" onClick={handleLogout}>Logout</Button>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Admin</h2>
              <p className="text-gray-600">Kelola bank soal, jadwal ujian, dan lihat hasil</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="questions">Bank Soal</TabsTrigger>
                <TabsTrigger value="exams">Jadwal Ujian</TabsTrigger>
                <TabsTrigger value="results">Hasil Ujian</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                        <CardTitle>Bank Soal</CardTitle>
                      </div>
                      <CardDescription>Kelola kumpulan soal ujian</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600">0</p>
                      <p className="text-sm text-gray-600">Total soal</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Clock className="h-6 w-6 text-green-600" />
                        <CardTitle>Jadwal Ujian</CardTitle>
                      </div>
                      <CardDescription>Atur jadwal dan konfigurasi ujian</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">0</p>
                      <p className="text-sm text-gray-600">Ujian aktif</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                        <CardTitle>Hasil Ujian</CardTitle>
                      </div>
                      <CardDescription>Lihat statistik dan hasil ujian</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-purple-600">0</p>
                      <p className="text-sm text-gray-600">Total peserta</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                      <Button onClick={() => setActiveTab('questions')}>Tambah Soal Baru</Button>
                      <Button variant="outline" onClick={() => setActiveTab('exams')}>Buat Ujian Baru</Button>
                      <Button variant="outline" onClick={() => setActiveTab('results')}>Lihat Laporan</Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="questions">
                <QuestionBank />
              </TabsContent>

              <TabsContent value="exams">
                <ExamManagement />
              </TabsContent>

              <TabsContent value="results">
                <Card>
                  <CardHeader>
                    <CardTitle>Hasil Ujian</CardTitle>
                    <CardDescription>Lihat statistik dan hasil ujian peserta</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada hasil</h3>
                      <p className="text-gray-500">Hasil ujian akan muncul di sini</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      )
    } else {
      return (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <h1 className="text-xl font-bold">Sistem Tes Online</h1>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Selamat datang, {user.name}</span>
                  <Button variant="outline" onClick={handleLogout}>Logout</Button>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Siswa</h2>
              <p className="text-gray-600">Lihat daftar ujian dan kerjakan tes online</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-orange-600" />
                    <CardTitle>Ujian Belum Dikerjakan</CardTitle>
                  </div>
                  <CardDescription>Daftar ujian yang tersedia untuk dikerjakan</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExamList type="available" userId={user.id} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                    <CardTitle>Ujian Sudah Dikerjakan</CardTitle>
                  </div>
                  <CardDescription>Riwayat ujian yang telah selesai</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExamList type="completed" userId={user.id} />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sistem Tes Online</h1>
          <p className="text-gray-600 mt-2">Platform ujian online yang modern dan mudah digunakan</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selamat Datang</CardTitle>
            <CardDescription>Login atau daftar untuk melanjutkan</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Masukkan password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Memproses...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nama Lengkap</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Memproses...' : 'Daftar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="flex justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Admin & Siswa</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Ujian Terjadwal</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Hasil Real-time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}