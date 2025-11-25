"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sprout, Menu, X, LogOut, LogIn } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "@/lib/i18n/use-language"
import { createClient } from "@/lib/supabase/client"

export function TopNav() {
  const pathname = usePathname()
  const { t, language, toggleLanguage } = useTranslation()
  const isDashboard = pathname?.startsWith("/dashboard")
  const [open, setOpen] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!mounted) return
        setUserName(user?.email ?? null)
      } catch {
        setUserName(null)
      } finally {
        if (mounted) setAuthChecked(true)
      }
    }
    void loadUser()
    return () => {
      mounted = false
    }
  }, [supabase])

  if (isDashboard) return null

  const showPartners = process.env.NEXT_PUBLIC_SHOW_PARTNERS === "true"

  const links: Array<{ href: string; label: string } | null> = [
    { href: "/", label: language === "ar" ? "الرئيسية" : "Home" },
    { href: "/dashboard", label: t("navigation.dashboard") },
    {
      href: "/knowledge-hub",
      label: language === "ar" ? "ثورة الزراعة الرقمية" : "Digital Agriculture Revolution",
    },
    { href: "/dashboard/services", label: t("navigation.services") },
    showPartners ? { href: "/partners", label: t("navigation.partners") } : null,
    { href: "/about", label: language === "ar" ? "الرؤية" : "Vision" },
    { href: "/about#vision-team", label: language === "ar" ? "منظور المؤسس" : "Founder Lens" },
  ]

  const authAction = authChecked ? (
    userName ? (
      <Link
        href="/auth/logout"
        className="flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/30 hover:text-primary"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>{language === "ar" ? "تسجيل الخروج" : "Sign out"}</span>
      </Link>
    ) : (
      <Link
        href="/auth/login"
        className="flex items-center gap-1 rounded-md border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary transition hover:border-primary/60 hover:text-primary/90"
      >
        <LogIn className="h-3.5 w-3.5" />
        <span>{language === "ar" ? "تسجيل الدخول" : "Sign in"}</span>
      </Link>
    )
  ) : null

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="text-base sm:text-lg font-semibold">{t("branding.name")}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {links.filter(Boolean).map((item) => (
            <Link
              key={item!.href}
              href={item!.href}
              className={`rounded-md px-3 py-1.5 transition-colors hover:text-primary ${
                pathname === item!.href ? "text-primary" : "text-white/80"
              }`}
            >
              {item!.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleLanguage}
            className="ml-2 rounded-md border border-white/10 px-2 py-1 text-xs text-white/80 hover:text-primary"
            aria-label={language === "ar" ? "English" : "العربية"}
          >
            {language === "ar" ? "EN" : "ع"}
          </button>
          {authAction}
        </nav>

        {/* Mobile toggles */}
        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/80 hover:text-primary"
            aria-label={language === "ar" ? "English" : "العربية"}
          >
            {language === "ar" ? "EN" : "ع"}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-white/10 p-2 text-white/80 hover:text-primary"
            aria-label={open ? (language === "ar" ? "إغلاق القائمة" : "Close menu") : (language === "ar" ? "فتح القائمة" : "Open menu")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-black/85 backdrop-blur-xl">
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-2 text-sm">
            {links.filter(Boolean).map((item) => (
              <Link
                key={item!.href}
                href={item!.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 transition-colors hover:text-primary ${
                  pathname === item!.href ? "text-primary" : "text-white/80"
                }`}
              >
                {item!.label}
              </Link>
            ))}
            {authChecked && (
              <div className="pt-2">
                {userName ? (
                  <Link
                    href="/auth/logout"
                    onClick={() => setOpen(false)}
                    className="block rounded-md border border-white/10 px-3 py-2 text-white/80 hover:text-primary"
                  >
                    {language === "ar" ? "تسجيل الخروج" : "Sign out"}
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-md border border-white/10 px-3 py-2 text-white/80 hover:text-primary"
                  >
                    {language === "ar" ? "تسجيل الدخول" : "Sign in"}
                  </Link>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
