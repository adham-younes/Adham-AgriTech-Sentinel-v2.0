import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const techPartners: Array<{ name: string; logo?: string; description: string }> = []
const agriPartners: Array<{ name: string; logo?: string; description: string; services: string[] }> = []

export default function PartnersPage() {
  const hasApprovedPartners = techPartners.length > 0 || agriPartners.length > 0
  const showPartners = process.env.NEXT_PUBLIC_SHOW_PARTNERS === "true"
  const canRenderPartners = showPartners && hasApprovedPartners

  return (
    <div className="min-h-[100dvh] bg-background">
      <section className="relative overflow-hidden px-6 py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <h1 className="mb-6 text-6xl font-bold tracking-tight text-glow sm:text-7xl md:text-8xl">التكاملات والشراكات</h1>
          <p className="mx-auto mb-4 max-w-3xl text-xl text-foreground/90 sm:text-2xl">Integrations & Partnerships</p>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
            هذه الصفحة قيد المراجعة القانونية والتحقق من الموافقات والعلامات التجارية قبل العرض العام.
          </p>
          <Button asChild size="lg" className="group">
            <Link href="/auth/signup">
              انضم إلينا
              <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      <PartnersSection title="شركاء التكنولوجيا" subtitle="Technology Partners" showContent={canRenderPartners}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {techPartners.map((partner) => (
            <div key={partner.name} className="depth-card hover-lift group flex flex-col items-center justify-center rounded-2xl p-8">
              <div className="mb-6 flex h-24 w-full items-center justify-center">
                <Image
                  src={partner.logo || "/placeholder.svg"}
                  alt={`${partner.name} Logo`}
                  width={160}
                  height={60}
                  className="h-auto w-full max-w-[160px] object-contain opacity-70 transition-opacity group-hover:opacity-100"
                />
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold">{partner.name}</h3>
              <p className="text-center text-sm text-muted-foreground">{partner.description}</p>
            </div>
          ))}
        </div>
      </PartnersSection>

      <PartnersSection title="الشركاء الزراعيون" subtitle="Agricultural Partners" showContent={canRenderPartners}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {agriPartners.map((partner) => (
            <div key={partner.name} className="rounded-2xl border border-white/10 bg-card/80 p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-3">
                <Image
                  src={partner.logo || "/placeholder.svg"}
                  alt={`${partner.name} Logo`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border border-white/10 object-cover"
                />
                <div>
                  <h3 className="font-semibold">{partner.name}</h3>
                  <p className="text-sm text-muted-foreground">{partner.description}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                {partner.services.map((service) => (
                  <div key={service} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PartnersSection>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-4xl font-bold">هل تريد أن تصبح شريكاً؟</h2>
          <p className="mb-8 text-lg text-muted-foreground">انضم إلى شبكتنا من الشركاء الرائدين في مجال التكنولوجيا الزراعية</p>
          <Button asChild size="lg" variant="outline" className="group bg-transparent">
            <Link href="/contact">
              تواصل معنا
              <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function PartnersSection({
  title,
  subtitle,
  children,
  showContent,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  showContent: boolean
}) {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold">{title}</h2>
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        </div>
        {showContent ? children : <ComplianceNotice />}
      </div>
    </section>
  )
}

function ComplianceNotice() {
  return (
    <div className="glass-card rounded-2xl p-6 text-center">
      <h3 className="mb-2 text-xl font-semibold">إشعار التزام وعلامات تجارية</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        تُنقّح هذه الصفحة لضمان الالتزام القانوني والعلامي. لا يعكس غياب الشعارات أو الأسماء أي علاقة حالية أو مستقبلية حتى اكتمال الموافقات الخطية.
      </p>
      <div className="text-xs text-muted-foreground/80">جميع الأسماء والشعارات ملك لأصحابها. سيتم عرض أي شريك فقط بعد التحقق والموافقة الكتابية.</div>
    </div>
  )
}
