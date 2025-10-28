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

  // Close sidebar when route changes on mobile only
  useEffect(() => {
    // Only auto-close on mobile
    const handleRouteChange = () => {
      if (window.innerWidth < 1024) {
        setIsMobileMenuOpen(false)
      }
    }
    handleRouteChange()
  }, [pathname, setIsMobileMenuOpen])

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
      {/* Overlay - only on mobile when sidebar is open */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:sticky inset-y-0 lg:inset-y-auto left-0 top-0 z-50 w-64 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-lg lg:shadow-none overflow-y-auto",
        // Mobile: always use translate
        // Desktop: use width/margin approach
        isMobileMenuOpen 
          ? "translate-x-0 lg:translate-x-0" 
          : "-translate-x-full lg:translate-x-0 lg:w-0 lg:min-w-0 lg:border-0 lg:opacity-0"
      )}>
      {/* Logo/Header */}
      <div className="h-16 px-6 border-b border-gray-200 mt-16 lg:mt-0 flex items-center shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Computer Based Test</h1>
        </div>
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
