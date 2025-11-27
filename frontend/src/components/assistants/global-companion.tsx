'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Bot, Loader2, MessageCircle, Send, User, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/lib/i18n/use-language'
import { cn } from '@/lib/utils'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  kind?: 'welcome'
}

type Availability = 'unknown' | 'ready' | 'error'

type PlantContext = {
  summary?: string
  provider?: string
  generatedAt?: string
  matches?: { label?: string; probability?: number }[]
}

type FieldContext = {
  fieldId: string
  ndviStats?: { mean: number; max: number; min: number }
  location?: { lat: number; lng: number }
  cropType?: string
}

const PLANT_CONTEXT_KEY = 'adham-plant-report'
const PLANT_CONTEXT_EVENT = 'adham-plant-context-updated'
const FIELD_CONTEXT_KEY = 'adham-field-context'
const FIELD_CONTEXT_EVENT = 'adham-field-context-updated'

function normaliseAssistantReply(content: string, language: string): string {
  const trimmed = content.trim()
  const unsupportedText = "This file type is not supported. Please use PNG or JPG images under 8 MB."
  if (trimmed === unsupportedText) {
    return language === 'ar'
      ? 'الملف المرفوع غير مدعوم حالياً. استخدم صور PNG أو JPG لا تتجاوز 8 ميجابايت ثم حاول مرة أخرى.'
      : 'That attachment is not supported yet. Please upload PNG or JPG images under 8 MB and resend your question.'
  }
  return content
}

function readPlantContext(): PlantContext | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PLANT_CONTEXT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlantContext | null
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.generatedAt) {
      const age = Date.now() - Date.parse(parsed.generatedAt)
      const sixHours = 1000 * 60 * 60 * 6
      if (Number.isFinite(age) && age > sixHours) {
        return null
      }
    }
    return parsed
  } catch {
    return null
  }
}

function readFieldContext(): FieldContext | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(FIELD_CONTEXT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FieldContext
  } catch {
    return null
  }
}

function interpretCompanionError(raw: string | undefined, language: string): string {
  const fallback =
    language === 'ar'
      ? 'تعذر تشغيل المساعد الآن. يرجى المحاولة بعد لحظات.'
      : 'The assistant is unavailable right now. Please try again shortly.'

  if (!raw) return fallback
  const normalized = raw.toLowerCase()

  if (normalized.includes('unsupported content') || normalized.includes('content fields')) {
    return language === 'ar'
      ? 'هذا النوع من الطلبات غير مدعوم حالياً. أعد صياغة سؤالك كنص واضح بدون مرفقات أو تنسيقات خاصة.'
      : 'This type of request is not supported yet. Please rephrase your question as plain text without special formatting.'
  }

  if (normalized.includes('unauthorized') || normalized.includes('api key')) {
    return language === 'ar'
      ? 'تحقق من مفتاح مزود الذكاء الاصطناعي ثم أعد المحاولة.'
      : 'Please verify the AI provider key and try again.'
  }

  if (normalized.includes('rate limit')) {
    return language === 'ar' ? 'تم بلوغ الحد الأقصى للطلبات. انتظر قليلاً ثم أعد الإرسال.' : 'You hit the request limit. Wait a moment and retry.'
  }

  return fallback
}

export function GlobalCompanion() {
  const { t, language, direction } = useTranslation()

  const welcomeMessage = useMemo(
    () =>
      t('smart_companion.welcome', {
        fallback:
          language === 'ar'
            ? 'مرحبًا! أنا المساعد الذكي العام. اسألني عن أي شيء يخص المنصة أو كيفية استخدام الأدوات.'
            : 'Hi! I am the platform companion. Ask me anything about this app or how to use its tools.',
      }),
    [language, t],
  )

  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [availability, setAvailability] = useState<Availability>('unknown')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plantContext, setPlantContext] = useState<PlantContext | null>(null)
  const [fieldContext, setFieldContext] = useState<FieldContext | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessage,
      kind: 'welcome',
    },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  const placeholder = useMemo(
    () =>
      t('smart_companion.placeholder', {
        fallback: language === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question here...',
      }),
    [language, t],
  )

  const launcherLabel = useMemo(
    () =>
      t('smart_companion.launcher_label', {
        fallback: language === 'ar' ? 'افتح المساعد الذكي للمنصة' : 'Open platform assistant',
      }),
    [language, t],
  )

  const examples = useMemo(
    () => [
      t('smart_companion.examples.operations', {
        fallback: language === 'ar' ? 'ما المهام الحالية لكل المزارع؟' : "What's on today's task list?",
      }),
      t('smart_companion.examples.alerts', {
        fallback: language === 'ar' ? 'فسر تنبيه الري الأخير.' : 'Explain the latest irrigation alert.',
      }),
      t('smart_companion.examples.explain', {
        fallback: language === 'ar' ? 'ماذا يعني مخطط NDVI؟' : 'What does the NDVI chart mean?',
      }),
    ],
    [language, t],
  )

  const title = useMemo(
    () =>
      t('smart_companion.title', {
        // Brand the assistant explicitly as ADHAM in both languages
        fallback: 'ADHAM',
      }),
    [language, t],
  )

  const assistantLabel = useMemo(
    () =>
      t('smart_companion.agent_name', {
        // Force label to ADHAM regardless of locale
        fallback: 'ADHAM',
      }),
    [language, t],
  )

  const agriHighlights = useMemo(() => {
    if (language === 'ar') {
      return [
        'راقب مؤشر NDVI: أقل من 0.35 يعني ضغطًا على الغطاء النباتي.',
        'استخدم رصد الرطوبة لتحديد الحقول التي تحتاج إلى ري خلال 48 ساعة.',
        'راجع مهام إزالة الأعشاب قبل زيادة سرعة الرياح الأسبوع القادم.',
      ]
    }
    return [
      'Track NDVI — readings below 0.35 signal vegetation stress.',
      'Use moisture alerts to decide which blocks need irrigation within 48h.',
      'Schedule weed-control tasks before next week’s wind picks up.',
    ]
  }, [language])

  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length) {
        return [
          {
            id: 'welcome',
            role: 'assistant',
            content: welcomeMessage,
            kind: 'welcome',
          },
        ]
      }
      if (prev[0].kind === 'welcome') {
        const [, ...rest] = prev
        return [{ ...prev[0], content: welcomeMessage }, ...rest]
      }
      return prev
    })
  }, [welcomeMessage])

  useEffect(() => {
    let isMounted = true
    async function checkAvailability() {
      try {
        const res = await fetch('/api/ai/providers', { cache: 'no-store' })
        if (!isMounted) return
        if (!res.ok) {
          setAvailability('error')
          return
        }
        const payload = await res.json()
        setAvailability(payload?.available ? 'ready' : 'error')
      } catch {
        if (isMounted) {
          setAvailability('error')
        }
      }
    }
    void checkAvailability()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isSending])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateContext = () => {
      setPlantContext(readPlantContext())
      setFieldContext(readFieldContext())
    }
    const handleCustom = () => updateContext()
    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== PLANT_CONTEXT_KEY && event.key !== FIELD_CONTEXT_KEY) return
      updateContext()
    }
    updateContext()
    window.addEventListener('storage', handleStorage)
    window.addEventListener(PLANT_CONTEXT_EVENT, handleCustom as EventListener)
    window.addEventListener(FIELD_CONTEXT_EVENT, handleCustom as EventListener)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(PLANT_CONTEXT_EVENT, handleCustom as EventListener)
      window.removeEventListener(FIELD_CONTEXT_EVENT, handleCustom as EventListener)
    }
  }, [])

  const statusLabel =
    availability === 'ready'
      ? t('smart_companion.status.ready', { fallback: language === 'ar' ? 'المساعد جاهز' : 'Assistant online' })
      : availability === 'error'
        ? t('smart_companion.status.error', { fallback: language === 'ar' ? 'المساعد غير متوفر' : 'Assistant unavailable' })
        : t('common.loading')

  const plantContextLabel = useMemo(() => {
    if (!plantContext) return ''
    let timestamp: string | null = null
    if (plantContext.generatedAt && Number.isFinite(Date.parse(plantContext.generatedAt))) {
      try {
        timestamp = new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(plantContext.generatedAt))
      } catch {
        try {
          timestamp = new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(plantContext.generatedAt))
        } catch {
          timestamp = plantContext.generatedAt
        }
      }
    }
    return language === 'ar'
      ? timestamp
        ? `آخر فحص · ${timestamp}`
        : 'آخر فحص'
      : timestamp
        ? `Latest scan · ${timestamp}`
        : 'Latest scan'
  }, [language, plantContext])

  const typingLabel = useMemo(
    () =>
      t('smart_companion.typing', {
        fallback: language === 'ar' ? 'المساعد يكتب...' : 'Assistant is typing...',
      }),
    [language, t],
  )

  const handleSend = async (prompt?: string) => {
    if (isSending) return
    const content = (prompt ?? input).trim()
    if (!content) return

    setError(null)
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    }
    const conversation = [...messages, userMessage]
    setMessages(conversation)
    if (!prompt) {
      setInput('')
    }
    setIsSending(true)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30_000)

      const serialisedMessages = conversation
        .filter((message) => message.kind !== 'welcome')
        .map(({ role, content }) => ({ role, content }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: serialisedMessages,
          language,
          context: plantContext ? { plantInsights: plantContext } : undefined,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const payload = await response.json()
      if (!response.ok || !payload?.reply) {
        throw new Error(payload?.error || 'Failed to respond')
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: normaliseAssistantReply(String(payload.reply), language),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error('[Global Companion] Failed to reach assistant', err)
      const message = err instanceof Error ? err.message : ''
      setError(interpretCompanionError(message, language))
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSend()
  }

  const handlePromptClick = (prompt: string) => {
    setInput('')
    void handleSend(prompt)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  const sideClass = direction === 'rtl' ? 'left-4 items-start' : 'right-4 items-end'

  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-4 z-50 hidden md:flex flex-col gap-3',
        sideClass,
      )}
    >
      {isOpen && (
        <Card className="pointer-events-auto w-[min(860px,96vw)] overflow-hidden border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Bot className="size-5" />
              </span>
              <div className="text-sm">
                <p className="font-semibold leading-tight text-base">{title}</p>
                <p className="text-muted-foreground text-xs">{statusLabel}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('common.close')}
              onClick={() => setIsOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="mx-5 mt-3 rounded-2xl border border-lime-500/25 bg-lime-500/5 px-4 py-3 text-xs">
            <p className="font-semibold text-lime-100">
              {language === 'ar' ? 'إرشادات زراعية فورية' : 'Instant agronomy pointers'}
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-lime-50/90">
              {agriHighlights.map((tip, index) => (
                <li key={`agri-tip-${index}`} className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {plantContext && (
            <div className="mx-5 mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-100">
              <div className="flex items-center gap-2 font-medium">
                <Activity className="size-3.5 text-emerald-400" />
                <span>{language === 'ar' ? 'متصل بفحص النبات' : 'Plant diagnostics linked'}</span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-200/80">{plantContextLabel}</p>
              {plantContext.summary && (
                <p className="mt-1 text-[11px] leading-relaxed text-emerald-50/80">{plantContext.summary}</p>
              )}
            </div>
          )}

          <div ref={scrollRef} className="flex max-h-[min(90vh,780px)] flex-col gap-3 overflow-y-auto px-5 py-4">
            {messages
              .filter((message) => message.content)
              .map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col gap-1 text-sm',
                    message.role === 'user' ? (direction === 'rtl' ? 'items-start' : 'items-end') : direction === 'rtl' ? 'items-end' : 'items-start',
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs text-muted-foreground',
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                    )}
                  >
                    {message.role === 'user' ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                    <span>{message.role === 'user' ? (language === 'ar' ? 'أنت' : 'You') : assistantLabel}</span>
                  </div>
                  <div
                    className={cn(
                      'rounded-2xl px-3 py-2 text-sm shadow-sm ring-1 ring-border/60',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ring-primary/30'
                        : 'bg-muted/40 text-foreground dark:bg-muted/20',
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.role === 'assistant' ? normaliseAssistantReply(message.content, language) : message.content}
                    </p>
                  </div>
                </div>
              ))}
            {isSending && (
              <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', direction === 'rtl' ? 'justify-start' : 'justify-start')}>
                <Loader2 className="size-4 animate-spin" />
                <span>{typingLabel}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border/60 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {examples.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-dashed text-xs"
                  disabled={isSending}
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isSending}
                className="min-h-[96px] resize-none text-sm"
              />
              <div className="flex items-center justify-between gap-2">
                {error && <span className="text-destructive text-xs">{error}</span>}
                <Button type="submit" className="ml-auto" disabled={isSending || !input.trim()}>
                  {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="pointer-events-auto">
        <Button
          type="button"
          size="lg"
          className="rounded-full bg-primary shadow-lg shadow-primary/30 focus-visible:ring-primary/50 px-4 gap-2"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={launcherLabel}
        >
          <MessageCircle className="size-5" />
          <span className="hidden sm:inline text-sm font-semibold">Adham AgriTech Eng</span>
        </Button>
      </div>
    </div>
  )
}
