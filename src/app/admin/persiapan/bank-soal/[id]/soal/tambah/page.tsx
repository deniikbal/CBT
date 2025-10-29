'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Plus, X, Save, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const MathEditor = dynamic(() => import('@/components/MathEditor'), { ssr: false })

interface BankSoal {
  id: string
  kodeBankSoal: string
  jumlahSoal: number
  mataPelajaran: {
    name: string
    kodeMatpel: string
  } | null
}

export default function TambahSoalPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: bankSoalId } = use(params)

  const [bankSoal, setBankSoal] = useState<BankSoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasOptionE, setHasOptionE] = useState(false)
  const [nextNomorSoal, setNextNomorSoal] = useState(1)

  const [formData, setFormData] = useState({
    nomorSoal: 1,
    soal: '',
    pilihanA: '',
    pilihanB: '',
    pilihanC: '',
    pilihanD: '',
    pilihanE: '',
    jawabanBenar: '' as 'A' | 'B' | 'C' | 'D' | 'E' | '',
    pembahasan: ''
  })

  useEffect(() => {
    fetchBankSoal()
    fetchNextNomorSoal()
  }, [])

  const fetchBankSoal = async () => {
    try {
      const response = await fetch(`/api/bank-soal/${bankSoalId}`)
      if (response.ok) {
        const data = await response.json()
        setBankSoal(data)
      } else {
        toast.error('Bank soal tidak ditemukan')
        router.push('/admin/persiapan/bank-soal')
      }
    } catch (error) {
      console.error('Error fetching bank soal:', error)
      toast.error('Gagal memuat data bank soal')
    } finally {
      setLoading(false)
    }
  }

  const fetchNextNomorSoal = async () => {
    try {
      const response = await fetch(`/api/bank-soal/${bankSoalId}/soal`)
      if (response.ok) {
        const soalList = await response.json()
        const nextNumber = soalList.length > 0 
          ? Math.max(...soalList.map((s: any) => s.nomorSoal)) + 1 
          : 1
        setNextNomorSoal(nextNumber)
        setFormData(prev => ({ ...prev, nomorSoal: nextNumber }))
      }
    } catch (error) {
      console.error('Error fetching soal:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validasi jawaban benar harus dipilih
    if (!formData.jawabanBenar) {
      toast.error('Pilih jawaban yang benar dengan mengklik radio button!')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/bank-soal/${bankSoalId}/soal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pilihanE: hasOptionE ? formData.pilihanE : null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Soal berhasil ditambahkan!', {
          description: `Soal nomor ${formData.nomorSoal} telah disimpan`
        })
        
        // Reset form untuk input soal berikutnya
        const newNomorSoal = nextNomorSoal + 1
        setNextNomorSoal(newNomorSoal)
        setFormData({
          nomorSoal: newNomorSoal,
          soal: '',
          pilihanA: '',
          pilihanB: '',
          pilihanC: '',
          pilihanD: '',
          pilihanE: '',
          jawabanBenar: '',
          pembahasan: ''
        })
        setHasOptionE(false)
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        toast.error(data.error || 'Terjadi kesalahan saat menyimpan soal')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !bankSoal) {
    return (
      <div className="p-8">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full py-4">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/admin/persiapan/bank-soal/${bankSoalId}/soal`)}
            className="gap-2 w-full sm:w-auto text-xs sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Button>
          <div className="border-l-0 sm:border-l pl-0 sm:pl-3">
            <h1 className="text-lg sm:text-xl font-bold">Tambah Soal Baru</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <span>{bankSoal.kodeBankSoal}</span>
              {bankSoal.mataPelajaran && (
                <>
                  <span className="hidden sm:block">•</span>
                  <Badge variant="secondary" className="text-xs w-fit">
                    {bankSoal.mataPelajaran.kodeMatpel}
                  </Badge>
                  <span className="hidden sm:inline">{bankSoal.mataPelajaran.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 mb-8">
          <Card>
            <CardContent className="pt-6 space-y-5">
              {/* Nomor Soal */}
              <div>
                <Label htmlFor="nomorSoal" className="text-sm">Nomor Soal</Label>
                <Input
                  id="nomorSoal"
                  type="number"
                  min="1"
                  value={formData.nomorSoal}
                  onChange={(e) => setFormData({ ...formData, nomorSoal: parseInt(e.target.value) || 1 })}
                  required
                  className="w-24 mt-1"
                />
              </div>

              {/* Soal */}
              <div>
                <MathEditor
                  key={`soal-${formData.nomorSoal}`}
                  label="Pertanyaan"
                  value={formData.soal}
                  onChange={(value) => setFormData({ ...formData, soal: value })}
                  placeholder="Tulis soal atau pertanyaan di sini... (Support simbol matematika)"
                  height="250px"
                  required
                />
              </div>

              {/* Pilihan Jawaban */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Pilihan Jawaban <span className="text-red-500">*</span> 
                  <span className="text-gray-500 font-normal"> (Klik radio button untuk pilih jawaban benar)</span>
                </Label>
              <RadioGroup 
                key={`radio-${formData.nomorSoal}`}
                value={formData.jawabanBenar || undefined} 
                onValueChange={(value: any) => setFormData({ ...formData, jawabanBenar: value })}
                className="space-y-4"
              >
                {/* Option A */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="A" id="jawaban-a" />
                    <Label htmlFor="jawaban-a" className="font-medium cursor-pointer">A.</Label>
                  </div>
                  <MathEditor
                    key={`pilihanA-${formData.nomorSoal}`}
                    value={formData.pilihanA}
                    onChange={(value) => setFormData({ ...formData, pilihanA: value })}
                    placeholder="Pilihan A"
                    height="50px"
                    required
                  />
                </div>

                {/* Option B */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="B" id="jawaban-b" />
                    <Label htmlFor="jawaban-b" className="font-medium cursor-pointer">B.</Label>
                  </div>
                  <MathEditor
                    key={`pilihanB-${formData.nomorSoal}`}
                    value={formData.pilihanB}
                    onChange={(value) => setFormData({ ...formData, pilihanB: value })}
                    placeholder="Pilihan B"
                    height="50px"
                    required
                  />
                </div>

                {/* Option C */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="C" id="jawaban-c" />
                    <Label htmlFor="jawaban-c" className="font-medium cursor-pointer">C.</Label>
                  </div>
                  <MathEditor
                    key={`pilihanC-${formData.nomorSoal}`}
                    value={formData.pilihanC}
                    onChange={(value) => setFormData({ ...formData, pilihanC: value })}
                    placeholder="Pilihan C"
                    height="50px"
                    required
                  />
                </div>

                {/* Option D */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="D" id="jawaban-d" />
                    <Label htmlFor="jawaban-d" className="font-medium cursor-pointer">D.</Label>
                  </div>
                  <MathEditor
                    key={`pilihanD-${formData.nomorSoal}`}
                    value={formData.pilihanD}
                    onChange={(value) => setFormData({ ...formData, pilihanD: value })}
                    placeholder="Pilihan D"
                    height="50px"
                    required
                  />
                </div>

                {/* Button Tambah Opsi E */}
                {!hasOptionE && (
                  <div className="pl-10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHasOptionE(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Opsi E
                    </Button>
                  </div>
                )}

                {/* Option E (Optional) */}
                {hasOptionE && (
                  <div className="space-y-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="E" id="jawaban-e" />
                        <Label htmlFor="jawaban-e" className="font-medium cursor-pointer">E.</Label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setHasOptionE(false)
                          setFormData({ ...formData, pilihanE: '', jawabanBenar: formData.jawabanBenar === 'E' ? '' : formData.jawabanBenar })
                        }}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <MathEditor
                      key={`pilihanE-${formData.nomorSoal}`}
                      value={formData.pilihanE}
                      onChange={(value) => setFormData({ ...formData, pilihanE: value })}
                      placeholder="Pilihan E (opsional)"
                      height="50px"
                    />
                  </div>
                )}
              </RadioGroup>
              </div>

              {/* Pembahasan */}
              <div>
                <MathEditor
                  key={`pembahasan-${formData.nomorSoal}`}
                  label="Pembahasan (Opsional)"
                  value={formData.pembahasan}
                  onChange={(value) => setFormData({ ...formData, pembahasan: value })}
                  placeholder="Tulis pembahasan atau penjelasan jawaban yang benar..."
                  height="200px"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push(`/admin/persiapan/bank-soal/${bankSoalId}/soal`)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Simpan & Input Lagi
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
