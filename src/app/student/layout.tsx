'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import StudentSidebar from '@/components/layout/StudentSidebar'
import StudentNavbar from '@/components/layout/StudentNavbar'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Set initial state based on screen size
  useEffect(() => {
    // Set initial state on mount
    if (window.innerWidth >= 1024) {
      setIsMobileMenuOpen(true)
    }
  }, [])

  useEffect(() => {
    const peserta = localStorage.getItem('peserta')
    if (!peserta) {
      router.push('/login')
    }
  }, [router, pathname])

  return (
    <div className="flex min-h-screen max-h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <StudentNavbar 
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isSidebarOpen={isMobileMenuOpen}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 pt-20 lg:p-8 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
