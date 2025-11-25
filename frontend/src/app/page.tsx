"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sprout, Leaf, Droplets, Cloud, BarChart3, MessageSquare, Sparkles, Shield, Zap } from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"
import { useEffect } from "react"

type HeroStatConfig = {
  key: "active" | "latest_capture" | "weather_alerts"
  value: string
  delta: string
}

type LiveMetricConfig = {
  key: "ndvi" | "water" | "pest"
  value: string
  image: string
}

type StoryConfig = {
  key: "irrigation" | "sensors"
  image: string
}

const HERO_STATS: HeroStatConfig[] = [
  { key: "active", value: "2,430", delta: "+18% this month" },
  { key: "latest_capture", value: "3h ago", delta: "Satellite update" },
  { key: "weather_alerts", value: "4", delta: "Wadi El-Natrun • Minya" },
]

const LIVE_METRICS: LiveMetricConfig[] = [
  { key: "ndvi", value: "0.72", image: "/images/ai-generated-9078772_1920.jpg" },
  { key: "water", value: "-14%", image: "/images/istockphoto-2063149512-1024x1024.jpg" },
  { key: "pest", value: "9 visits", image: "/images/istockphoto-2236213113-1024x1024.jpg" },
]

const STORIES: StoryConfig[] = [
  { key: "irrigation", image: "/images/StockCake-agriculture_Images_and_Photos_1762501288.jpg" },
  { key: "sensors", image: "/images/istockphoto-1463452333-1024x1024.jpg" },
]

export default function HomePage() {
  const { t } = useTranslation()

  const heroStats = HERO_STATS.map((stat) => ({
    key: stat.key,
    label: t(`landing_home.hero.stats.${stat.key}.label`),
    value: t(`landing_home.hero.stats.${stat.key}.value`, { fallback: stat.value }),
    delta: t(`landing_home.hero.stats.${stat.key}.delta`, { fallback: stat.delta }),
  }))

  const liveMetrics = LIVE_METRICS.map((metric) => ({
    key: metric.key,
    image: metric.image,
    value: t(`landing_home.metrics.${metric.key}.value`, { fallback: metric.value }),
    title: t(`landing_home.metrics.${metric.key}.title`),
    trend: t(`landing_home.metrics.${metric.key}.trend`),
    description: t(`landing_home.metrics.${metric.key}.description`),
  }))

  const stories = STORIES.map((story) => ({
    key: story.key,
    image: story.image,
    title: t(`landing_home.stories.${story.key}.title`),
    impact: t(`landing_home.stories.${story.key}.impact`),
    summary: t(`landing_home.stories.${story.key}.summary`),
    quote: t(`landing_home.stories.${story.key}.quote`),
    author: t(`landing_home.stories.${story.key}.author`),
  }))

  return (
    <div className="flex min-h-[100dvh] flex-col bg-black">
      {/* Hero */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 sm:px-6 py-12 sm:py-20">
        <Image
          src="/images/smart-farming-technology-stockcake.jpg"
          alt={t("landing_home.hero.image_alt", { fallback: "Smart farming dashboard showing satellite analysis and crop health metrics" })}
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />

        <div className="relative z-10 mx-auto max-w-5xl text-center space-y-8">
          <div className="mb-6 sm:mb-8 flex justify-center">
            <div className="glass-card flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-3xl shadow-3d shadow-primary/50 hover:shadow-primary/70 transition-all duration-300 hover:scale-110">
              <Sprout className="h-8 w-8 sm:h-12 sm:w-12 text-primary drop-shadow-glow" />
            </div>
          </div>
          <h1 className="mb-4 sm:mb-6 text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent drop-shadow-2xl">
            {t("branding.name")}
          </h1>
          <p className="mb-3 sm:mb-4 text-xl sm:text-3xl font-bold text-primary drop-shadow-glow">{t("branding.tagline")}</p>
          <p className="mx-auto mb-8 sm:mb-12 max-w-2xl text-base sm:text-lg text-gray-400 leading-relaxed">
            {t("landing.hero_subtitle")}
          </p>
          <div className="flex flex-col gap-3 sm:gap-4 sm:items-center sm:justify-center">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-center">
              <Button
                asChild
                size="lg"
                className="text-base sm:text-lg shadow-3d shadow-primary/50 hover:shadow-primary/70 hover:scale-105 transition-all duration-300"
              >
                <Link href="/dashboard">
                  <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {t("landing.primary_cta")}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base sm:text-lg glass-card border-primary/30 hover:border-primary/60 hover:scale-105 transition-all duration-300 bg-transparent"
              >
                <Link href="/dashboard/satellite">{t("landing.secondary_cta")}</Link>
              </Button>
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-sm sm:text-base text-primary hover:text-primary/80"
              >
                <Link href="/auth/login">{t("landing.auth.login")}</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-sm sm:text-base text-primary hover:text-primary/80"
              >
                <Link href="/auth/signup">{t("landing.auth.signup")}</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.key} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left">
                <p className="text-xs uppercase tracking-wide text-white/60">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <p className="text-xs text-emerald-300 mt-1">{stat.delta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live metrics */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">{t("landing_home.live.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("landing_home.live.subtitle")}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/satellite">{t("landing_home.live.button")}</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {liveMetrics.map((metric) => (
              <div key={metric.key} className="glass-card rounded-3xl overflow-hidden border border-white/10">
                <div className="relative h-40 w-full">
                  <Image
                    src={metric.image}
                    alt={t("landing_home.metrics.image_alt", { fallback: `Live ${metric.title} visualization` })}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-sm text-white/70">{metric.trend}</p>
                    <p className="text-3xl font-bold text-white">{metric.value}</p>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="text-lg font-semibold text-white">{metric.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{metric.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-primary/5 to-black" />
        <div className="mx-auto max-w-6xl relative z-10">
          <div className="mb-12 sm:mb-16 text-center">
            <h2 className="mb-3 sm:mb-4 text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              {t("landing.features_title")}
            </h2>
            <p className="text-base sm:text-lg text-gray-400">{t("landing.features_subtitle")}</p>
          </div>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Leaf className="h-6 w-6 sm:h-8 sm:w-8" />}
              title={t("landing.features.crop_monitoring.title")}
              description={t("landing.features.crop_monitoring.description")}
            />
            <FeatureCard
              icon={<Droplets className="h-6 w-6 sm:h-8 sm:w-8" />}
              title={t("landing.features.smart_irrigation.title")}
              description={t("landing.features.smart_irrigation.description")}
            />
            <FeatureCard
              icon={<Cloud className="h-6 w-6 sm:h-8 sm:w-8" />}
              title={t("landing.features.weather.title")}
              description={t("landing.features.weather.description")}
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />}
              title={t("landing.features.soil.title")}
              description={t("landing.features.soil.description")}
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />}
              title={t("landing.features.assistant.title")}
              description={t("landing.features.assistant.description")}
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6 sm:h-8 sm:w-8" />}
              title={t("landing.features.security.title")}
              description={t("landing.features.security.description")}
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-primary/10" />
        <div className="mx-auto max-w-6xl relative z-10">
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-3">
            <StatCard number="—" label={t("landing.stats.active_farms")} />
            <StatCard number="—" label={t("landing.stats.managed_hectares")} />
            <StatCard number="—" label={t("landing.stats.productivity_increase")} />
          </div>
        </div>
      </section>

      {/* Success stories */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/80">{t("landing_home.impact.eyebrow")}</p>
            <h2 className="text-3xl font-bold text-white">{t("landing_home.impact.title")}</h2>
            <p className="text-muted-foreground text-sm">{t("landing_home.impact.description")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {stories.map((story) => (
              <div key={story.key} className="glass-card rounded-3xl overflow-hidden">
                <div className="relative h-48 w-full">
                  <Image 
                    src={story.image} 
                    alt={t("landing_home.stories.image_alt", { fallback: `Success story: ${story.title}` })} 
                    fill 
                    className="object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30" />
                  <div className="absolute bottom-4 left-4">
                    <p className="text-xs text-white/70">{story.impact}</p>
                    <h3 className="text-xl font-semibold text-white">{story.title}</h3>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{story.summary}</p>
                  <blockquote className="text-sm italic text-white/80 border-s border-primary/40 ps-3">
                    <span>&ldquo;{story.quote}&rdquo;</span>
                    <span className="block text-xs text-primary mt-1">{story.author}</span>
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NDVI explainer */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="glass-card mx-auto max-w-6xl rounded-3xl border border-white/10 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="relative h-64 md:h-full">
              <Image
                src="/images/istockphoto-1386172700-1024x1024.jpg"
                alt={t("landing_home.ndvi.image_alt", { fallback: "NDVI spectral analysis showing vegetation health index" })}
                fill
                className="object-cover"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30" />
              <div className="absolute top-4 left-4 rounded-full bg-black/70 px-3 py-1 text-xs text-white/80">
                {t("landing_home.ndvi.tip")}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="text-2xl font-semibold text-white">{t("landing_home.ndvi.heading")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("landing_home.ndvi.description")}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">NDVI</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                  {t("landing_home.ndvi.badge_satellite", { fallback: "Satellite analytics" })}
                </span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">IoT</span>
              </div>
              <Button asChild>
                <Link href="/knowledge-hub">{t("landing_home.ndvi.cta")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Educational content */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-primary/10 to-black" />
        <div className="mx-auto max-w-6xl relative z-10">
          <div className="mb-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              {t("education.title")}
            </h2>
            <p className="mt-2 text-gray-400">{t("education.subtitle")}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <EduCard
              title={t("education.cards.satellite.title")}
              accent="from-cyan-400/60 via-sky-500/30 to-slate-900/40"
              body={t("education.cards.satellite.body")}
              imageSrc="/images/ai-generated-8851632.png"
              imageAlt="Spectral NDVI visualization over cultivated plots."
            />
            <EduCard
              title={t("education.cards.greenhouse.title")}
              accent="from-purple-400/60 via-fuchsia-500/30 to-indigo-900/40"
              body={t("education.cards.greenhouse.body")}
              imageSrc="/images/smart-farming-technology-stockcake.jpg"
              imageAlt="Technician tuning greenhouse automation dashboards."
            />
            <EduCard
              title={t("education.cards.revolutionary.title")}
              accent="from-emerald-400/60 via-emerald-500/30 to-emerald-900/40"
              body={t("education.cards.revolutionary.body")}
              imageSrc="/images/StockCake-Smart_Farming_Technology_1762501220.jpg"
              imageAlt="Drone and agronomist reviewing precision-farming data in the field."
            />
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/learn">{t("education.more_link")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-primary/10 to-black" />
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <div className="glass-card p-8 sm:p-12 rounded-3xl shadow-3d">
            <Zap className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4 sm:mb-6 drop-shadow-glow" />
            <h2 className="mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              {t("landing.cta.title")}
            </h2>
            <p className="mb-6 sm:mb-8 text-base sm:text-lg text-gray-400">{t("landing.cta.subtitle")}</p>
            <Button
              asChild
              size="lg"
              className="text-base sm:text-lg shadow-3d shadow-primary/50 hover:shadow-primary/70 hover:scale-105 transition-all duration-300"
            >
              <Link href="/dashboard">
                <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {t("landing.cta.button")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-primary/20 bg-black/50 backdrop-blur-xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-gray-400">
              &copy; 2025 Adham AgriTech. {t("landing_home.footer.rights")}
            </p>
            <Link href="/learn" className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors">
              {t("landing_home.footer.education_link")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group glass-card rounded-2xl p-4 sm:p-6 shadow-3d hover:shadow-3d-lg transition-all duration-300 hover:scale-105 hover:border-primary/50">
      <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-inner transition-all duration-300 group-hover:bg-primary group-hover:text-black group-hover:shadow-glow">
        {icon}
      </div>
      <h3 className="mb-2 text-lg sm:text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 text-center shadow-3d hover:shadow-3d-lg transition-all duration-300 hover:scale-105">
      <p className="text-3xl sm:text-5xl font-bold text-primary drop-shadow-glow mb-2">{number}</p>
      <p className="text-sm sm:text-base text-gray-400">{label}</p>
    </div>
  )
}

function EduCard({
  title,
  accent,
  body,
  imageSrc,
  imageAlt,
}: {
  title: string
  accent: string
  body: string
  imageSrc: string
  imageAlt: string
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-3d hover:shadow-3d-lg transition">
      <div className="relative h-44 w-full">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
          priority={false}
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${accent} mix-blend-multiply`} />
        <div className="absolute inset-0 bg-black/35" />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-1 text-white">{title}</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{body}</p>
      </div>
    </div>
  )
}
