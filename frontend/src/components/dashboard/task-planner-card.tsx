"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarIcon, CheckCircle2, ClipboardList, Loader2, PlusCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface PlannerTask {
  id: string
  title: string
  field: string
  dueDate: string
  priority: "low" | "medium" | "high"
  notes?: string
  status: "pending" | "done"
}

const STORAGE_KEY = "adham-agritech-task-planner"

const priorityLabels: Record<PlannerTask["priority"], string> = {
  low: "منخفض",
  medium: "متوسط",
  high: "عاجل",
}

export function TaskPlannerCard() {
  const [tasks, setTasks] = useState<PlannerTask[]>([])
  const [form, setForm] = useState({
    title: "",
    field: "",
    dueDate: "",
    priority: "medium" as PlannerTask["priority"],
    notes: "",
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        setTasks(JSON.parse(cached))
      }
    } catch (error) {
      console.warn("[TaskPlanner] failed to read cache", error)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (error) {
      console.warn("[TaskPlanner] failed to persist cache", error)
    }
  }, [tasks, hydrated])

  const pendingTasks = useMemo(() => tasks.filter((task) => task.status === "pending"), [tasks])
  const completedTasks = useMemo(() => tasks.filter((task) => task.status === "done"), [tasks])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.field.trim() || !form.dueDate) return

    const newTask: PlannerTask = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      field: form.field.trim(),
      dueDate: form.dueDate,
      priority: form.priority,
      notes: form.notes.trim() || undefined,
      status: "pending",
    }
    setTasks((prev) => [newTask, ...prev])
    setForm({ title: "", field: "", dueDate: "", priority: "medium", notes: "" })
  }

  const updateTaskStatus = (taskId: string, status: PlannerTask["status"]) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)))
  }

  const taskBadge = (priority: PlannerTask["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-200 border-red-500/40"
      case "medium":
        return "bg-amber-500/20 text-amber-200 border-amber-500/40"
      default:
        return "bg-emerald-500/15 text-emerald-100 border-emerald-500/30"
    }
  }

  return (
    <Card className="glass-card border-primary/20 shadow-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" /> خطة المهام الميدانية
        </CardTitle>
        <CardDescription>إنشاء مهام خاصة بقناتك ومزامنتها لاحقاً مع قاعدة البيانات عند توفر الاتصال.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="عنوان المهمة"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <Input
              placeholder="الحقل أو الموقع"
              value={form.field}
              onChange={(event) => setForm((prev) => ({ ...prev, field: event.target.value }))}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <label>تاريخ التنفيذ</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <label>الأولوية</label>
              <select
                className="rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-white focus:border-primary"
                value={form.priority}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, priority: event.target.value as PlannerTask["priority"] }))
                }
              >
                <option value="high">عاجلة</option>
                <option value="medium">متوسطة</option>
                <option value="low">مراقبة</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <label>ملاحظات</label>
              <Textarea
                placeholder="تعليمات إضافية أو ملاحظات من المشرف"
                value={form.notes}
                rows={1}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" /> إضافة المهمة لخطة اليوم
          </Button>
        </form>

        {!hydrated ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-white/10 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري تحميل المهام المخزنة محليًا…
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
              <span>المهام النشطة ({pendingTasks.length})</span>
              <span>المكتملة ({completedTasks.length})</span>
            </div>
            {tasks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-muted-foreground">
                لا توجد مهام بعد. استخدم النموذج أعلاه لإضافة أول مهمة لقناتك.
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-xl border border-white/10 bg-white/5 p-3 ${
                      task.status === "done" ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{task.title}</p>
                        <p className="text-xs text-muted-foreground">الحقل: {task.field}</p>
                      </div>
                      <Badge variant="outline" className={taskBadge(task.priority)}>
                        {priorityLabels[task.priority]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {formatTaskDueDate(task.dueDate)}
                      </span>
                      {task.notes && <span className="text-xs text-white/80">{task.notes}</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.status === "pending" ? (
                        <Button
                          size="sm"
                          className="bg-emerald-500/80 hover:bg-emerald-500"
                          onClick={() => updateTaskStatus(task.id, "done")}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> تم التنفيذ
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, "pending")}
                        >
                          إعادة فتح المهمة
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatTaskDueDate(dueDate: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(dueDate))
  } catch {
    try {
      return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(dueDate))
    } catch {
      return dueDate
    }
  }
}
