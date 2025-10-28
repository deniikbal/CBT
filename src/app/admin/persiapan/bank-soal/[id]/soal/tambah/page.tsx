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
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/admin/persiapan/bank-soal/${bankSoalId}/soal`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div className="border-l pl-3">
              <h1 className="text-xl font-bold">Tambah Soal Baru</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{bankSoal.kodeBankSoal}</span>
                {bankSoal.mataPelajaran && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      {bankSoal.mataPelajaran.kodeMatpel}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
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
                <Label htmlFor="soal" className="text-sm font-medium">Pertanyaan <span className="text-red-500">*</span></Label>
                <Textarea
                  id="soal"
                  placeholder="Tulis soal atau pertanyaan di sini..."
                  value={formData.soal}
                  onChange={(e) => setFormData({ ...formData, soal: e.target.value })}
                  rows={4}
                  required
                  className="resize-none mt-1.5"
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
                className="space-y-2.5"
              >
                {/* Option A */}
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="A" id="jawaban-a" />
                  <Label htmlFor="jawaban-a" className="font-medium cursor-pointer w-8">A.</Label>
                  <Input
                    placeholder="Pilihan A"
                    value={formData.pilihanA}
                    onChange={(e) => setFormData({ ...formData, pilihanA: e.target.value })}
                    required
                    className="flex-1"
                  />
                </div>

                {/* Option B */}
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="B" id="jawaban-b" />
                  <Label htmlFor="jawaban-b" className="font-medium cursor-pointer w-8">B.</Label>
                  <Input
                    placeholder="Pilihan B"
                    value={formData.pilihanB}
                    onChange={(e) => setFormData({ ...formData, pilihanB: e.target.value })}
                    required
                    className="flex-1"
                  />
                </div>

                {/* Option C */}
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="C" id="jawaban-c" />
                  <Label htmlFor="jawaban-c" className="font-medium cursor-pointer w-8">C.</Label>
                  <Input
                    placeholder="Pilihan C"
                    value={formData.pilihanC}
                    onChange={(e) => setFormData({ ...formData, pilihanC: e.target.value })}
                    required
                    className="flex-1"
                  />
                </div>

                {/* Option D */}
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="D" id="jawaban-d" />
                  <Label htmlFor="jawaban-d" className="font-medium cursor-pointer w-8">D.</Label>
                  <Input
                    placeholder="Pilihan D"
                    value={formData.pilihanD}
                    onChange={(e) => setFormData({ ...formData, pilihanD: e.target.value })}
                    required
                    className="flex-1"
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
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <RadioGroupItem value="E" id="jawaban-e" />
                    <Label htmlFor="jawaban-e" className="font-medium cursor-pointer w-8">E.</Label>
                    <Input
                      placeholder="Pilihan E (opsional)"
                      value={formData.pilihanE}
                      onChange={(e) => setFormData({ ...formData, pilihanE: e.target.value })}
                      className="flex-1"
                    />
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
                )}
              </RadioGroup>
              </div>

              {/* Pembahasan */}
              <div>
                <Label htmlFor="pembahasan" className="text-sm font-medium">Pembahasan (Opsional)</Label>
                <Textarea
                  id="pembahasan"
                  placeholder="Tulis pembahasan atau penjelasan jawaban yang benar..."
                  value={formData.pembahasan}
                  onChange={(e) => setFormData({ ...formData, pembahasan: e.target.value })}
                  rows={3}
                  className="resize-none mt-1.5"
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
