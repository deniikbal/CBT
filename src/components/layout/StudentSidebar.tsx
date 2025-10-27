'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  FileText,
  ClipboardCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/student/dashboard'
  },
  {
    title: 'Ujian Saya',
    icon: FileText,
    href: '/student/ujian'
  },
  {
    title: 'Riwayat Ujian',
    icon: ClipboardCheck,
    href: '/student/riwayat'
  }
]

interface StudentSidebarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export default function StudentSidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: StudentSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200 mt-14 lg:mt-0">
        <h1 className="text-xl font-bold text-gray-800">CBT Student</h1>
        <p className="text-sm text-gray-600 mt-1">Computer Based Test</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium',
              isActive(item.href)
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>

      {/* Footer - Removed logout, moved to navbar */}
    </div>
    </>
  )
}
