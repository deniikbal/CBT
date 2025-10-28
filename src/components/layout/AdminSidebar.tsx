'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Settings,
  LogOut,
  Calendar,
  ClipboardList
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

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin'
  },
  {
    title: 'Data Master',
    icon: Database,
    submenu: [
      { title: 'Jurusan', href: '/admin/data-master/jurusan', icon: GraduationCap },
      { title: 'Kelas', href: '/admin/data-master/kelas', icon: School },
      { title: 'Mata Pelajaran', href: '/admin/data-master/mata-pelajaran', icon: BookMarked },
      { title: 'Peserta', href: '/admin/data-master/peserta', icon: Users }
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
  }
]

interface AdminSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [openMenus, setOpenMenus] = useState<string[]>(['Data Master', 'Persiapan', 'Pelaksanaan'])

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => pathname === href

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/adm')
  }

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
        "fixed lg:sticky inset-y-0 lg:inset-y-auto left-0 top-0 z-50 w-64 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out overflow-y-auto",
        // Mobile: always use translate
        // Desktop: use width/margin approach
        isOpen 
          ? "translate-x-0 lg:translate-x-0" 
          : "-translate-x-full lg:translate-x-0 lg:w-0 lg:min-w-0 lg:border-0 lg:opacity-0"
      )}>
        {/* Logo/Header */}
        <div className="h-16 px-6 border-b border-slate-700 flex items-center shrink-0">
          <div>
            <h1 className="text-lg font-bold">CBT Admin</h1>
            <p className="text-xs text-slate-400">Computer Based Test</p>
          </div>
        </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
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
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
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
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <Settings className="h-5 w-5" />
            <span>Pengaturan</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </>
  )
}
