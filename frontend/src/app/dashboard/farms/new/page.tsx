"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/lib/i18n/use-language"
import { eosdaPublicConfig } from "@/lib/config/eosda"

const SatelliteMap = dynamic(() => import("@/components/satellite-map").then((mod) => mod.SatelliteMap), {
  ssr: false,
})

type GeoStatus = "idle" | "locating" | "ready" | "denied" | "unsupported" | "error"

const DEFAULT_COORDS = {
  latitude: eosdaPublicConfig.center.lat.toFixed(6),
  longitude: eosdaPublicConfig.center.lng.toFixed(6),
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object") {
    const { message, details } = error as { message?: unknown; details?: unknown }
    if (typeof message === "string") {
      return typeof details === "string" && details.length > 0 ? `${message} (${details})` : message
    }
  }
  if (typeof error === "string") return error
  try {
    return JSON.stringify(error)
  } catch {
    return "Unknown error"
  }
}

export default function NewFarmPage() {
  const router = useRouter()
  const { t, language, toggleLanguage } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle")
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    crop_type: "",
    area: "",
  })
  const [coords, setCoords] = useState<{ latitude: string; longitude: string } | null>(null)

  const mapCenter = useMemo(() => {
    if (!coords) return undefined
    const lat = Number.parseFloat(coords.latitude)
    const lng = Number.parseFloat(coords.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return undefined
    }
    return [lat, lng] as [number, number]
  }, [coords])

  const requestGeolocation = useCallback(
    (options?: PositionOptions) => {
      if (geoStatus === "locating") return
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setGeoStatus("unsupported")
        setCoords((prev) => prev ?? DEFAULT_COORDS)
        return
      }
      setGeoStatus("locating")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          })
          setGeoStatus("ready")
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setGeoStatus("denied")
          } else {
            setGeoStatus("error")
          }
          setCoords((prev) => prev ?? DEFAULT_COORDS)
        },
        options ?? { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 },
      )
    },
    [geoStatus],
  )

  useEffect(() => {
    if (!coords) {
      requestGeolocation({ enableHighAccuracy: false, timeout: 5000 })
    }
  }, [coords, requestGeolocation])

  const geoStatusMessage = useMemo(() => {
    switch (geoStatus) {
      case "locating":
        return t("farm_form.geo.locating")
      case "unsupported":
        return t("farm_form.geo.unsupported")
      case "denied":
      case "error":
        return t("farm_form.geo.denied")
      default:
        return t("farm_form.geo.message")
    }
  }, [geoStatus, t])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSubmitError(null)

    try {
      const normalizedCoords = coords ?? DEFAULT_COORDS
      const latitude = Number.parseFloat(normalizedCoords.latitude)
      const longitude = Number.parseFloat(normalizedCoords.longitude)
      const areaValue = Number.parseFloat(formData.area)
      const normalizedArea = Number.isFinite(areaValue) ? areaValue : 0

      const primaryCrop = formData.crop_type.trim()
      const description =
        primaryCrop.length > 0 ? (language === "ar" ? `المحصول الرئيسي: ${primaryCrop}` : `Primary crop: ${primaryCrop}`) : null

      const response = await fetch("/api/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          location: formData.location.trim(),
          description,
          total_area: normalizedArea,
          latitude,
          longitude,
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? "Failed to create farm")
      }

      console.log("[Farm Creation] Farm created successfully:", { farmId: payload.id })
      
      // Wait a moment for database to sync
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to farms page
      router.push("/dashboard/farms")
    } catch (error) {
      console.error("[farms] Error creating farm:", error)
      const details = extractErrorMessage(error)
      setSubmitError(`${t("farm_form.alerts.create_failed")}: ${details}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/farms">
            <Button variant="ghost" size="icon" aria-label={t("farm_form.back")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{t("farm_form.title")}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={toggleLanguage}>
          {language === "ar" ? "EN" : "ع"}
        </Button>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t("farm_form.fields.name.label")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t("farm_form.fields.name.placeholder")}
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">{t("farm_form.fields.location.label")}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t("farm_form.fields.location.placeholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crop">{t("farm_form.fields.crop.label")}</Label>
              <Input
                id="crop"
                value={formData.crop_type}
                onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                placeholder={t("farm_form.fields.crop.placeholder")}
              />
            </div>
          </div>

          <div className="space-y-2 md:max-w-xs">
            <Label htmlFor="area">{t("farm_form.fields.area.label")}</Label>
            <Input
              id="area"
              type="number"
              step="0.01"
              min="0"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              placeholder={t("farm_form.fields.area.placeholder")}
              required
            />
          </div>

          <div className="rounded-2xl border border-dashed border-white/10 bg-muted/10 p-4 text-sm text-muted-foreground space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-white">{t("farm_form.geo.heading")}</p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => requestGeolocation()}
                disabled={geoStatus === "locating"}
              >
                {geoStatus === "locating" ? t("farm_form.geo.locating") : t("farm_form.geo.use_location")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
              <span>
                {t("farm_form.geo.latitude")}: {coords?.latitude ?? "—"}
              </span>
              <span>
                {t("farm_form.geo.longitude")}: {coords?.longitude ?? "—"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{geoStatusMessage}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="latitude" className="text-xs text-muted-foreground">
                  {t("farm_form.geo.latitude")}
                </Label>
                <Input
                  id="latitude"
                  value={coords?.latitude ?? ""}
                  onChange={(event) =>
                    setCoords((prev) => ({
                      latitude: event.target.value,
                      longitude: prev?.longitude ?? "",
                    }))
                  }
                  placeholder="—"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="longitude" className="text-xs text-muted-foreground">
                  {t("farm_form.geo.longitude")}
                </Label>
                <Input
                  id="longitude"
                  value={coords?.longitude ?? ""}
                  onChange={(event) =>
                    setCoords((prev) => ({
                      latitude: prev?.latitude ?? "",
                      longitude: event.target.value,
                    }))
                  }
                  placeholder="—"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-medium">{t("farm_form.map.label")}</Label>
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <SatelliteMap
                latitude={mapCenter?.[0]}
                longitude={mapCenter?.[1]}
                lang={language}
                zoom={mapCenter ? 15 : 6}
                height="360px"
                showGeolocate
                allowProviderSwitch={false}
                onLocationSelect={(lat: number, lng: number) =>
                  setCoords({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("farm_form.map.hint")}</p>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Link href="/dashboard/farms" className="flex-1">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                {t("farm_form.actions.cancel")}
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("farm_form.actions.saving")}
                </>
              ) : (
                t("farm_form.actions.save")
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
