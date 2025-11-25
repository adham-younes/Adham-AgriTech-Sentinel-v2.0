type Bounds = [number, number][]

interface FetchOptions {
  bounds: Bounds
  date?: string
  width?: number
  height?: number
}

async function requestBinary(path: string, options: FetchOptions): Promise<Blob> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bounds: options.bounds,
      date: options.date ?? new Date().toISOString().split("T")[0],
      width: options.width,
      height: options.height,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request to ${path} failed (${response.status})`)
  }

  return await response.blob()
}

export default {
  async getSatelliteImage(bounds: Bounds, date?: string, size?: { width?: number; height?: number }) {
    return requestBinary("/api/sentinel/imagery", {
      bounds,
      date,
      width: size?.width,
      height: size?.height,
    })
  },

  async getNDVI(bounds: Bounds, date?: string, size?: { width?: number; height?: number }) {
    return requestBinary("/api/sentinel/ndvi", {
      bounds,
      date,
      width: size?.width,
      height: size?.height,
    })
  },
}
