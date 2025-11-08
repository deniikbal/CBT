'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, AlertCircle, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface ExamBrowserSettings {
  id: string
  isEnabled: boolean
  allowedBrowserPattern: string
  maxViolations: number
  allowMultipleSessions: boolean
  blockDevtools: boolean
  blockScreenshot: boolean
  blockRightClick: boolean
  blockCopyPaste: boolean
  requireFullscreen: boolean
}

export default function ExamBrowserSettingsPage() {
  const [settings, setSettings] = useState<ExamBrowserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/exam-browser-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setHasChanges(false)
      } else {
        toast.error('Gagal mengambil settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Gagal mengambil settings')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = (checked: boolean) => {
    if (settings) {
      setSettings({ ...settings, isEnabled: checked })
      setHasChanges(true)
    }
  }

  const handleSettingChange = (key: keyof ExamBrowserSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value })
      setHasChanges(true)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setIsSaving(true)
      const response = await fetch('/api/exam-browser-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const updated = await response.json()
      setSettings(updated)
      setHasChanges(false)
      toast.success('Settings berhasil disimpan')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Browser Settings</h1>
        <p className="text-gray-500 mt-2">
          Kelola pengaturan exam browser global untuk seluruh aplikasi
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      ) : settings ? (
        <div className="space-y-6">
          {/* Main Toggle */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Aktifkan Exam Browser</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Wajibkan peserta menggunakan exam browser untuk semua ujian
                  </p>
                </div>
                <Switch
                  checked={settings.isEnabled}
                  onCheckedChange={handleToggleEnabled}
                />
              </div>
            </CardHeader>
          </Card>

          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pengaturan Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pattern Browser yang Diizinkan</Label>
                <Input
                  value={settings.allowedBrowserPattern}
                  onChange={(e) => handleSettingChange('allowedBrowserPattern', e.target.value)}
                  placeholder="cbt-"
                  disabled={!settings.isEnabled}
                />
                <p className="text-xs text-gray-500">User agent yang diizinkan harus mengandung pattern ini</p>
              </div>

              <div className="space-y-2">
                <Label>Maksimal Pelanggaran Tab Blur</Label>
                <Input
                  type="number"
                  value={settings.maxViolations}
                  onChange={(e) => handleSettingChange('maxViolations', parseInt(e.target.value))}
                  disabled={!settings.isEnabled}
                  min="1"
                  max="20"
                />
                <p className="text-xs text-gray-500">Jumlah kali tab boleh blur sebelum auto-submit</p>
              </div>
            </CardContent>
          </Card>

          {/* Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pembatasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="font-medium">Block DevTools</Label>
                  <p className="text-xs text-gray-500">Cegah akses developer tools</p>
                </div>
                <Switch
                  checked={settings.blockDevtools}
                  onCheckedChange={(checked) => handleSettingChange('blockDevtools', checked)}
                  disabled={!settings.isEnabled}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="font-medium">Block Screenshot</Label>
                  <p className="text-xs text-gray-500">Cegah screenshot/print screen</p>
                </div>
                <Switch
                  checked={settings.blockScreenshot}
                  onCheckedChange={(checked) => handleSettingChange('blockScreenshot', checked)}
                  disabled={!settings.isEnabled}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="font-medium">Block Right Click</Label>
                  <p className="text-xs text-gray-500">Cegah klik kanan</p>
                </div>
                <Switch
                  checked={settings.blockRightClick}
                  onCheckedChange={(checked) => handleSettingChange('blockRightClick', checked)}
                  disabled={!settings.isEnabled}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="font-medium">Block Copy/Paste</Label>
                  <p className="text-xs text-gray-500">Cegah copy dan paste</p>
                </div>
                <Switch
                  checked={settings.blockCopyPaste}
                  onCheckedChange={(checked) => handleSettingChange('blockCopyPaste', checked)}
                  disabled={!settings.isEnabled}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="font-medium">Wajib Fullscreen</Label>
                  <p className="text-xs text-gray-500">Ujian harus dalam mode fullscreen</p>
                </div>
                <Switch
                  checked={settings.requireFullscreen}
                  onCheckedChange={(checked) => handleSettingChange('requireFullscreen', checked)}
                  disabled={!settings.isEnabled}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="font-medium">Izinkan Multiple Sessions</Label>
                  <p className="text-xs text-gray-500">Izinkan peserta buka ujian di multiple tab/browser</p>
                </div>
                <Switch
                  checked={settings.allowMultipleSessions}
                  onCheckedChange={(checked) => handleSettingChange('allowMultipleSessions', checked)}
                  disabled={!settings.isEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          {settings.isEnabled && (
            <div className="flex gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Perhatian</p>
                <p>Setting ini berlaku untuk SEMUA ujian. Peserta akan wajib menggunakan aplikasi CBT Browser untuk semua ujian.</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => fetchSettings()}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Shield className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">Gagal mengambil settings</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
