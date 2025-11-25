export interface WorkgroupSnapshot {
  id: string
  name: string
  cropFocus: string
  supervisor: string
  members: number
  protocols: number
  activeAlerts: Array<{
    id: string
    type: "disease" | "pest" | "weather"
    message: string
    severity: "low" | "medium" | "high"
    issuedAt: string
  }>
  compliance: number
  backlog: number
}

export const demoWorkgroups: WorkgroupSnapshot[] = [
  {
    id: "wg-nile-delta",
    name: "فريق دلتا النيل",
    cropFocus: "قمح / خضروات ورقية",
    supervisor: "م. سارة الطوخي",
    members: 18,
    protocols: 12,
    compliance: 0.86,
    backlog: 3,
    activeAlerts: [
      {
        id: "alert-nd1",
        type: "disease",
        message: "زيادة احتمالية صدأ القمح في حقول كفر الشيخ",
        severity: "high",
        issuedAt: new Date().toISOString(),
      },
      {
        id: "alert-nd2",
        type: "weather",
        message: "رياح شمالية متوقعة خلال 24 ساعة - تأجيل رش المبيدات",
        severity: "medium",
        issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      },
    ],
  },
  {
    id: "wg-upper-egypt",
    name: "قناة صعيد مصر",
    cropFocus: "مانجو / طماطم صيفية",
    supervisor: "د. وليد عبد الظاهر",
    members: 11,
    protocols: 9,
    compliance: 0.73,
    backlog: 5,
    activeAlerts: [
      {
        id: "alert-ue1",
        type: "pest",
        message: "رصد مبكر لذبابة الفاكهة في إسنا - عتبة إنذار",
        severity: "high",
        issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      },
    ],
  },
]
