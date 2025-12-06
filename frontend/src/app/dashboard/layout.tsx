import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { DashboardNavbar } from "@/components/dashboard/navbar" // New Navbar
import { resolveActiveProfile } from "@/lib/supabase/demo-session"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { MobileNav } from "@/components/dashboard/mobile-nav"

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { user, profile } = await resolveActiveProfile(supabase)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* 1. Desktop Horizontal Navbar (Replaces Sidebar & Header) */}
      <DashboardNavbar user={user} profile={profile} />

      {/* 2. Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <ErrorBoundary>
          <main className="h-full overflow-y-auto p-3 pb-24 sm:p-4 md:p-6">{children}</main>
        </ErrorBoundary>

        {/* 3. Mobile Navigation (Bottom) */}
        <MobileNav />
      </div>
    </div>
  )
}
