"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, CheckCheck, Info, Droplets, Sprout, Cloud } from "lucide-react"
import { useTranslation } from "@/lib/i18n/use-language"
import { formatDateTimeLocale } from "@/lib/utils/date"

export default function NotificationsPage() {
  const { language, setLanguage } = useTranslation()
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error("[v0] Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

      if (error) throw error
      loadNotifications()
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  async function markAllAsRead() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id)

      if (error) throw error
      loadNotifications()
    } catch (error) {
      console.error("[v0] Error marking all as read:", error)
    }
  }

  const t = {
    ar: {
      title: "الإشعارات",
      subtitle: "تابع آخر التحديثات والتنبيهات",
      markAllRead: "تعليم الكل كمقروء",
      noNotifications: "لا توجد إشعارات",
      unread: "غير مقروء",
      read: "مقروء",
      types: {
        weather: "طقس",
        irrigation: "ري",
        soil: "تربة",
        crop: "محصول",
        system: "نظام",
      },
    },
    en: {
      title: "Notifications",
      subtitle: "Stay updated with latest alerts",
      markAllRead: "Mark All as Read",
      noNotifications: "No notifications",
      unread: "Unread",
      read: "Read",
      types: {
        weather: "Weather",
        irrigation: "Irrigation",
        soil: "Soil",
        crop: "Crop",
        system: "System",
      },
    },
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "weather":
        return <Cloud className="h-5 w-5" />
      case "irrigation":
        return <Droplets className="h-5 w-5" />
      case "soil":
      case "crop":
        return <Sprout className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            {t[lang].title}
          </h1>
          <p className="text-muted-foreground mt-1">{t[lang].subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            {t[lang].markAllRead}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = lang === "ar" ? "en" : "ar"
              setLang(next)
              setLanguage(next)
            }}
          >
            {lang === "ar" ? "EN" : "ع"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t[lang].noNotifications}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 transition-colors ${!notification.is_read ? "bg-primary/5 border-primary/20" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${!notification.is_read ? "bg-primary/10" : "bg-muted"}`}>
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold">{notification.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={getPriorityColor(notification.priority)}>
                        {t[lang].types[notification.type as keyof typeof t.ar.types] || notification.type}
                      </Badge>
                      {!notification.is_read && (
                        <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNotificationTimestamp(notification.created_at, lang)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function formatNotificationTimestamp(value: string, language: "ar" | "en") {
  const locale = language === "ar" ? "ar-EG" : "en-US"
  return formatDateTimeLocale(value, locale, { dateStyle: "medium", timeStyle: "short" }, value)
}
