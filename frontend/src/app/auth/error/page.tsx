import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string; error_description?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center p-6 bg-gradient-to-br from-background via-background to-destructive/5">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card className="border-destructive/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">عذراً، حدث خطأ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {params?.error ? (
                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="text-sm font-medium text-destructive mb-1">رمز الخطأ: {params.error}</p>
                  {params.error_description && (
                    <p className="text-sm text-muted-foreground">{params.error_description}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.</p>
              )}
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/auth/login">العودة إلى تسجيل الدخول</Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/auth/signup">إنشاء حساب جديد</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
