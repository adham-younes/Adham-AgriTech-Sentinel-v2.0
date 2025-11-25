'use client'

import { useState, useEffect, useRef, useMemo, useCallback, type ChangeEvent, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Sparkles, User, Bot, Upload, X, ChevronDown, ChevronUp, Clock, Leaf } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/use-language'
import { trackUsageEvent } from '@/lib/analytics'
import { DEFAULT_PLAN_ID } from '@/lib/domain/types/billing'

type Message = { id: string; role: 'user' | 'assistant'; content: string }
interface ImageAttachment {
  name: string
  data: string
  type: string
  size: number
}

interface PlantInsightMatch {
  id?: string | number
  preferredName: string
  scientificName?: string
  commonNames?: string[]
  probability?: number
  description?: string
  infoUrl?: string
  warnings?: string[]
}

interface PlantInspectionReport {
  provider: string
  generatedAt: string
  summary?: string
  notes?: string[]
  matches?: PlantInsightMatch[]
}

const PLANT_CONTEXT_STORAGE_KEY = 'adham-plant-report'
const PLANT_CONTEXT_EVENT = 'adham-plant-context-updated'
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_ATTACHMENTS = 4

export default function AIAssistantPage() {
  const { t, language, direction, toggleLanguage } = useTranslation()
  const isArabic = language === 'ar'
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<ImageAttachment[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [aiReady, setAiReady] = useState<boolean | null>(null)
  const [activeFieldId, setActiveFieldId] = useState(() => searchParams?.get('field') ?? '')
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false)
  const [plantReport, setPlantReport] = useState<PlantInspectionReport | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const historyPanelId = 'ai-assistant-mobile-history'

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!plantReport) {
      window.localStorage.removeItem(PLANT_CONTEXT_STORAGE_KEY)
      window.dispatchEvent(new Event(PLANT_CONTEXT_EVENT))
      return
    }
    const payload = {
      summary: plantReport.summary,
      provider: plantReport.provider,
      generatedAt: plantReport.generatedAt,
      matches: (plantReport.matches ?? []).slice(0, 3).map((match) => ({
        label: match.commonNames?.[0] ?? match.preferredName,
        probability: typeof match.probability === 'number' ? Math.round(match.probability) : undefined,
      })),
    }
    window.localStorage.setItem(PLANT_CONTEXT_STORAGE_KEY, JSON.stringify(payload))
    window.dispatchEvent(new Event(PLANT_CONTEXT_EVENT))
  }, [plantReport])

  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch (error) {
      console.warn('[AI Assistant] Supabase client unavailable:', error)
      return null
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    let cancelled = false

    async function trackView() {
      try {
        if (!supabase) return
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user || cancelled) return

        await trackUsageEvent({
          userId: user.id,
          featureId: 'ai.assistant',
          action: 'view',
          planId: DEFAULT_PLAN_ID,
        })
      } catch {
        // Analytics is best-effort only.
      }
    }

    void trackView()

    return () => {
      cancelled = true
    }
  }, [supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (supabase) {
      void loadChatHistory()
    }
  }, [supabase])

  useEffect(() => {
    async function checkProviders() {
      try {
        const res = await fetch('/api/ai-assistant/providers', { cache: 'no-store' })
        if (!res.ok) {
          setAiReady(null)
          return
        }
        const payload = await res.json()
        if (typeof payload?.availableCount === 'number') {
          setAiReady(payload.availableCount > 0)
        } else {
          setAiReady(null)
        }
      } catch {
        setAiReady(null)
      }
    }
    void checkProviders()
  }, [])

  const exampleQuestions = useMemo(
    () => [t('ai_assistant.example1'), t('ai_assistant.example2'), t('ai_assistant.example3')],
    [language, t],
  )
  const historyToggleLabel = isMobileHistoryOpen ? t('ai_assistant.history_toggle.hide') : t('ai_assistant.history_toggle.show')

  async function loadChatHistory() {
    try {
      if (!supabase) return
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setChatHistory(data || [])
    } catch (error) {
      console.error('[AI Assistant] Error loading chat history:', error)
    }
  }

  const helperText = isArabic
    ? `ارفع حتى ${MAX_ATTACHMENTS} صور PNG أو JPG (بحد أقصى 8 ميجابايت لكل صورة) لتحليلها داخل منصة أدهم.`
    : `Upload up to ${MAX_ATTACHMENTS} PNG or JPG images (max 8 MB each) for in-platform analysis.`

  const addImageLabel = isArabic ? 'إضافة صورة' : 'Add image'

  const interpretAssistantError = useCallback(
    (raw?: string) => {
      const fallback = isArabic
        ? 'تعذر تشغيل المساعد الآن. حاول مجددًا بعد لحظات.'
        : 'The assistant is unavailable right now. Please try again shortly.'
      if (!raw) return fallback
      const normalized = raw.toLowerCase()
      if (normalized.includes('unsupported content') || normalized.includes('content fields')) {
        return isArabic
          ? 'لا يمكن تحليل هذا النوع من الملفات حاليًا. استخدم صور PNG أو JPG لا تتجاوز 8 ميجابايت.'
          : 'This file type is not supported yet. Please use PNG or JPG images under 8 MB.'
      }
      if (normalized.includes('unauthorized') || normalized.includes('api key')) {
        return isArabic
          ? 'حدثت مشكلة في إعداد المساعد. حاول مرة أخرى لاحقًا أو تواصل مع مسؤول المنصة.'
          : 'There seems to be a configuration issue with the assistant. Please try again later or contact your platform admin.'
      }
      if (normalized.includes('rate limit')) {
        return isArabic ? 'تم بلوغ الحد الأقصى للطلبات. انتظر قليلاً ثم أعد المحاولة.' : 'You hit the request limit. Wait a moment and retry.'
      }
      return fallback
    },
    [isArabic],
  )

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const remainingSlots = Math.max(0, MAX_ATTACHMENTS - attachments.length)
    if (remainingSlots === 0) {
      setAttachmentError(
        isArabic ? 'وصلت إلى الحد الأقصى للصور المسموح بها.' : 'You already attached the maximum number of images.',
      )
      event.target.value = ''
      return
    }

    const selectedFiles = files.slice(0, remainingSlots)
    let rejected = 0

    selectedFiles.forEach((file) => {
      const type = file.type?.toLowerCase() ?? ''
      if (!SUPPORTED_IMAGE_TYPES.has(type) || file.size > MAX_IMAGE_BYTES) {
        rejected += 1
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAttachments((prev) => [...prev, { name: file.name, data: reader.result as string, type: file.type, size: file.size }])
        }
      }
      reader.readAsDataURL(file)
    })

    setAttachmentError(
      rejected > 0
        ? isArabic
          ? 'تم تجاهل بعض الملفات لأنها ليست بصيغة PNG أو JPG أو لأنها أكبر من 8 ميجابايت.'
          : 'Some files were skipped because they are not PNG/JPG or exceed 8 MB.'
        : null,
    )

    event.target.value = ''
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => {
      const next = prev.filter((_, idx) => idx !== index)
      if (next.length === 0) {
        setAttachmentError(null)
      }
      return next
    })
  }

  const appendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const saveHistory = async (prompt: string, reply: string) => {
    if (!supabase) return
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('ai_chat_history').insert({ user_id: user.id, message: prompt, response: reply, language })
    } catch (error) {
      console.error('[AI Assistant] Error saving history:', error)
    }
  }

  const sendChat = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const trimmed = input.trim()
    const shouldUseDefaultPrompt = trimmed.length === 0 && attachments.length > 0
    if (!trimmed && attachments.length === 0) return

    const userContent = shouldUseDefaultPrompt
      ? isArabic
        ? 'حلل الصور المرفوعة وحدد حالة المحصول والتربة مع الحلول المقترحة.'
        : 'Analyse the attached imagery, diagnose crop and soil status, and recommend precise actions.'
      : trimmed

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userContent,
    }
    const usedAttachments = attachments.length > 0

    appendMessage(userMessage)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
          language,
          fieldId: activeFieldId || undefined,
          images: attachments,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as { reply?: unknown; error?: string; plantInsights?: PlantInspectionReport }
      if (!response.ok || !data?.reply) {
        const friendlyError = interpretAssistantError(data?.error ?? (data as any)?.message)
        appendMessage({
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: friendlyError,
        })
        if (usedAttachments) {
          setPlantReport(null)
        }
        return
      }

      if (data?.plantInsights) {
        setPlantReport(data.plantInsights as PlantInspectionReport)
      } else if (usedAttachments) {
        setPlantReport(null)
      }
      const replyContent = String(data.reply)

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
      }
      appendMessage(assistantMessage)
      await saveHistory(userContent, replyContent)
    } catch (error) {
      console.error('[AI Assistant] Request failed:', error)
      const fallback = isArabic
        ? 'تعذر إرسال الطلب، يرجى المحاولة مرة أخرى بعد قليل.'
        : 'Unable to reach the assistant. Please try again shortly.'
      appendMessage({ id: `assistant-${Date.now()}`, role: 'assistant', content: fallback })
    } finally {
      setAttachments([])
      setAttachmentError(null)
      setIsLoading(false)
    }
  }

  const renderHistoryCard = (extraClasses?: string) => (
    <Card className={`p-4 ${extraClasses ?? ''}`}>
      <h3 className="font-semibold mb-4 text-base sm:text-lg">{t('ai_assistant.recent_chats')}</h3>
      {chatHistory.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t('ai_assistant.no_history')}</p>
      ) : (
        <div className="space-y-3">
          {chatHistory.slice(0, 5).map((chat) => (
            <div key={chat.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <p className="text-sm font-medium line-clamp-2 mb-1">{chat.message}</p>
              <p className="text-xs text-muted-foreground">
                {formatChatTimestamp(chat.created_at, isArabic)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  const renderPlantReportCard = () => {
    if (!plantReport) return null
    const title = isArabic ? 'تحليل صور الحقول' : 'Field imagery insights'
    const generatedAt = formatPlantReportTimestamp(plantReport.generatedAt, isArabic)
    const matches = plantReport.matches ?? []
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{generatedAt}</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <Leaf className="h-3.5 w-3.5 text-emerald-500" />
            {isArabic ? 'محرك AYMA' : 'AYMA Engine'}
          </Badge>
        </div>
        {plantReport.summary && <p className="text-sm leading-relaxed">{plantReport.summary}</p>}
        {plantReport.notes?.length ? (
          <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
            {plantReport.notes.map((note, idx) => (
              <li key={`plant-note-${idx}`}>{note}</li>
            ))}
          </ul>
        ) : null}
        {matches.length ? (
          <div className="space-y-3">
            {matches.map((match, index) => (
              <div key={`${match.id ?? match.preferredName}-${index}`} className="rounded-lg border border-white/10 bg-background/60 p-3 space-y-1">
                <p className="text-sm font-semibold">
                  {index + 1}. {match.commonNames?.[0] ?? match.preferredName}
                </p>
                {match.scientificName && <p className="text-xs italic text-muted-foreground">{match.scientificName}</p>}
                {typeof match.probability === 'number' && (
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? `الثقة التقريبية: ${match.probability}%` : `Approx. confidence: ${match.probability}%`}
                  </p>
                )}
                {match.description && <p className="text-xs text-muted-foreground leading-relaxed">{match.description}</p>}
                {match.infoUrl && (
                  <a
                    href={match.infoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {isArabic ? 'المزيد من التفاصيل' : 'Learn more'}
                  </a>
                )}
                {match.warnings?.length ? (
                  <p className="text-xs text-amber-400">
                    {isArabic ? 'تحذير:' : 'Warning:'} {match.warnings.join(isArabic ? '، ' : ', ')}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {isArabic ? 'لم يتم تسجيل تطابقات عالية الثقة من الصور الأخيرة.' : 'No high-confidence matches were returned for the latest upload.'}
          </p>
        )}
      </div>
    )
  }

  function formatPlantReportTimestamp(value: string | undefined, isArabicLang: boolean): string {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const primaryLocale = isArabicLang ? 'ar-EG' : 'en-US'
    try {
      return date.toLocaleString(primaryLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      } as Intl.DateTimeFormatOptions)
    } catch {
      try {
        return date.toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        } as Intl.DateTimeFormatOptions)
      } catch {
        return value
      }
    }
  }

  function formatChatTimestamp(value: string, isArabicLang: boolean): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    const primaryLocale = isArabicLang ? "ar-EG" : "en-US"
    try {
      return date.toLocaleString(primaryLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      } as Intl.DateTimeFormatOptions)
    } catch {
      try {
        return date.toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        } as Intl.DateTimeFormatOptions)
      } catch {
        return value
      }
    }
  }

  return (
    <div className="space-y-6 lg:space-y-8 w-full max-w-7xl xl:max-w-[1400px] mx-auto px-3 sm:px-4" dir={direction}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            {t('ai_assistant.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('ai_assistant.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleLanguage} className="w-full sm:w-auto">
          {language === 'ar' ? t('ai_assistant.language_toggle.label_en') : t('ai_assistant.language_toggle.label_ar')}
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-background/40 p-4 sm:p-5 text-sm text-white/80 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 max-w-2xl">
          <p className="font-semibold">
            {isArabic
              ? 'اربط المحادثة بحقل محدد للحصول على صور وتحليلات المنصة الحية.'
              : 'Link the chat to a specific field to bring in live Adham satellite analytics.'}
          </p>
          <span className="text-xs text-muted-foreground block">
            {isArabic ? 'انسخ معرف الحقل من لوحة الأقمار الصناعية أو أدخله يدويًا.' : 'Copy the field ID from the satellite dashboard or enter it manually.'}
          </span>
        </div>
        <div className="w-full sm:max-w-sm">
          <Input
            placeholder={isArabic ? 'مثال: field-alpha' : 'e.g. field-alpha'}
            value={activeFieldId}
            onChange={(event) => setActiveFieldId(event.target.value.trim())}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:gap-8 lg:grid-cols-1 xl:grid-cols-[minmax(0,3.5fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <Card className="flex flex-col min-h-[72dvh] sm:min-h-[480px] lg:min-h-[520px] xl:h-[820px]">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {aiReady === false && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  {isArabic
                    ? 'المساعد غير متاح حاليًا على هذا الحساب. إذا استمر ظهور هذه الرسالة، يرجى التواصل مع مسؤول المنصة.'
                    : 'The assistant is currently unavailable for this workspace. If this keeps appearing, please contact your platform administrator.'}
                </div>
              )}
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{t('ai_assistant.title')}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">{t('ai_assistant.subtitle')}</p>
                  </div>
                  <div className="space-y-3 w-full max-w-md">
                    <p className="text-sm font-medium text-muted-foreground">{t('ai_assistant.examples_title')}</p>
                    {exampleQuestions.map((question, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-start h-auto py-3 px-4 bg-transparent"
                        onClick={() => setInput(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg px-4 py-3 max-w-[95%] sm:max-w-[85%] xl:max-w-[75%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="rounded-lg px-4 py-3 bg-muted">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form onSubmit={sendChat} className="p-4 border-t space-y-3">
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelection} className="hidden" />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                <span>{helperText}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 w-full sm:w-auto justify-center"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= MAX_ATTACHMENTS || isLoading}
                >
                  <Upload className="h-4 w-4" />
                  {addImageLabel}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="gap-2 w-full sm:w-auto justify-center bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= MAX_ATTACHMENTS || isLoading}
                >
                  <Leaf className="h-4 w-4" />
                  {isArabic ? 'فحص المحصول' : 'Scan Crop'}
                </Button>
              </div>

              {attachments.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {attachments.map((attachment, index) => (
                    <div key={`${attachment.name}-${index}`} className="relative rounded-lg border border-primary/20 bg-muted/40 p-3 pr-9">
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-destructive"
                        aria-label={isArabic ? 'إزالة الصورة' : 'Remove image'}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-md border border-primary/10 bg-background/60">
                          <img src={attachment.data} alt={attachment.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.size / 1024).toFixed(1)} KB • {attachment.type || 'image'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {attachmentError && <p className="text-xs text-destructive">{attachmentError}</p>}

              {renderPlantReportCard()}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={attachments.length > 0 ? (isArabic ? 'اشرح الصور أو اترك الحقل فارغاً للتحليل التلقائي' : 'Add notes about the imagery or leave blank for automatic analysis') : t('ai_assistant.placeholder')}
                  disabled={isLoading}
                  className="flex-1"
                  dir={direction}
                />
                <Button type="submit" disabled={isLoading || (!input.trim() && attachments.length === 0)} className="gap-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t('ai_assistant.send')}
                </Button>
              </div>
            </form>
          </Card>
          <div className="lg:hidden">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() => setIsMobileHistoryOpen((prev) => !prev)}
              aria-expanded={isMobileHistoryOpen}
              aria-controls={historyPanelId}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                {historyToggleLabel}
              </span>
              {isMobileHistoryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {isMobileHistoryOpen && (
              <div id={historyPanelId} className="mt-3">
                {renderHistoryCard()}
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block lg:pl-2">
          {renderHistoryCard('lg:sticky lg:top-4')}
        </div>
      </div>
    </div>
  )
}
