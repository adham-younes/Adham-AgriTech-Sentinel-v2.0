import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { resolveActiveProfile } from "@/lib/supabase/demo-session"
import { ErrorBoundary } from "@/components/ui/error-boundary"

import { MobileNav } from "@/components/dashboard/mobile-nav"

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { user, profile } = await resolveActiveProfile(supabase)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex md:w-64 md:flex-col">
        <DashboardSidebar user={user} profile={profile} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader user={user} profile={profile} />
        {/* Add pb-20 on mobile to account for the fixed bottom nav */}
        <ErrorBoundary>
          <main className="flex-1 overflow-y-auto p-3 pb-20 sm:p-4 md:p-6 md:pb-6">{children}</main>
        </ErrorBoundary>
        <MobileNav />
      </div>
    </div>
  )
}
