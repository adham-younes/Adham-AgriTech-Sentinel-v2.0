import React, { useState } from 'react'
import { useTranslation } from '@/lib/i18n/use-language'
import AgricultureResultCard from '@/components/AgricultureResultCard'
import { searchKnowledge } from '@/lib/api/agriKnowledge'

interface SearchResult {
    type: 'disease' | 'fertilizer' | 'pesticide' | 'soil'
    data: Record<string, any>
}

const AgricultureSearch: React.FC = () => {
    const { language } = useTranslation()
    const [query, setQuery] = useState('')
    const [type, setType] = useState<'disease' | 'fertilizer' | 'pesticide' | 'soil'>('disease')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async () => {
        if (!query.trim()) return
        setLoading(true)
        setError(null)
        try {
            const data = await searchKnowledge(query, type, language as 'ar' | 'en')
            // data is expected to have a property matching the type, e.g., data.diseases
            const items = (data?.[type + 's'] as any[]) || []
            const formatted = items.map(item => ({ type, data: item }))
            setResults(formatted)
        } catch (e) {
            setError('فشل في جلب البيانات')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="my-4 p-4 border rounded bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col md:flex-row gap-2 mb-4">
                <input
                    type="text"
                    placeholder={language === 'ar' ? 'ابحث عن مرض أو سماد...' : 'Search disease, fertilizer...'}
                    className="flex-1 p-2 border rounded"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
                <select
                    className="p-2 border rounded"
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                >
                    <option value="disease">🦠 {language === 'ar' ? 'مرض' : 'Disease'}</option>
                    <option value="fertilizer">🌱 {language === 'ar' ? 'سماد' : 'Fertilizer'}</option>
                    <option value="pesticide">🛡️ {language === 'ar' ? 'مبيد' : 'Pesticide'}</option>
                    <option value="soil">🔬 {language === 'ar' ? 'تربة' : 'Soil'}</option>
                </select>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={handleSearch}
                    disabled={loading}
                >
                    {loading ? (language === 'ar' ? 'جارٍ البحث...' : 'Searching...') : (language === 'ar' ? 'بحث' : 'Search')}
                </button>
            </div>
            {error && <p className="text-red-600 mb-2">{error}</p>}
            <div className="grid gap-4">
                {results.map((r, idx) => (
                    <AgricultureResultCard key={idx} type={r.type} data={r.data} language={language as 'ar' | 'en'} />
                ))}
            </div>
        </div>
    )
}

export default AgricultureSearch;
