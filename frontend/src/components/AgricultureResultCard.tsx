import React from 'react'

interface AgricultureResultCardProps {
    type: 'disease' | 'fertilizer' | 'pesticide' | 'soil'
    data: Record<string, any>
    language: 'ar' | 'en'
}

export const AgricultureResultCard: React.FC<AgricultureResultCardProps> = ({ type, data, language }) => {
    if (!data) return null;

    const getTitle = () => {
        switch (type) {
            case 'disease':
                return language === 'ar' ? data.name_ar : data.name_en
            case 'fertilizer':
                return language === 'ar' ? data.name_ar : data.name_en
            case 'pesticide':
                return language === 'ar' ? data.name_ar : data.name_en
            case 'soil':
                return language === 'ar' ? data.parameter_ar || data.parameter : data.parameter
            default:
                return ''
        }
    }

    const getDescription = () => {
        switch (type) {
            case 'disease':
                return language === 'ar' ? data.symptoms_ar : data.symptoms_en
            case 'fertilizer':
                return language === 'ar' ? data.composition_ar : data.composition
            case 'pesticide':
                return language === 'ar' ? data.active_ingredient_ar : data.active_ingredient
            case 'soil':
                return language === 'ar' ? data.description_ar : data.description
            default:
                return ''
        }
    }

    const confidence = data.confidence || data.severity_level || null

    return (
        <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-gray-900 dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-2">{getTitle()}</h3>
            {confidence && (
                <p className="text-sm text-gray-600 mb-2">
                    {type === 'disease' ? `ثقة: ${confidence}%` : `مستوى: ${confidence}`}
                </p>
            )}
            <p className="text-sm mb-3">{getDescription()}</p>
            {type === 'disease' && data.treatment && (
                <p className="text-sm text-green-700">
                    {language === 'ar' ? `العلاج: ${data.treatment_ar || data.treatment}` : `Treatment: ${data.treatment}`}
                </p>
            )}
        </div>
    )
}

export default AgricultureResultCard;
