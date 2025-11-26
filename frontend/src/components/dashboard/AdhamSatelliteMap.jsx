"use client";
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Brand DNA
const BRAND = {
    base: '#0a0a0a',
    panel: '#141414',
    accent: '#00ff7f',
    accentDim: 'rgba(0, 255, 127, 0.1)',
};

// Mapbox Configuration
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const AdhamSatelliteMap = ({ coords, esodaKey }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(31.2357);
    const [lat, setLat] = useState(30.0444);
    const [zoom, setZoom] = useState(14);
    const [pitch, setPitch] = useState(60); // Initial 3D pitch
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (coords && coords.length > 0) {
            // Calculate center of polygon
            const lats = coords.map(c => c[0]);
            const lngs = coords.map(c => c[1]);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            setLat((minLat + maxLat) / 2);
            setLng((minLng + maxLng) / 2);
        }
    }, [coords]);

    useEffect(() => {
        if (map.current) return; // initialize map only once
        if (!MAPBOX_TOKEN) {
            console.error("Mapbox token is missing");
            setMapLoaded(true); // Set loaded even on error to show message
            return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [lng, lat],
            zoom: zoom,
            pitch: pitch,
            bearing: -17.6,
            antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
        });

        map.current.on('load', () => {
            setMapLoaded(true);

            // Add 3D terrain source
            map.current.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });
            // add the DEM source as a terrain layer with exaggerated height
            map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

            // Add sky layer for atmospheric effect
            map.current.addLayer({
                'id': 'sky',
                'type': 'sky',
                'paint': {
                    'sky-type': 'atmosphere',
                    'sky-atmosphere-sun': [0.0, 0.0],
                    'sky-atmosphere-sun-intensity': 15
                }
            });

            if (coords && coords.length > 0) {
                // Add polygon source and layer
                // Mapbox expects [lng, lat], Leaflet uses [lat, lng]. 
                // Assuming coords prop is [lat, lng] from previous Leaflet usage, we need to swap.
                const mapboxCoords = coords.map(c => [c[1], c[0]]);

                map.current.addSource('field', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': [mapboxCoords]
                        }
                    }
                });

                map.current.addLayer({
                    'id': 'field-fill',
                    'type': 'fill',
                    'source': 'field',
                    'layout': {},
                    'paint': {
                        'fill-color': BRAND.accent,
                        'fill-opacity': 0.2
                    }
                });

                map.current.addLayer({
                    'id': 'field-outline',
                    'type': 'line',
                    'source': 'field',
                    'layout': {},
                    'paint': {
                        'line-color': BRAND.accent,
                        'line-width': 2
                    }
                });

                // Fly to field
                const bounds = new mapboxgl.LngLatBounds();
                mapboxCoords.forEach(coord => bounds.extend(coord));
                map.current.fitBounds(bounds, { padding: 50 });
            }
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [lng, lat, zoom, pitch]);

    if (!MAPBOX_TOKEN) {
        return (
            <div className="w-full h-[600px] rounded-xl overflow-hidden border border-[#333] relative shadow-2xl flex items-center justify-center bg-black/40">
                <div className="text-center p-6">
                    <p className="text-red-400 font-semibold mb-2">خطأ في التكوين</p>
                    <p className="text-sm text-gray-400">Mapbox access token is missing</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[600px] rounded-xl overflow-hidden border border-[#333] relative shadow-2xl group">
            <div ref={mapContainer} className="h-full w-full" />

            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adham-accent"></div>
                </div>
            )}

            {/* Status Indicator (The Eye) */}
            {mapLoaded && (
                <div className="absolute bottom-6 left-6 z-[400] bg-black/80 backdrop-blur-md px-4 py-3 rounded-lg border border-adham-accent/30 shadow-glow">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-3 h-3 bg-adham-accent rounded-full animate-pulse"></div>
                            <div className="absolute top-0 left-0 w-3 h-3 bg-adham-accent rounded-full animate-ping opacity-50"></div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 font-mono tracking-wider">SYSTEM STATUS</div>
                            <div className="text-sm text-adham-accent font-bold tracking-widest">3D TWIN: ONLINE</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdhamSatelliteMap;
