'use client'

import AdminNavbar from '@/components/layout/AdminNavbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="flex-1">
        <div className="p-4 sm:p-6 md:p-8 max-w-[1920px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
