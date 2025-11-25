export async function searchKnowledge(query: string, type: 'disease' | 'fertilizer' | 'pesticide' | 'soil', language: 'ar' | 'en') {
    const params = new URLSearchParams({
        query,
        type,
        language,
    })
    const response = await fetch(`/api/agricultural-knowledge?${params.toString()}`)
    if (!response.ok) {
        throw new Error('Failed to fetch agricultural knowledge')
    }
    const result = await response.json()
    if (!result.success) {
        throw new Error(result.error || 'Unknown error')
    }
    return result.data
}
