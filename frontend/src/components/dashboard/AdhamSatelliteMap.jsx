"use client";
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Brand DNA
const BRAND = {
    base: '#0a0a0a',
    panel: '#141414',
    accent: '#00ff7f',
    accentDim: 'rgba(0, 255, 127, 0.1)',
};

// ESODA / Sentinel Hub Configuration
// Note: Sentinel Hub integration requires NEXT_PUBLIC_SENTINEL_ID env var
// For now, we'll use alternative satellite imagery providers
const INSTANCE_ID = process.env.NEXT_PUBLIC_SENTINEL_ID || '';
const SENTINEL_WMS_URL = INSTANCE_ID ? `https://services.sentinel-hub.com/ogc/wms/${INSTANCE_ID}` : '';

// Custom Map Controller to handle auto-zoom
const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
};

const AdhamSatelliteMap = ({ coords, esodaKey }) => {
    // Default to Cairo if no coords
    const center = coords && coords.length > 0 ? coords[0] : [30.0444, 31.2357];
    const [activeLayer, setActiveLayer] = useState('NDVI');

    // Dynamic WMS URL generator - only if Sentinel Hub is configured
    const getWmsUrl = (layer) => {
        if (!SENTINEL_WMS_URL) return null;
        return `${SENTINEL_WMS_URL}?REQUEST=GetMap&LAYERS=${layer}&MAXCC=20&FORMAT=image/png`;
    };

    return (
        <div className="w-full h-[600px] rounded-xl overflow-hidden border border-[#333] relative shadow-2xl group">
            {/* Brand HOC Wrapper Style */}
            <style>{`
        .leaflet-container { background: ${BRAND.base} !important; }
        .leaflet-control-layers { 
          background: ${BRAND.panel} !important; 
          color: white !important;
          border: 1px solid #333 !important;
          border-radius: 8px !important;
        }
        .leaflet-control-zoom a {
          background: ${BRAND.panel} !important;
          color: ${BRAND.accent} !important;
          border: 1px solid #333 !important;
        }
        .leaflet-control-zoom a:hover {
          background: ${BRAND.accent} !important;
          color: ${BRAND.base} !important;
        }
      `}</style>

            <MapContainer center={center} zoom={14} className="h-full w-full">
                <MapController center={center} zoom={14} />

                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Dark Matter">
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    </LayersControl.BaseLayer>

                    <LayersControl.Overlay checked name="Vegetation Health (NDVI)">
                        <TileLayer
                            url={getWmsUrl('NDVI')}
                            opacity={1.0}
                        />
                    </LayersControl.Overlay>

                    <LayersControl.Overlay name="Soil Moisture (Moisture Index)">
                        <TileLayer
                            url={getWmsUrl('MOISTURE_INDEX')}
                            opacity={1.0}
                        />
                    </LayersControl.Overlay>

                    <LayersControl.Overlay name="True Color">
                        <TileLayer
                            url={getWmsUrl('TRUE_COLOR')}
                            opacity={1.0}
                        />
                    </LayersControl.Overlay>
                </LayersControl>

                {coords && (
                    <Polygon positions={coords} pathOptions={{ color: BRAND.accent, fillColor: BRAND.accent, fillOpacity: 0.1 }} />
                )}
            </MapContainer>

            {/* Status Indicator (The Eye) */}
            <div className="absolute bottom-6 left-6 z-[400] bg-black/80 backdrop-blur-md px-4 py-3 rounded-lg border border-adham-accent/30 shadow-glow">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-3 h-3 bg-adham-accent rounded-full animate-pulse"></div>
                        <div className="absolute top-0 left-0 w-3 h-3 bg-adham-accent rounded-full animate-ping opacity-50"></div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 font-mono tracking-wider">SYSTEM STATUS</div>
                        <div className="text-sm text-adham-accent font-bold tracking-widest">SENTINEL: ONLINE</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdhamSatelliteMap;
