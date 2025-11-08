'use client'

import { Download, AlertTriangle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ExamBrowserRequired() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-3">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-5">
        {/* Header */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">
          Exam Browser Diperlukan
        </h1>
        <p className="text-center text-gray-600 text-sm mb-4">
          Gunakan Exam Browser untuk akses yang aman
        </p>

        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex gap-2">
            <Shield className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-blue-900 mb-0.5">Keamanan Ujian</p>
              <p className="text-blue-800">
                Exam Browser melindungi integritas ujian dengan fitur keamanan tingkat lanjut.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-4">
          <p className="font-semibold text-gray-900 text-xs mb-2">Fitur:</p>
          <ul className="space-y-1 text-xs text-gray-700">
            <li className="flex gap-1.5">
              <span className="text-green-600 font-bold flex-shrink-0">✓</span>
              <span>Pencegahan kecurangan berbasis teknologi</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-green-600 font-bold flex-shrink-0">✓</span>
              <span>Monitoring aktivitas real-time</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-green-600 font-bold flex-shrink-0">✓</span>
              <span>Fullscreen dan penguncian layar</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-green-600 font-bold flex-shrink-0">✓</span>
              <span>Blokir tools tidak diizinkan</span>
            </li>
          </ul>
        </div>

        {/* Download Button */}
        <a
          href="https://play.google.com/store/apps/details?id=id.sch.manbulungan.exampatra"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mb-3"
        >
          <Button className="w-full bg-green-600 hover:bg-green-700 gap-2 h-9 text-sm">
            <Download className="h-4 w-4" />
            Download Google Play
          </Button>
        </a>

        {/* Info Text */}
        <p className="text-xs text-center text-gray-500">
          Setelah mengunduh, kembali dan mulai ujian Anda.
        </p>
      </div>
    </div>
  )
}
