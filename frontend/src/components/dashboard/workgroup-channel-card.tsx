"use client"

import { Shield, Users, AlertTriangle, CheckCircle2 } from "lucide-react"
import type { WorkgroupSnapshot } from "@/lib/domain/workgroups"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface WorkgroupChannelCardProps {
  workgroup: WorkgroupSnapshot
}

const severityMap: Record<string, string> = {
  high: "text-red-400 bg-red-400/10 border-red-400/40",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/40",
  low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/40",
}

const alertLabel: Record<string, string> = {
  disease: "مرض",
  pest: "آفة",
  weather: "طقس",
}

export function WorkgroupChannelCard({ workgroup }: WorkgroupChannelCardProps) {
  const alertCount = workgroup.activeAlerts.length
  return (
    <Card className="glass-card border-primary/20 shadow-3d">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-semibold">{workgroup.name}</CardTitle>
          <p className="text-xs text-muted-foreground">{workgroup.cropFocus}</p>
        </div>
        <Shield className="h-6 w-6 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-muted-foreground">الأعضاء النشطون</p>
            <p className="text-2xl font-semibold text-white flex items-center justify-center gap-1">
              <Users className="h-4 w-4 text-primary" /> {workgroup.members}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-muted-foreground">البروتوكولات المفعلة</p>
            <p className="text-2xl font-semibold text-white">{workgroup.protocols}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">الالتزام بالبروتوكول</p>
            <p className="text-2xl font-semibold text-primary">{Math.round(workgroup.compliance * 100)}%</p>
          </div>
          <div className="rounded-xl border border-amber-300/20 bg-amber-50/5 p-3">
            <p className="text-xs text-muted-foreground">المهام المعلقة</p>
            <p className="text-2xl font-semibold text-amber-300">{workgroup.backlog}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            آخر التنبيهات ({alertCount})
          </div>
          {alertCount === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-emerald-100">
              <CheckCircle2 className="h-4 w-4" /> جميع القطاعات مستقرة خلال 48 ساعة الماضية
            </div>
          ) : (
            <div className="space-y-2">
              {workgroup.activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-3 text-xs sm:text-sm ${severityMap[alert.severity]} flex items-start gap-2`}
                >
                  <Badge variant="outline" className="border-white/20 text-white/80">
                    {alertLabel[alert.type] ?? "تنبيه"}
                  </Badge>
                  <div>
                    <p className="font-medium text-white/90">{alert.message}</p>
                    <p className="text-[11px] text-white/70">
                      {formatAlertTimestamp(alert.issuedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-dashed border-white/20 p-3 text-xs text-muted-foreground">
          المشرف المسؤول: <span className="font-semibold text-white">{workgroup.supervisor}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function formatAlertTimestamp(issuedAt: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(issuedAt),
    )
  } catch {
    try {
      return new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(issuedAt),
      )
    } catch {
      return issuedAt
    }
  }
}
