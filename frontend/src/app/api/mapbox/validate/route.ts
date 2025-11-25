import { NextResponse } from 'next/server'

export async function GET() {
  const secretToken = process.env.MAPBOX_SECRET_TOKEN
  const username = process.env.MAPBOX_USERNAME

  if (!secretToken) {
    return NextResponse.json(
      { ok: false, error: 'MAPBOX_SECRET_TOKEN is not set on server' },
      { status: 500 }
    )
  }

  if (!username) {
    return NextResponse.json(
      { ok: false, error: 'MAPBOX_USERNAME is not set on server' },
      { status: 400 }
    )
  }

  try {
    const url = `https://api.mapbox.com/styles/v1/${encodeURIComponent(
      username
    )}?access_token=${encodeURIComponent(secretToken)}`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { ok: false, error: `HTTP ${res.status} ${res.statusText}`, details: text },
        { status: res.status }
      )
    }

    const data = (await res.json()) as unknown[]
    return NextResponse.json({ ok: true, username, styles: Array.isArray(data) ? data.length : 0 })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}

