'use client'

import { Menu, User, LogOut, UserCircle, Settings, ChevronDown, LayoutDashboard, Database, FileText, ClipboardList, Award, BookOpen, GraduationCap, School, BookMarked, Users, Calendar, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface SubMenuItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface MenuItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  submenu?: SubMenuItem[]
  href?: string
}

const getMenuItems = (role?: string): MenuItem[] => {
  const baseMenuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin'
    }
  ]

  if (role === 'ADMIN') {
    return [
      ...baseMenuItems,
      {
        title: 'Data Master',
        icon: Database,
        submenu: [
          { title: 'Jurusan', href: '/admin/data-master/jurusan', icon: GraduationCap },
          { title: 'Kelas', href: '/admin/data-master/kelas', icon: School },
          { title: 'Mata Pelajaran', href: '/admin/data-master/mata-pelajaran', icon: BookMarked },
          { title: 'Peserta', href: '/admin/data-master/peserta', icon: Users },
          { title: 'User', href: '/admin/data-master/user', icon: Users }
        ]
      },
      {
        title: 'Persiapan',
        icon: FileText,
        submenu: [
          { title: 'Bank Soal', href: '/admin/persiapan/bank-soal', icon: BookOpen }
        ]
      },
      {
        title: 'Pelaksanaan',
        icon: ClipboardList,
        submenu: [
          { title: 'Jadwal', href: '/admin/pelaksanaan/jadwal', icon: Calendar },
          { title: 'Monitoring', href: '/admin/pelaksanaan/monitoring', icon: Users }
        ]
      },
      {
        title: 'Hasil Ujian',
        icon: Award,
        submenu: [
          { title: 'Hasil', href: '/admin/hasil-ujian/hasil', icon: ClipboardList },
          { title: 'Belum Ujian', href: '/admin/hasil-ujian/belum-ujian', icon: Users }
        ]
      },
      {
        title: 'Settings',
        icon: Settings,
        submenu: [
          { title: 'Exam Browser Settings', href: '/admin/settings/exam-browser', icon: Shield }
        ]
      }
    ]
  }

  return [
    ...baseMenuItems,
    {
      title: 'Persiapan',
      icon: FileText,
      submenu: [
        { title: 'Bank Soal', href: '/admin/persiapan/bank-soal', icon: BookOpen }
      ]
    },
    {
      title: 'Pelaksanaan',
      icon: ClipboardList,
      submenu: [
        { title: 'Jadwal', href: '/admin/pelaksanaan/jadwal', icon: Calendar }
      ]
    },
    {
      title: 'Hasil Ujian',
      icon: Award,
      submenu: [
        { title: 'Hasil', href: '/admin/hasil-ujian/hasil', icon: ClipboardList },
        { title: 'Belum Ujian', href: '/admin/hasil-ujian/belum-ujian', icon: Users }
      ]
    }
  ]
}

export default function AdminNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      setMenuItems(getMenuItems(userData.role))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/adm')
  }

  const isActive = (href: string) => pathname === href

  return (
    <nav className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left: Logo & Menu */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2">
            <div className="bg-blue-600 text-white rounded-lg p-2">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-gray-800 leading-tight">CBT Admin</h1>
              <p className="text-xs text-gray-500">Computer Based Test</p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1 ml-4">
            {menuItems.map((item) => (
              <div key={item.title}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {item.submenu?.map((subItem) => (
                        <DropdownMenuItem key={subItem.href} asChild>
                          <Link
                            href={subItem.href}
                            className={cn(
                              'flex items-center gap-2 cursor-pointer',
                              isActive(subItem.href) && 'bg-blue-50 text-blue-600'
                            )}
                          >
                            <subItem.icon className="h-4 w-4" />
                            <span>{subItem.title}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Mobile Menu & User Dropdown */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6 text-gray-700" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu Navigasi</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {menuItems.map((item) => (
                  <div key={item.title} className="space-y-1">
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          isActive(item.href)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                        <div className="ml-4 space-y-1">
                          {item.submenu?.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                isActive(subItem.href)
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 hover:bg-gray-100'
                              )}
                            >
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                <User className="h-5 w-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {user?.name || 'Admin'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{user?.name || 'Admin'}</span>
                  <span className="text-xs text-gray-500 font-normal">{user?.email || '-'}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Pengaturan</span>
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
  )
}
