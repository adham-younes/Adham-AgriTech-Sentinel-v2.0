"use client"
import { useEffect, useState } from 'react'

type Result = { ok: boolean; username?: string; styles?: number; error?: string }

export default function MapboxTokenStatus() {
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/mapbox/validate', { cache: 'no-store' })
        const json = (await res.json()) as Result
        setResult(json)
      } catch (e: any) {
        setResult({ ok: false, error: e?.message || 'Failed to reach validation API' })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500" />
        Testing Mapbox server token...
      </div>
    )
  }

  if (!result) return null

  return (
    <div
      className={`rounded-md border p-3 text-sm ${
        result.ok ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'
      }`}
    >
      <div className="font-medium">Mapbox Token Test</div>
      {result.ok ? (
        <div className="mt-1">
          ✅ Server token valid. User: {result.username} · Styles: {result.styles}
        </div>
      ) : (
        <div className="mt-1">❌ {result.error || 'Validation failed'}</div>
      )}
    </div>
  )
}

