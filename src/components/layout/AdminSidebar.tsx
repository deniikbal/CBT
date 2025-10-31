'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ChevronDown, 
  Database, 
  BookOpen, 
  FileText,
  Users,
  GraduationCap,
  School,
  BookMarked,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

  // Role ADMIN: akses semua menu
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
          { title: 'Hasil', href: '/admin/hasil-ujian/hasil', icon: ClipboardList }
        ]
      }
    ]
  }

  // Role USER: akses terbatas ke Bank Soal, Jadwal, dan Hasil Ujian
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
        { title: 'Hasil', href: '/admin/hasil-ujian/hasil', icon: ClipboardList }
      ]
    }
  ]
}

interface AdminSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => pathname === href

  // Load user and set menu items based on role
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setCurrentUser(user)
      setMenuItems(getMenuItems(user.role))
    }
  }, [])

  // Close sidebar when route changes on mobile only
  useEffect(() => {
    // Only auto-close on mobile
    const handleRouteChange = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false)
      }
    }
    handleRouteChange()
  }, [pathname, setIsOpen])

  return (
    <>
      {/* Overlay - only on mobile when sidebar is open */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white text-gray-800 flex flex-col border-r shadow-sm transition-transform duration-300 ease-in-out",
        "lg:static lg:inset-auto lg:transform-none lg:w-64",
        isOpen
          ? "translate-x-0"
          : "-translate-x-full lg:w-0 lg:min-w-0 lg:border-0 lg:opacity-0"
      )}>
        {/* Logo/Header */}
        <div className="h-16 px-6 border-b border-gray-200 flex items-center shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-800">CBT Admin</h1>
            <p className="text-xs text-gray-500">Computer Based Test</p>
          </div>
        </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.href ? (
              // Single menu item (no submenu)
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            ) : (
              // Menu with submenu
              <div>
                <button
                  onClick={() => toggleMenu(item.title)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      openMenus.includes(item.title) && 'rotate-180'
                    )}
                  />
                </button>

                {/* Submenu */}
                {openMenus.includes(item.title) && item.submenu && (
                  <div className="mt-1 ml-4 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors',
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
                )}
              </div>
            )}
          </div>
        ))}
      </nav>
      </div>
    </>
  )
}
