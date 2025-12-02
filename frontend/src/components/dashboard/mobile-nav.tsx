"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/use-language"
import {
    LayoutDashboard,
    MapPin,
    Satellite,
    MessageSquare,
    Settings,
} from "lucide-react"

export function MobileNav() {
    const pathname = usePathname()
    const { t } = useTranslation()

    const navItems = [
        {
            href: "/dashboard",
            icon: LayoutDashboard,
            labelKey: "navigation.dashboard",
        },
        {
            href: "/dashboard/fields",
            icon: MapPin,
            labelKey: "navigation.fields",
        },
        {
            href: "/dashboard/satellite",
            icon: Satellite,
            labelKey: "navigation.satellite",
        },
        {
            href: "/dashboard/ai-assistant",
            icon: MessageSquare,
            labelKey: "navigation.ai_assistant",
        },
        {
            href: "/dashboard/settings",
            icon: Settings,
            labelKey: "navigation.settings",
        },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 block border-t border-border/40 bg-background/80 backdrop-blur-lg md:hidden">
            <nav className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-1 transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">
                                {t(item.labelKey as any)}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
