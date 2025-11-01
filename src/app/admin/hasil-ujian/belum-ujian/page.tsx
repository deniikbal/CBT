'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Eye, Calendar, Clock, UserX, School } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Peserta {
  id: string
  name: string
  noUjian: string
  kelasId: string | null
  kelasName: string | null
  isActive: boolean
}

interface JadwalInfo {
  id: string
  namaUjian: string
  tanggalUjian: Date
  waktuMulai: Date
  durasi: number
  kelasId: string | null
  kelasName: string
  bankSoalKode: string | null
  isActive: boolean
}

interface BelumUjianData {
  jadwal: JadwalInfo
  totalPeserta: number
  belumUjian: number
  sudahUjian: number
  pesertaBelumUjian: Peserta[]
}

export default function BelumUjianPage() {
  const [dataList, setDataList] = useState<BelumUjianData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJadwal, setSelectedJadwal] = useState<BelumUjianData | null>(null)
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedJadwal) {
      setFilteredPeserta(selectedJadwal.pesertaBelumUjian)
    }
  }, [selectedJadwal])

  const fetchData = async () => {
    try {
      console.log('[Belum Ujian Page] Fetching data...')
      const response = await fetch('/api/admin/belum-ujian')
      console.log('[Belum Ujian Page] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Belum Ujian Page] Fetched data:', data.length, 'jadwal')
        setDataList(data)
      } else {
        const error = await response.json()
        console.error('[Belum Ujian Page] API error:', error)
      }
    } catch (error) {
      console.error('[Belum Ujian Page] Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (data: BelumUjianData) => {
    setSelectedJadwal(data)
    setFilteredPeserta(data.pesertaBelumUjian)
  }

  const getStatusColor = (belum: number, total: number) => {
    if (belum === 0) return 'bg-green-500'
    if (belum === total) return 'bg-red-500'
    return 'bg-yellow-500'
  }

  const getPercentage = (belum: number, total: number) => {
    if (total === 0) return 0
    return Math.round((belum / total) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Peserta Belum Ujian</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Monitoring peserta yang belum mengikuti ujian</p>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Jadwal Ujian</CardTitle>
          <CardDescription>Klik "Detail" untuk melihat daftar peserta yang belum ujian</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={dataList}
            columns={[
              {
                header: 'Nama Ujian',
                accessor: 'jadwal',
                cell: (row) => (
                  <div>
                    <div className="font-semibold">{row.jadwal.namaUjian}</div>
                    <div className="text-sm text-gray-500">{row.jadwal.bankSoalKode || '-'}</div>
                  </div>
                ),
              },
              {
                header: 'Kelas',
                accessor: 'jadwal',
                cell: (row) => (
                  <Badge variant="outline">{row.jadwal.kelasName}</Badge>
                ),
              },
              {
                header: 'Tanggal',
                accessor: 'jadwal',
                cell: (row) => {
                  try {
                    const date = row.jadwal.tanggalUjian ? new Date(row.jadwal.tanggalUjian) : null;
                    return (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{date && !isNaN(date.getTime()) ? format(date, 'dd MMM yyyy', { locale: localeId }) : '-'}</span>
                      </div>
                    );
                  } catch (e) {
                    return <span className="text-gray-400">-</span>;
                  }
                },
              },
              {
                header: 'Waktu',
                accessor: 'jadwal',
                cell: (row) => {
                  try {
                    const time = row.jadwal.waktuMulai ? new Date(row.jadwal.waktuMulai) : null;
                    return (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{time && !isNaN(time.getTime()) ? format(time, 'HH:mm', { locale: localeId }) : '-'} ({row.jadwal.durasi} menit)</span>
                      </div>
                    );
                  } catch (e) {
                    return <span className="text-gray-400">-</span>;
                  }
                },
              },
              {
                header: 'Status Peserta',
                accessor: 'belumUjian',
                cell: (row) => (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">Sudah: {row.sudahUjian}</span>
                          <span className="font-medium">Belum: {row.belumUjian}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              row.belumUjian === 0 ? 'bg-green-500' : 
                              row.sudahUjian === 0 ? 'bg-red-500' : 
                              'bg-yellow-500'
                            }`}
                            style={{ width: `${((row.totalPeserta - row.belumUjian) / row.totalPeserta) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Total: {row.totalPeserta} peserta ({getPercentage(row.belumUjian, row.totalPeserta)}% belum)
                    </div>
                  </div>
                ),
              },
              {
                header: 'Status',
                accessor: 'jadwal',
                cell: (row) => (
                  <Badge className={row.jadwal.isActive ? 'bg-green-500' : 'bg-gray-400'}>
                    {row.jadwal.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                ),
              },
              {
                header: 'Aksi',
                accessor: () => null,
                cell: (row) => (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetail(row)}
                    disabled={row.belumUjian === 0}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detail ({row.belumUjian})
                  </Button>
                ),
                className: 'text-right',
              },
            ]}
            searchPlaceholder="Cari ujian..."
            searchKeys={['jadwal.namaUjian', 'jadwal.kelasName', 'jadwal.bankSoalKode']}
            filters={[
              {
                key: 'jadwal.kelasName',
                label: 'Kelas',
                options: [...new Set(dataList.map(d => d.jadwal.kelasName))].map(kelas => ({
                  value: kelas,
                  label: kelas,
                })),
              },
              {
                key: 'jadwal.isActive',
                label: 'Status',
                options: [
                  { value: 'true', label: 'Aktif' },
                  { value: 'false', label: 'Nonaktif' },
                ],
              },
            ]}
            emptyMessage={
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Belum ada data jadwal ujian</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedJadwal} onOpenChange={() => setSelectedJadwal(null)}>
        <DialogContent 
          className="max-h-[85vh] overflow-hidden flex flex-col p-0"
          style={{ width: '95vw', maxWidth: '1800px' }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Peserta Belum Ujian</DialogTitle>
            <DialogDescription>
              Daftar peserta yang belum mengikuti ujian {selectedJadwal?.jadwal.namaUjian}
            </DialogDescription>
          </DialogHeader>
          
          {/* Compact Header */}
          <div className="px-6 py-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Peserta Belum Ujian</h3>
                <p className="text-sm text-gray-600 mt-0.5">{selectedJadwal?.jadwal.namaUjian} • {selectedJadwal?.jadwal.kelasName}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-xl font-bold text-gray-900">{selectedJadwal?.totalPeserta}</div>
                </div>
                <div className="text-center px-4 py-2 bg-orange-50 rounded-lg">
                  <div className="text-xs text-orange-600">Belum</div>
                  <div className="text-xl font-bold text-orange-600">{selectedJadwal?.belumUjian}</div>
                </div>
                <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-600">Sudah</div>
                  <div className="text-xl font-bold text-green-600">{selectedJadwal?.sudahUjian}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Search and Filter */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cari nama atau no. ujian..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  if (!searchTerm) {
                    setFilteredPeserta(selectedJadwal?.pesertaBelumUjian || []);
                  } else {
                    setFilteredPeserta(
                      (selectedJadwal?.pesertaBelumUjian || []).filter(
                        p => p.name.toLowerCase().includes(searchTerm) || 
                             p.noUjian.toLowerCase().includes(searchTerm)
                      )
                    );
                  }
                }}
              />
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                onChange={(e) => {
                  const kelas = e.target.value;
                  if (!kelas) {
                    setFilteredPeserta(selectedJadwal?.pesertaBelumUjian || []);
                  } else {
                    setFilteredPeserta(
                      (selectedJadwal?.pesertaBelumUjian || []).filter(p => p.kelasName === kelas)
                    );
                  }
                }}
              >
                <option value="">Semua Kelas</option>
                {[...new Set((selectedJadwal?.pesertaBelumUjian || []).map(p => p.kelasName || '-'))].map(kelas => (
                  <option key={kelas} value={kelas}>{kelas}</option>
                ))}
              </select>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                onChange={(e) => {
                  const status = e.target.value;
                  if (!status) {
                    setFilteredPeserta(selectedJadwal?.pesertaBelumUjian || []);
                  } else {
                    const isActive = status === 'true';
                    setFilteredPeserta(
                      (selectedJadwal?.pesertaBelumUjian || []).filter(p => p.isActive === isActive)
                    );
                  }
                }}
              >
                <option value="">Semua Status</option>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Compact Table View */}
          <div className="flex-1 overflow-y-auto">
            {filteredPeserta.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Tidak ada peserta yang belum ujian</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Ujian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Peserta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPeserta.map((peserta, index) => (
                    <tr key={peserta.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-sm font-mono font-medium text-gray-900">{peserta.noUjian}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm font-medium text-gray-900">{peserta.name}</span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{peserta.kelasName || '-'}</span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <Badge className={peserta.isActive ? 'bg-green-500' : 'bg-red-500'}>
                          {peserta.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Compact Footer */}
          <div className="px-6 py-3 border-t bg-white">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Menampilkan <span className="font-semibold">{filteredPeserta.length}</span> dari <span className="font-semibold">{selectedJadwal?.belumUjian}</span> peserta
              </span>
              <Button variant="outline" size="sm" onClick={() => setSelectedJadwal(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
