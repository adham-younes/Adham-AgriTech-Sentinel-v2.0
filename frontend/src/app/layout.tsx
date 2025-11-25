import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "sonner"
import "../styles/globals.css"
import { LanguageProvider } from "@/lib/i18n/language-context"
import { TopNav } from "@/components/layout/top-nav"
import { GlobalCompanion } from "@/components/assistants/global-companion"
import { PwaInstallBanner } from "@/components/pwa-install-banner"
import { PwaRegistrar } from "@/components/pwa-registrar"

export const metadata: Metadata = {
  title: "Adham AgriTech - Smart Agriculture Platform",
  description: "Smart Agriculture Platform for Farmers - AI agronomy, satellite intelligence, and sensor-driven automation",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-[100dvh] font-sans antialiased pb-[env(safe-area-inset-bottom)]">
        <LanguageProvider>
          <PwaRegistrar />
          <PwaInstallBanner />
          <TopNav />
          <Suspense fallback={null}>{children}</Suspense>
          <GlobalCompanion />
        </LanguageProvider>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
