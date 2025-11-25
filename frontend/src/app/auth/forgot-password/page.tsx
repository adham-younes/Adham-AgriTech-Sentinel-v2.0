"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Sprout } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const supabase = createClient()

      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        throw error
      }

      setSuccess("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.")
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر إرسال رابط إعادة تعيين كلمة المرور. حاول مرة أخرى.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center p-3 sm:p-6 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/70 shadow-3d shadow-primary/50 hover:scale-105 transition-transform duration-300">
              <Sprout className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Adham AgriTech
            </h1>
            <p className="text-white/60 text-sm sm:text-lg">منصة الزراعة الذكية</p>
          </div>

          <Card className="glass-card border-white/10 shadow-3d">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-2xl sm:text-3xl bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                استعادة كلمة المرور
              </CardTitle>
              <CardDescription className="text-white/60 text-sm sm:text-base">
                أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-white/90 text-sm sm:text-base">
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="farmer@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      dir="ltr"
                      className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-destructive/20 border border-destructive/30 p-3 text-xs sm:text-sm text-destructive backdrop-blur-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs sm:text-sm text-emerald-300 backdrop-blur-sm">
                      {success}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-glow hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02] text-sm sm:text-base h-9 sm:h-10"
                    disabled={isLoading}
                  >
                    {isLoading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
                  </Button>
                </div>

                <div className="mt-4 text-center text-xs sm:text-sm text-white/70">
                  تذكرت كلمة المرور؟{" "}
                  <Link
                    href="/auth/login"
                    className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                  >
                    العودة لتسجيل الدخول
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
