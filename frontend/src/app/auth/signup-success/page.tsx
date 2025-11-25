import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">تم إنشاء الحساب بنجاح!</CardTitle>
              <CardDescription>يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-center">
                <Mail className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  لقد أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. يرجى النقر على الرابط الموجود في الرسالة لتفعيل حسابك.
                </p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• تحقق من صندوق الوارد الخاص بك</p>
                <p>• إذا لم تجد الرسالة، تحقق من مجلد الرسائل غير المرغوب فيها</p>
                <p>• قد تستغرق الرسالة بضع دقائق للوصول</p>
              </div>
              <Button asChild className="w-full">
                <Link href="/auth/login">العودة إلى تسجيل الدخول</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
