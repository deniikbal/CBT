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

  useEffect(() => {
    const peserta = localStorage.getItem('peserta')
    if (!peserta) {
      router.push('/login')
    }
  }, [router, pathname])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentNavbar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <StudentSidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <main className="flex-1 lg:ml-0">
        {children}
      </main>
    </div>
  )
}
