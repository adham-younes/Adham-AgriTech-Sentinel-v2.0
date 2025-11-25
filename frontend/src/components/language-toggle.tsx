"use client"

import { useLanguage } from "@/lib/i18n/use-language"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export default function LanguageToggle() {
  const { language, toggleLanguage, ready } = useLanguage()

  if (!ready) {
    return null
  }

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      size="sm"
      className="gap-2 glass-card border-primary/30 hover:border-primary/60 hover:scale-105 transition-all duration-300 bg-transparent"
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs sm:text-sm">{language === "ar" ? "English" : "العربية"}</span>
    </Button>
  )
}
