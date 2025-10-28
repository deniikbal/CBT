'use client'

import { Menu, User, Bell, LogOut, UserCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface StudentNavbarProps {
  onMenuClick: () => void
  isSidebarOpen: boolean
}

export default function StudentNavbar({ onMenuClick, isSidebarOpen }: StudentNavbarProps) {
  const router = useRouter()
  const [peserta, setPeserta] = useState<any>(null)

  useEffect(() => {
    const storedPeserta = localStorage.getItem('peserta')
    if (storedPeserta) {
      setPeserta(JSON.parse(storedPeserta))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('peserta')
    router.push('/login')
  }

  return (
    <>
    {/* Mobile Navbar */}
    <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full flex items-center justify-between px-4">
        {/* Left: Hamburger Menu */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>

        {/* Center: Logo/Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-800">CBT Student</h1>
        </div>

        {/* Right: User Info */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <Bell className="h-5 w-5 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <User className="h-5 w-5 text-gray-700" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{peserta?.name || 'Peserta'}</span>
                  <span className="text-xs text-gray-500 font-normal">{peserta?.noUjian || '-'}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profil Saya</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>

    {/* Desktop Navbar - Top bar only */}
    <nav className="hidden lg:block sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left: Hamburger Menu */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>

        {/* Right: User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <User className="h-5 w-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">{peserta?.name || 'Peserta'}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">{peserta?.name || 'Peserta'}</span>
                <span className="text-xs text-gray-500 font-normal">{peserta?.noUjian || '-'}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profil Saya</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
    </>
  )
}
