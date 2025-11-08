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
      // Generate link untuk peserta demo (untuk admin testing)
      const response = await fetch(
        `/api/jadwal-ujian/google-form/generate-link/${selectedJadwal}?pesertaId=demo-admin`,
        { method: 'GET' }
      )

      const data = await response.json()

      if (data.success) {
        setFormLink(data.googleFormUrl)
        setRedirectLink(data.redirectUrl)
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
            Cara Setup (untuk Exambro)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800">
          <ol className="list-decimal list-inside space-y-2">
            <li>Pilih jadwal di bawah → Generate link konfirmasi</li>
            <li>Copy "Redirect URL"</li>
            <li>Buka Google Form → Settings → Presentation</li>
            <li>Enable "Show confirmation message"</li>
            <li>
              Paste Redirect URL di confirmation message:
              <br />
              <code className="bg-white p-2 rounded text-xs mt-1 block">
                Klik &lt;a href="[PASTE_LINK]"&gt;di sini&lt;/a&gt; untuk konfirmasi ujian selesai
              </code>
            </li>
            <li>Atau add item di form → paste link sebagai instruksi</li>
          </ol>
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

          {/* Redirect Link */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-base text-green-900 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Redirect URL (PENTING)
              </CardTitle>
              <CardDescription className="text-green-800">
                Link ini yang di-embed di Google Form confirmation message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert className="border-green-300 bg-white">
                <AlertDescription className="text-sm text-green-900">
                  Setelah peserta submit Google Form, akan auto-redirect ke halaman ini untuk konfirmasi
                </AlertDescription>
              </Alert>

              <div className="bg-white p-4 rounded-lg border-2 border-green-300 break-all">
                <code className="text-sm text-green-900 font-mono">
                  {redirectLink}
                </code>
              </div>

              <Button
                onClick={() => handleCopy(redirectLink, 'Redirect URL')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Tersalin!' : 'Copy Redirect URL'}
              </Button>

              <Button
                onClick={() => window.open(redirectLink, '_blank')}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Link
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
