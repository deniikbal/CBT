'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Copy, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface JadwalOption {
  id: string
  namaUjian: string
}

export default function GoogleFormSetupPage() {
  const [jadwalList, setJadwalList] = useState<JadwalOption[]>([])
  const [selectedJadwal, setSelectedJadwal] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [formLink, setFormLink] = useState('')
  const [redirectLink, setRedirectLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchJadwal()
  }, [])

  const fetchJadwal = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/jadwal-ujian')
      if (response.ok) {
        const data = await response.json()
        const googleFormJadwal = data.filter(
          (j: any) => j.bankSoal?.sourceType === 'GOOGLE_FORM'
        )
        setJadwalList(googleFormJadwal)
      }
    } catch (error) {
      console.error('Error fetching jadwal:', error)
      toast.error('Gagal mengambil data jadwal')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateLink = async () => {
    if (!selectedJadwal) {
      toast.error('Pilih jadwal terlebih dahulu')
      return
    }

    try {
      setGenerating(true)
      // Get first peserta dari jadwal yang dipilih (untuk testing)
      const response = await fetch(
        `/api/jadwal-ujian/google-form/generate-link/${selectedJadwal}`,
        { method: 'GET' }
      )

      const data = await response.json()

      if (data.success) {
        setFormLink(data.googleFormUrl)
        setRedirectLink(data.redirectUrl)
        toast.success('Link berhasil di-generate')
      } else {
        toast.error(data.error || 'Gagal generate link')
      }
    } catch (error) {
      console.error('Error generating link:', error)
      toast.error('Gagal generate link')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(`${label} tersalin!`)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (jadwalList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Setup Google Form</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tidak ada jadwal ujian dengan Google Form. Buat jadwal Google Form terlebih dahulu.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Setup Google Form Auto-Redirect</h1>
        <p className="text-gray-600 mt-1">
          Generate link konfirmasi untuk embed di Google Form
        </p>
      </div>

      {/* Setup Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base text-blue-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            ⚠️ PENTING: Cara Setup Google Form
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-blue-800">
          <Alert className="bg-white border-blue-300">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>JANGAN copy link dari halaman ini!</strong> Link di halaman admin hanya untuk preview. Setiap peserta akan auto-generate link confirmation sendiri saat login.
            </AlertDescription>
          </Alert>

          <div>
            <p className="font-semibold mb-2">Setup di Google Form (sekali saja):</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Buka Google Form</li>
              <li>Settings (gear icon) → Presentation tab</li>
              <li>Enable "Show confirmation message"</li>
              <li>
                Di confirmation message, paste:
                <code className="bg-white p-2 rounded text-xs mt-1 block break-all">
                  Ujian selesai! Sistem akan memberikan link untuk konfirmasi di halaman CBT.
                </code>
              </li>
              <li>Save</li>
            </ol>
          </div>

          <div>
            <p className="font-semibold mb-2">Flow Peserta (otomatis):</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Login ke CBT → Ujian Saya</li>
              <li>Klik "Buka Google Form" / "Siap Google Form"</li>
              <li>Halaman CBT auto-generate link konfirmasi (unique per peserta)</li>
              <li>Peserta isi & submit Google Form</li>
              <li>Klik link konfirmasi → status update otomatis</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Generate Link Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Link Konfirmasi</CardTitle>
          <CardDescription>Pilih jadwal ujian yang ingin di-setup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pilih Jadwal Ujian *</Label>
            <Select value={selectedJadwal} onValueChange={setSelectedJadwal}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jadwal..." />
              </SelectTrigger>
              <SelectContent>
                {jadwalList.map((jadwal) => (
                  <SelectItem key={jadwal.id} value={jadwal.id}>
                    {jadwal.namaUjian}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerateLink}
            disabled={!selectedJadwal || generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generate...
              </>
            ) : (
              'Generate Link Konfirmasi'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {formLink && (
        <>
          {/* Google Form URL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Google Form URL</CardTitle>
              <CardDescription>Link asli Google Form (untuk referensi)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gray-100 p-4 rounded-lg break-all">
                <code className="text-sm text-gray-800">{formLink}</code>
              </div>
              <Button
                onClick={() => handleCopy(formLink, 'Google Form URL')}
                variant="outline"
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
            </CardContent>
          </Card>

          {/* Info Section */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-base text-purple-900 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Informasi (Untuk Admin Saja)
              </CardTitle>
              <CardDescription className="text-purple-800">
                Link berikut hanya untuk referensi. Peserta akan auto-generate link mereka sendiri.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert className="border-purple-300 bg-white">
                <AlertDescription className="text-sm text-purple-900">
                  ✓ Peserta akan auto-generate link confirmation yang unik saat mereka login dan buka halaman Google Form
                </AlertDescription>
              </Alert>

              <div>
                <p className="text-xs text-purple-700 mb-2 font-semibold">Google Form URL:</p>
                <div className="bg-white p-3 rounded-lg border border-purple-300 break-all">
                  <code className="text-xs text-purple-900 font-mono">
                    {formLink}
                  </code>
                </div>
              </div>

              <div>
                <p className="text-xs text-purple-700 mb-2 font-semibold">Contoh Redirect URL (untuk peserta pertama):</p>
                <div className="bg-white p-3 rounded-lg border border-purple-300 break-all">
                  <code className="text-xs text-purple-900 font-mono">
                    {redirectLink}
                  </code>
                </div>
              </div>

              <Button
                onClick={() => window.open(redirectLink, '_blank')}
                variant="outline"
                className="w-full text-xs"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Link (akan gagal jika bukan peserta pertama)
              </Button>
            </CardContent>
          </Card>

          {/* Embed Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cara Embed di Google Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Opsi 1: Confirmation Message</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
                    <li>Buka Google Form</li>
                    <li>Klik Settings (gear icon)</li>
                    <li>Tab "Presentation"</li>
                    <li>Enable "Show confirmation message"</li>
                    <li>Paste HTML:
                      <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto">
{`Ujian selesai! Klik <a href="${redirectLink}" target="_blank">di sini</a> untuk konfirmasi.`}
                      </pre>
                    </li>
                  </ol>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Opsi 2: Add Item (Link di Form)</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
                    <li>Klik "+" untuk add item di form</li>
                    <li>Pilih "Text"</li>
                    <li>Paste link di section description:
                      <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto">
{`Setelah submit form, buka link berikut:
${redirectLink}`}
                      </pre>
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
