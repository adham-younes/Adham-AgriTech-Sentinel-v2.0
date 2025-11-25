'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const BANNER_STORAGE_KEY = 'adham-pwa-install-banner-dismissed'

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [hasSeen, setHasSeen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(BANNER_STORAGE_KEY)
      if (stored === 'true') {
        setHasSeen(true)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = (event: Event) => {
      // Only prevent default if we haven't seen the banner yet
      if (!hasSeen) {
        event.preventDefault()
        setDeferredPrompt(event as BeforeInstallPromptEvent)
      }
    }

    window.addEventListener('beforeinstallprompt', handler as EventListener)
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener)
  }, [hasSeen])

  // Detect basic iOS Safari to show hint (no real prompt API)
  const isIos = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isInStandalone =
    typeof window !== 'undefined' &&
    // iOS Safari
    ((window as any).navigator?.standalone === true ||
      // Other browsers
      window.matchMedia?.('(display-mode: standalone)').matches)

  const shouldShowInstallButton = !!deferredPrompt && !dismissed && !hasSeen
  const shouldShowIosHint = isIos && !isInStandalone && !dismissed && !hasSeen

  if (!shouldShowInstallButton && !shouldShowIosHint) {
    return null
  }

  const markAsHandled = () => {
    setDismissed(true)
    setHasSeen(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BANNER_STORAGE_KEY, 'true')
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    setDeferredPrompt(null)
    markAsHandled()
  }

  return (
    <div
      className="fixed inset-x-0 z-40 flex justify-center px-3"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
    >
      <div className="flex max-w-xl flex-1 items-center gap-3 rounded-2xl border border-border bg-background/95 px-3 py-2 text-xs text-foreground shadow-lg backdrop-blur">
        <div className="flex-1">
          <p className="font-semibold">ثبّت تطبيق Adham AgriTech</p>
          {shouldShowInstallButton ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              ثبّت المنصة كتطبيق للوصول السريع وتلقّي التحديثات تلقائيًا.
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              من سفاري على الآيفون: مشاركة &gt; <strong>إضافة إلى الشاشة الرئيسية</strong>.
            </p>
          )}
        </div>
        {shouldShowInstallButton && (
          <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={handleInstallClick}>
            تثبيت الآن
          </Button>
        )}
        <button
          type="button"
          onClick={markAsHandled}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted"
          aria-label="إغلاق"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
