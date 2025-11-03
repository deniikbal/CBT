'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, Column } from '@/components/ui/data-table'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export default function UserPage() {
  const [userList, setUserList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    email: '', 
    name: '', 
    password: '', 
    role: 'USER' 
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/user')
      if (response.ok) {
        const data = await response.json()
        setUserList(data)
      } else {
        toast.error('Gagal memuat data user')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId ? `/api/user/${editingId}` : '/api/user'
      const method = editingId ? 'PUT' : 'POST'
      
      const body: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role
      }

      // Only include password if it's provided
      if (formData.password) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchUsers()
        setIsDialogOpen(false)
        resetForm()
        toast.success(editingId ? 'User berhasil diupdate' : 'User berhasil ditambahkan')
      } else {
        toast.error(data.error || 'Terjadi kesalahan saat menyimpan data')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleEdit = (user: User) => {
    setEditingId(user.id)
    setFormData({ 
      email: user.email, 
      name: user.name, 
      password: '', 
      role: user.role 
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return

    try {
      const response = await fetch(`/api/user/${id}`, { method: 'DELETE' })
      const data = await response.json()
      
      if (response.ok) {
        await fetchUsers()
        toast.success('User berhasil dihapus')
      } else {
        toast.error(data.error || 'Gagal menghapus user')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan saat menghapus data')
    }
  }

  const resetForm = () => {
    setFormData({ email: '', name: '', password: '', role: 'USER' })
    setEditingId(null)
    setShowPassword(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Data User</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola data user sistem</p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) resetForm()
      }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Daftar User</CardTitle>
              <CardDescription>Total: {userList.length} user</CardDescription>
            </div>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah User
              </Button>
            </DialogTrigger>
          </CardHeader>
        <CardContent>
          <DataTable
            data={userList}
            filters={[
              {
                key: 'role',
                label: 'Role',
                options: [
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'USER', label: 'User' },
                ],
              },
            ]}
            columns={[
              {
                header: 'No',
                accessor: 'id',
                cell: (row, index) => index + 1,
                className: 'w-16',
              },
              {
                header: 'Email',
                accessor: 'email',
                cell: (row) => <span className="font-medium">{row.email}</span>,
              },
              {
                header: 'Nama',
                accessor: 'name',
              },
              {
                header: 'Role',
                accessor: 'role',
                cell: (row) => (
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    row.role === 'ADMIN' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {row.role}
                  </span>
                ),
              },
              {
                header: 'Aksi',
                accessor: () => null,
                cell: (row) => (
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ),
                className: 'text-right',
              },
            ]}
            searchPlaceholder="Cari user..."
            searchKeys={['email', 'name', 'role']}
            emptyMessage="Belum ada data user"
          />
        </CardContent>
      </Card>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit User' : 'Tambah User'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Edit data user' : 'Tambah user baru ke sistem'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contoh@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                placeholder="Nama lengkap"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingId && <span className="text-xs text-gray-500">(biarkan kosong jika tidak ingin ubah)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={editingId ? 'Biarkan kosong jika tidak diubah' : 'Masukkan password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingId}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingId ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
