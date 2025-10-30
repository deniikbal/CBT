'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertTriangle } from 'lucide-react'

interface ExamAgreementDialogProps {
  open: boolean
  onAgree: () => void
  examTitle: string
}

export default function ExamAgreementDialog({ open, onAgree, examTitle }: ExamAgreementDialogProps) {
  const [agreed, setAgreed] = useState(false)

  const handleAgree = () => {
    if (agreed) {
      onAgree()
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <DialogTitle>Ketentuan Ujian</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {examTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              Sistem akan memonitor aktivitas Anda untuk menjaga integritas ujian.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-2">Yang Dipantau:</p>
              <ul className="space-y-1 ml-4 text-gray-700">
                <li>• Keluar tab/aplikasi (maks. 5x peringatan)</li>
                <li>• Mode fullscreen (khusus desktop)</li>
                <li>• Copy-paste dan right-click dinonaktifkan</li>
                <li>• Hanya bisa login dari 1 device</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-2 text-red-600">Konsekuensi:</p>
              <ul className="space-y-1 ml-4 text-gray-700">
                <li>• Pelanggaran 1-3x: Peringatan</li>
                <li>• Pelanggaran 4-5x: Dicatat untuk review</li>
                <li>• Lebih dari 5x: Akun dinonaktifkan</li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agreement"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
              />
              <label
                htmlFor="agreement"
                className="text-sm cursor-pointer leading-relaxed"
              >
                Saya memahami dan menyetujui ketentuan di atas. Saya akan mengikuti ujian dengan jujur dan mematuhi semua aturan yang berlaku.
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAgree}
            disabled={!agreed}
            className="w-full"
            size="lg"
          >
            Setuju dan Mulai Ujian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
