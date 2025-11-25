"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Sprout,
  MapPin,
  Droplets,
  Cloud,
  MessageSquare,
  Bell,
  FileText,
  ShoppingCart,
  Users,
  Settings,
  BrainCircuit,
  Handshake,
  Activity,
  Satellite,
  Code,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/use-language"

interface MobileMenuProps {
  user: any
  profile: any
}

const navigation = [
  { translationKey: "navigation.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { translationKey: "navigation.satellite", href: "/dashboard/satellite", icon: Satellite },
  { translationKey: "navigation.farms", href: "/dashboard/farms", icon: Sprout },
  { translationKey: "navigation.fields", href: "/dashboard/fields", icon: MapPin },
  { translationKey: "navigation.soil_analysis", href: "/dashboard/soil-analysis", icon: Droplets },
  { translationKey: "navigation.crop_monitoring", href: "/dashboard/crop-monitoring", icon: Sprout },
  { translationKey: "navigation.weather", href: "/dashboard/weather", icon: Cloud },
  { translationKey: "navigation.irrigation", href: "/dashboard/irrigation", icon: Droplets },
  { translationKey: "navigation.ai_assistant", href: "/dashboard/ai-assistant", icon: MessageSquare },
  { translationKey: "navigation.agronomy_insights", href: "/dashboard/agronomy-insights", icon: BrainCircuit },
  { translationKey: "navigation.reports", href: "/dashboard/reports", icon: FileText },
  { translationKey: "navigation.notifications", href: "/dashboard/notifications", icon: Bell },
  { translationKey: "navigation.marketplace", href: "/dashboard/marketplace", icon: ShoppingCart },
  { translationKey: "navigation.forum", href: "/dashboard/forum", icon: Users },
  { translationKey: "navigation.services", href: "/dashboard/services", icon: Activity },
  { translationKey: "navigation.satellite", href: "/dashboard/satellite", icon: Satellite },
  { translationKey: "navigation.features", href: "/dashboard/features", icon: Code },
  { translationKey: "navigation.partners", href: "/partners", icon: Handshake },
]

export function MobileMenu({ user, profile }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden hover:bg-white/5 transition-all duration-300"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed right-0 top-16 z-50 h-[calc(100dvh-4rem)] w-64 border-l border-sidebar-border bg-sidebar overflow-y-auto transition-transform duration-300 md:hidden pb-safe",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav className="space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg glow-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{t(item.translationKey)}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <Link
            href="/dashboard/settings"
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              pathname === "/dashboard/settings"
                ? "bg-primary text-primary-foreground shadow-lg glow-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-accent-foreground",
            )}
          >
            <Settings className="h-5 w-5" />
            <span>{t("navigation.settings")}</span>
          </Link>
        </div>
      </div>
    </>
  )
}
