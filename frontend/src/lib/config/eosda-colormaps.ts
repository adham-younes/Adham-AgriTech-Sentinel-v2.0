/**
 * EOSDA Colormap Configuration
 * Predefined colormaps for vegetation indices
 * Based on official EOSDA API documentation
 */

export interface ColormapConfig {
    id?: string
    colormap?: string
    levels: string
    name: string
    description: string
    colors?: string[]
    thresholds?: number[]
}

/**
 * EOSDA Predefined Colormaps for Vegetation Indices
 * Each index has a specific colormap ID and value range
 */
export const EOSDA_COLORMAPS: Record<string, ColormapConfig> = {
    // NDVI - Normalized Difference Vegetation Index
    // Red (unhealthy) → Yellow → Green (healthy)
    NDVI: {
        id: 'a9bc6eceeef2a13bb88a7f641dca3aa0',
        levels: '-1,1',
        name: 'NDVI',
        description: 'Vegetation Health (Red=Unhealthy, Green=Healthy)',
        colors: [
            '#ad0028', '#c5142a', '#e02d2c', '#ef4c3a', '#fe6c4a',
            '#ff8d5a', '#ffab69', '#ffc67d', '#ffe093', '#ffefab',
            '#fdfec2', '#eaf7ac', '#d5ef94', '#b9e383', '#9bd873',
            '#77ca6f', '#53bd6b', '#14aa60', '#009755', '#007e47'
        ],
        thresholds: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]
    },

    // NDMI - Normalized Difference Moisture Index
    // Brown (dry) → Purple → Blue (moist)
    NDMI: {
        id: 'a53f2c53d3cbc1d424c35ac8dc883644',
        levels: '-1,1',
        name: 'NDMI',
        description: 'Soil Moisture (Brown=Dry, Blue=Moist)',
        colors: [
            '#af998c', '#b49e95', '#baa49e', '#bfaaa8', '#c5b0b2',
            '#cbb6bc', '#d0bbc5', '#d6c1cf', '#cbb9d2', '#baadd3',
            '#a8a0d5', '#9894d6', '#8788d7', '#767bd8', '#646ed9',
            '#5362da', '#4356db', '#3249dc', '#213ddd', '#0f30de'
        ]
    },

    // MSAVI - Modified Soil Adjusted Vegetation Index
    // Red (low) → Yellow → Green (high)
    MSAVI: {
        id: '5792d8fc39a4598f8a2c67b300982076',
        levels: '-1,1',
        name: 'MSAVI',
        description: 'Soil-Adjusted Vegetation Index',
        colors: [
            '#ad0028', '#fe6c4a', '#ff8d5a', '#ffab69', '#ffc67d',
            '#ffe093', '#ffefab', '#fdfec2', '#eaf7ac', '#d5ef94',
            '#b9e383', '#9bd873', '#77ca6f', '#53bd6b', '#14aa60',
            '#009755', '#007e47', '#00673a', '#005530', '#004728'
        ]
    },

    // RECI - Red-Edge Chlorophyll Index
    // Red (low chlorophyll) → Green (high chlorophyll)
    RECI: {
        id: 'fb5d32c26f571d52ea663a4a8f1e38e0',
        levels: '0,10',
        name: 'RECI',
        description: 'Chlorophyll Content (Red=Low, Green=High)',
        colors: [
            '#a50026', '#bc1626', '#d62f26', '#e54d34', '#f46d43',
            '#f88e52', '#fcac60', '#fdc675', '#fee08b', '#feefa5',
            '#fefebd', '#ecf7a5', '#d9ef8b', '#bfe37a', '#a4d869',
            '#84ca66', '#66bd63', '#3faa59', '#19974f', '#0c7e42'
        ],
        thresholds: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5]
    },

    // EVI - Enhanced Vegetation Index
    // Uses matplotlib rdylgn colormap
    EVI: {
        colormap: 'rdylgn',
        levels: '-1,1',
        name: 'EVI',
        description: 'Enhanced Vegetation Index'
    },

    // NDRE - Normalized Difference Red Edge
    // Uses same colormap as MSAVI
    NDRE: {
        colormap: 'rdylgn',
        levels: '-1,1',
        name: 'NDRE',
        description: 'Red Edge Vegetation Index'
    },

    // NDWI - Normalized Difference Water Index
    // Similar to NDMI
    NDWI: {
        colormap: 'blues',
        levels: '-1,1',
        name: 'NDWI',
        description: 'Water Index (Brown=Dry, Blue=Wet)'
    }
}

/**
 * Get colormap configuration for a specific layer
 */
export function getColormapConfig(layer: string): ColormapConfig | undefined {
    const upperLayer = layer.toUpperCase()
    return EOSDA_COLORMAPS[upperLayer]
}

/**
 * Get colormap URL parameters for EOSDA API
 */
export function getColormapParams(layer: string): string {
    const config = getColormapConfig(layer)
    if (!config) return ''

    const params = new URLSearchParams()

    if (config.id) {
        params.append('COLORMAP', config.id)
    } else if (config.colormap) {
        params.append('COLORMAP', config.colormap)
    }

    params.append('MIN_MAX', config.levels)

    return params.toString()
}

/**
 * Generate CSS gradient string from colors array
 */
export function generateGradient(colors: string[]): string {
    if (!colors || colors.length === 0) return ''

    const step = 100 / (colors.length - 1)
    const gradientStops = colors.map((color, index) => {
        const position = Math.round(index * step)
        return `${color} ${position}%`
    })

    return `linear-gradient(to right, ${gradientStops.join(', ')})`
}
