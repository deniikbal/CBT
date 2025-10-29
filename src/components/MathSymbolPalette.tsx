'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface MathSymbolPaletteProps {
  onInsert: (symbol: string) => void
}

const mathSymbols = {
  'Angka & Operasi': [
    { symbol: '±', name: 'Plus minus' },
    { symbol: '×', name: 'Kali' },
    { symbol: '÷', name: 'Bagi' },
    { symbol: '=', name: 'Sama dengan' },
    { symbol: '≠', name: 'Tidak sama dengan' },
    { symbol: '≈', name: 'Hampir sama' },
    { symbol: '<', name: 'Kurang dari' },
    { symbol: '>', name: 'Lebih dari' },
    { symbol: '≤', name: 'Kurang sama dengan' },
    { symbol: '≥', name: 'Lebih sama dengan' },
  ],
  'Pangkat & Akar': [
    { symbol: '²', name: 'Pangkat 2' },
    { symbol: '³', name: 'Pangkat 3' },
    { symbol: '⁴', name: 'Pangkat 4' },
    { symbol: '⁵', name: 'Pangkat 5' },
    { symbol: '√', name: 'Akar kuadrat' },
    { symbol: '∛', name: 'Akar kubik' },
    { symbol: '∜', name: 'Akar pangkat 4' },
  ],
  'Huruf Yunani': [
    { symbol: 'α', name: 'Alpha' },
    { symbol: 'β', name: 'Beta' },
    { symbol: 'γ', name: 'Gamma' },
    { symbol: 'δ', name: 'Delta' },
    { symbol: 'θ', name: 'Theta' },
    { symbol: 'π', name: 'Pi' },
    { symbol: 'μ', name: 'Mu' },
    { symbol: 'σ', name: 'Sigma' },
    { symbol: 'Σ', name: 'Sigma besar' },
    { symbol: 'Ω', name: 'Omega' },
  ],
  'Kalkulus': [
    { symbol: '∫', name: 'Integral' },
    { symbol: '∬', name: 'Integral ganda' },
    { symbol: '∑', name: 'Sigma' },
    { symbol: '∏', name: 'Pi product' },
    { symbol: '∂', name: 'Partial' },
    { symbol: '∞', name: 'Infinity' },
    { symbol: 'lim', name: 'Limit' },
  ],
  'Geometri': [
    { symbol: '°', name: 'Derajat' },
    { symbol: '∠', name: 'Sudut' },
    { symbol: '⊥', name: 'Tegak lurus' },
    { symbol: '∥', name: 'Sejajar' },
    { symbol: '△', name: 'Segitiga' },
    { symbol: '∴', name: 'Oleh karena itu' },
  ],
  'Kurung': [
    { symbol: '()', name: 'Kurung biasa' },
    { symbol: '[]', name: 'Kurung siku' },
    { symbol: '{}', name: 'Kurung kurawal' },
    { symbol: '⟨⟩', name: 'Kurung sudut' },
  ]
}

export default function MathSymbolPalette({ onInsert }: MathSymbolPaletteProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-blue-900">Simbol Matematika</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Sembunyikan
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Tampilkan
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(mathSymbols).map(([category, symbols]) => (
              <div key={category}>
                <h4 className="text-xs font-medium text-blue-800 mb-1.5">{category}</h4>
                <div className="grid grid-cols-5 gap-1">
                  {symbols.map((item) => (
                    <Button
                      key={item.symbol}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onInsert(item.symbol)}
                      className="h-9 text-base hover:bg-blue-100 hover:border-blue-400"
                      title={item.name}
                    >
                      {item.symbol}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isExpanded && (
          <p className="text-xs text-blue-700">
            Klik "Tampilkan" untuk melihat simbol matematika yang bisa digunakan
          </p>
        )}
      </CardContent>
    </Card>
  )
}
