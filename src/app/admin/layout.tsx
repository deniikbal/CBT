'use client'

import AdminNavbar from '@/components/layout/AdminNavbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50 overflow-hidden">
      <AdminNavbar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4 sm:p-6 md:p-8 max-w-[1920px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
