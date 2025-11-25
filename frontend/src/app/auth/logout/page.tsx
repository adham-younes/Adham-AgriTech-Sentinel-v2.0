"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, LogOut } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LogoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<"pending" | "done" | "error">("pending")

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    async function signOut() {
      try {
        await supabase.auth.signOut()
        if (!mounted) return
        setStatus("done")
        timeoutId = setTimeout(() => router.replace("/"), 1200)
      } catch (error) {
        console.error("[Logout] Failed to sign out:", error)
        if (mounted) setStatus("error")
      }
    }

    void signOut()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [router, supabase])

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-black px-4">
      <Card className="w-full max-w-sm space-y-4 border border-white/10 bg-background/80 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {status === "pending" ? <Loader2 className="h-6 w-6 animate-spin" /> : <LogOut className="h-6 w-6" />}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">
            {status === "pending" ? "جارٍ تسجيل الخروج" : status === "done" ? "تم تسجيل الخروج" : "تعذر تسجيل الخروج"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {status === "pending"
              ? "ثوانٍ قليلة وسنعيدك إلى الصفحة الرئيسية."
              : status === "done"
                ? "تم إنهاء الجلسة، يمكنك العودة للواجهة الرئيسية الآن."
                : "حدث خطأ أثناء تسجيل الخروج. أعد المحاولة أو أغلق المتصفح."}
          </p>
        </div>
        {status === "error" && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              عودة للوحة التحكم
            </Button>
            <Button onClick={() => router.push("/")}>الانتقال للواجهة</Button>
          </div>
        )}
      </Card>
    </main>
  )
}
