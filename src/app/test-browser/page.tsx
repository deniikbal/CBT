'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

export default function TestBrowserPage() {
  const [userAgent, setUserAgent] = useState('')
  const [copied, setCopied] = useState(false)
  const [browserInfo, setBrowserInfo] = useState({
    isExamBrowser: false,
    isMobile: false,
    platform: '',
  })

  useEffect(() => {
    // Get user agent
    const ua = navigator.userAgent
    setUserAgent(ua)

    // Detect if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)

    // Detect platform
    const platform = navigator.platform

    // Try to detect if it's an exam browser
    // Common patterns: SafeExamBrowser, SEB, ExamBrowser, SecureBrowser, etc.
    const isExamBrowser = /SafeExamBrowser|SEB|ExamBrowser|SecureBrowser|LockDown|Kiosk/i.test(ua)

    setBrowserInfo({
      isExamBrowser,
      isMobile,
      platform,
    })
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(userAgent)
    setCopied(true)
    toast.success('User Agent berhasil dicopy!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Browser Detection Tool
          </h1>
          <p className="text-gray-600">
            Gunakan halaman ini untuk mengetahui User Agent dari Exam Browser Anda
          </p>
        </div>

        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Cara Menggunakan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Buka halaman ini menggunakan <strong>Exam Browser di HP/Tablet</strong></li>
                <li>User Agent akan muncul otomatis di bawah</li>
                <li>Klik tombol "Copy User Agent" untuk menyalin</li>
                <li>Kirimkan User Agent tersebut ke admin untuk konfigurasi sistem</li>
              </ol>
            </CardContent>
          </Card>

          {/* Browser Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Browser</CardTitle>
              <CardDescription>Detail browser yang sedang digunakan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className={`font-semibold ${browserInfo.isExamBrowser ? 'text-green-600' : 'text-orange-600'}`}>
                    {browserInfo.isExamBrowser ? '✓ Exam Browser' : '✗ Browser Biasa'}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Device</div>
                  <div className="font-semibold text-gray-800">
                    {browserInfo.isMobile ? 'Mobile/Tablet' : 'Desktop'}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Platform</div>
                  <div className="font-semibold text-gray-800">
                    {browserInfo.platform || 'Unknown'}
                  </div>
                </div>
              </div>

              {!browserInfo.isExamBrowser && browserInfo.isMobile && (
                <Alert>
                  <AlertDescription>
                    Anda menggunakan browser biasa di mobile. Silakan buka halaman ini dengan <strong>Exam Browser</strong> untuk melihat User Agent yang benar.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* User Agent Display */}
          <Card>
            <CardHeader>
              <CardTitle>User Agent String</CardTitle>
              <CardDescription>
                Copy string ini dan berikan ke admin untuk konfigurasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs break-all">
                {userAgent || 'Loading...'}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleCopy}
                  className="flex-1"
                  disabled={!userAgent}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy User Agent
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Tips untuk Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-blue-900">
                <li>Setelah mendapat User Agent, cari keyword unik (contoh: "ExamBrowser", "Secure", dll)</li>
                <li>Keyword tersebut akan digunakan untuk deteksi otomatis</li>
                <li>Pastikan test dengan beberapa device berbeda untuk memastikan konsistensi</li>
                <li>Jika ada versi berbeda dari exam browser, test semua versi</li>
              </ul>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              Kembali
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
