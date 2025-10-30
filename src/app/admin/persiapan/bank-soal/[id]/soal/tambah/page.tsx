'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Plus, Save, CheckCircle2, Trash2 } from 'lucide-react'
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
    jawabanBenar: '' as 'A' | 'B' | 'C' | 'D' | 'E' | ''
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
          jawabanBenar: ''
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
            <CardContent className="pt-6 space-y-4">
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
                  height="72px"
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
                {([
                  { key: 'A', label: 'A', value: formData.pilihanA, setter: (value: string) => setFormData({ ...formData, pilihanA: value }) },
                  { key: 'B', label: 'B', value: formData.pilihanB, setter: (value: string) => setFormData({ ...formData, pilihanB: value }) },
                  { key: 'C', label: 'C', value: formData.pilihanC, setter: (value: string) => setFormData({ ...formData, pilihanC: value }) },
                  { key: 'D', label: 'D', value: formData.pilihanD, setter: (value: string) => setFormData({ ...formData, pilihanD: value }) },
                ] as const).map((option) => (
                  <div key={option.key} className="flex gap-3">
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <RadioGroupItem value={option.key} id={`jawaban-${option.key.toLowerCase()}`} className="h-5 w-5" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            [`pilihan${option.key}`]: '' as const,
                            jawabanBenar: prev.jawabanBenar === option.key ? '' : prev.jawabanBenar,
                          }))
                        }}
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        aria-label={`Hapus pilihan ${option.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor={`jawaban-${option.key.toLowerCase()}`}
                        className="mb-2 inline-block cursor-pointer font-medium"
                      >
                        Pilihan {option.label}
                      </Label>
                      <MathEditor
                        key={`pilihan${option.key}-${formData.nomorSoal}`}
                        value={option.value}
                        onChange={option.setter}
                        placeholder={`Isi jawaban ${option.label}`}
                        height="48px"
                        required
                      />
                    </div>
                  </div>
                ))}

                {/* Button Tambah Opsi E */}
                {!hasOptionE && (
                  <div className="flex justify-end">
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
                  <div className="flex gap-3 rounded border border-blue-200 bg-blue-50 p-3">
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <RadioGroupItem value="E" id="jawaban-e" className="h-5 w-5" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setHasOptionE(false)
                          setFormData(prev => ({
                            ...prev,
                            pilihanE: '',
                            jawabanBenar: prev.jawabanBenar === 'E' ? '' : prev.jawabanBenar,
                          }))
                        }}
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        aria-label="Hapus pilihan E"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="jawaban-e" className="mb-2 inline-block cursor-pointer font-medium">
                        Pilihan E (Opsional)
                      </Label>
                      <MathEditor
                        key={`pilihanE-${formData.nomorSoal}`}
                        value={formData.pilihanE}
                        onChange={(value) => setFormData({ ...formData, pilihanE: value })}
                        placeholder="Isi jawaban E (opsional)"
                        height="48px"
                      />
                    </div>
                  </div>
                )}
              </RadioGroup>
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
