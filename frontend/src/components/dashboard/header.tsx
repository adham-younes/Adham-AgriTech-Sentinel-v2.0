"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, LogOut, User, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { MobileMenu } from "./mobile-menu"
import { useTranslation } from "@/lib/i18n/use-language"

interface HeaderProps {
  user: any
  profile: any
}

export function DashboardHeader({ user, profile }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "U"

  const greetingName = profile?.full_name || t("dashboard_header.fallback_name")
  const roleKey =
    profile?.role === "farmer"
      ? "farmer"
      : profile?.role === "engineer"
        ? "engineer"
        : profile?.role === "manager"
          ? "manager"
          : "default"

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b border-white/5 bg-background/40 backdrop-blur-xl px-3 sm:px-6 shadow-3d gap-3 sm:gap-4">
      <MobileMenu user={user} profile={profile} />

      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent truncate">
          {t("dashboard_header.welcome", { values: { name: greetingName } })}
        </h1>
        <span className="hidden sm:inline-block rounded-full bg-primary/20 px-2 sm:px-3 py-1 text-xs font-medium text-primary border border-primary/30 shadow-glow whitespace-nowrap">
          {t(`dashboard_header.role.${roleKey}`)}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-green-500/10 transition-all duration-300 hover:shadow-glow h-9 w-9 sm:h-10 sm:w-10"
          aria-label={t("dashboard_header.notifications")}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute right-1 top-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary shadow-glow" />
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 hover:bg-green-500/10 transition-all duration-300 h-9 sm:h-10">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border-2 border-primary/30 shadow-glow">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm">{profile?.full_name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56 glass-card border-white/10">
            <DropdownMenuLabel>{t("dashboard_header.menu.account")}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-green-500/20" />
            <DropdownMenuItem className="hover:bg-green-500/10">
              <User className="ml-2 h-4 w-4" />
              <span>{t("dashboard_header.menu.profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-green-500/10">
              <Settings className="ml-2 h-4 w-4" />
              <span>{t("dashboard_header.menu.settings")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-green-500/20" />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive hover:bg-destructive/10">
              <LogOut className="ml-2 h-4 w-4" />
              <span>{t("dashboard_header.menu.sign_out")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
