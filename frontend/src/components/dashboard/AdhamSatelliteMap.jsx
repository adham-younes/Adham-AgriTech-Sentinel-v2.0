/**
 * Adham Satellite Map Component
 * 
 * Wrapper around UnifiedEOSDAMap for backward compatibility.
 * Uses EOSDA API exclusively for all satellite imagery.
 * 
 * @module components/dashboard/AdhamSatelliteMap
 */

"use client"
import React from 'react'
import { UnifiedEOSDAMap } from '@/components/maps/unified-eosda-map'

/**
 * AdhamSatelliteMap - Unified EOSDA Map Component
 * 
 * @param {Object} props
 * @param {Array<Array<number>>} props.coords - Polygon coordinates [lng, lat] or [lat, lng]
 * @param {string} props.fieldId - Field ID
 * @param {string} props.esodaKey - EOSDA API key (deprecated, uses env var now)
 */
const AdhamSatelliteMap = ({ coords, fieldId, esodaKey }) => {
  // Convert coords format if needed
  const coordinates = coords && Array.isArray(coords) && coords.length > 0
    ? coords.map(c => {
        // Handle both [lat, lng] and [lng, lat] formats
        if (Array.isArray(c) && c.length >= 2) {
          const isLatFirst = Math.abs(c[0]) <= 90
          return isLatFirst ? [c[1], c[0]] : [c[0], c[1]] // Always [lng, lat]
        }
        return null
      }).filter(c => c !== null)
    : undefined

        return (
    <UnifiedEOSDAMap
      fieldId={fieldId}
      coordinates={coordinates}
      defaultLayer="true-color"
      availableLayers={['true-color', 'ndvi', 'ndmi', 'evi', 'soil-moisture', 'chlorophyll']}
      showLayerControls={true}
      showNavigationControls={true}
      height="600px"
      lang="ar"
    />
  )
}

export default AdhamSatelliteMap
