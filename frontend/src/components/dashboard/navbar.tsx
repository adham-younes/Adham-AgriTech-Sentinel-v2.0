"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/use-language"
import {
    LayoutDashboard,
    Sprout,
    MapPin,
    MessageSquare,
    Bell,
    Settings,
    Satellite,
    Cloud,
    ChevronDown,
    Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface NavbarProps {
    user: any
    profile: any
}

type NavStatus = "live" | "beta"

const navStatusTokens: Record<NavStatus, { en: string; ar: string; className: string }> = {
    live: { en: "Live", ar: "نشط", className: "border-emerald-400/60 text-emerald-200" },
    beta: { en: "Beta", ar: "تجريبي", className: "border-amber-400/60 text-amber-200" },
}

const navigationItems = {
    dashboard: { translationKey: "navigation.dashboard", href: "/dashboard", icon: LayoutDashboard },
    farms: { translationKey: "navigation.farms", href: "/dashboard/farms", icon: Sprout },
    fields: { translationKey: "navigation.fields", href: "/dashboard/fields", icon: MapPin },
    satellite: { translationKey: "navigation.satellite", href: "/dashboard/satellite", icon: Satellite, status: "live" as NavStatus },
    ai: { translationKey: "navigation.ai_assistant", href: "/dashboard/ai-assistant", icon: MessageSquare, status: "live" as NavStatus },
    weather: { translationKey: "navigation.weather", href: "/dashboard/weather", icon: Cloud },
    notifications: { translationKey: "navigation.notifications", href: "/dashboard/notifications", icon: Bell },
}

const navGroups = [
    { id: "overview", titleKey: "navigation_groups.overview", items: ["dashboard", "satellite", "ai"] },
    { id: "operations", titleKey: "navigation_groups.operations", items: ["farms", "fields"] },
    { id: "insights", titleKey: "navigation_groups.insights", items: ["weather"] },
    // Engagement (Notifications) kept separate or in utility menu
]

export function DashboardNavbar({ user, profile }: NavbarProps) {
    const pathname = usePathname()
    const { t, language } = useTranslation()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push("/auth/login")
    }

    const initials = profile?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"

    return (
        <nav className="hidden md:flex h-16 items-center justify-between border-b border-white/5 bg-background/60 backdrop-blur-xl px-6 shadow-sm z-50">
            {/* 1. Logo Section */}
            <div className="flex items-center gap-2">
                <div className="glow-primary flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg">
                    <Sprout className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight">{t("branding.name")}</span>
                </div>
            </div>

            {/* 2. Horizontal Navigation Links (Central) */}
            <div className="flex items-center gap-1">
                {navGroups.map((group) => {
                    return (
                        <DropdownMenu key={group.id}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2 h-9 text-muted-foreground hover:text-primary hover:bg-primary/10 data-[state=open]:bg-primary/10 data-[state=open]:text-primary transition-all">
                                    <span>{t(group.titleKey)}</span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-56 glass-card border-white/10 mt-2">
                                {group.items.map((key) => {
                                    const item = navigationItems[key as keyof typeof navigationItems]
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <Link key={key} href={item.href} passHref>
                                            <DropdownMenuItem className={cn("cursor-pointer gap-2 py-2.5", isActive && "bg-primary/20 text-primary focus:bg-primary/20")}>
                                                <Icon className="h-4 w-4" />
                                                <span className="flex-1">{t(item.translationKey)}</span>
                                                {/* Status Badge */}
                                                {(item as any).status && (
                                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border uppercase", navStatusTokens[(item as any).status as keyof typeof navStatusTokens].className)}>
                                                        {language === 'ar' ? navStatusTokens[(item as any).status as keyof typeof navStatusTokens]?.ar : navStatusTokens[(item as any).status as keyof typeof navStatusTokens]?.en}
                                                    </span>
                                                )}
                                            </DropdownMenuItem>
                                        </Link>
                                    )
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )
                })}
                {/* Direct Link for Notifications */}
                <Link href="/dashboard/notifications">
                    <Button variant="ghost" size="icon" className={cn("h-9 w-9", pathname === '/dashboard/notifications' && "text-primary bg-primary/10")}>
                        <Bell className="h-4 w-4" />
                    </Button>
                </Link>
            </div>

            {/* 3. User Actions (Right) */}
            <div className="flex items-center gap-3">
                {/* Settings Link */}
                <Link href="/dashboard/settings">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
                        <Settings className="h-5 w-5" />
                    </Button>
                </Link>

                {/* User Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2 pl-2 pr-4 h-10 rounded-full hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all">
                            <Avatar className="h-7 w-7 border border-primary/30">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-xs">
                                <span className="font-semibold">{profile?.full_name}</span>
                                <span className="text-muted-foreground opacity-70 capitalize">{profile?.role || "Farmer"}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 glass-card border-white/10">
                        <DropdownMenuLabel>{t("dashboard_header.menu.account")}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                            <Settings className="mr-2 h-4 w-4" /> {t("dashboard_header.menu.settings")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400 focus:bg-red-900/20">
                            <LogOut className="mr-2 h-4 w-4" /> {t("dashboard_header.menu.sign_out")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    )
}
