"use client";
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'maplibre-gl/dist/maplibre-gl.css';

// Brand DNA
const BRAND = {
    base: '#0a0a0a',
    panel: '#141414',
    accent: '#00ff7f',
    accentDim: 'rgba(0, 255, 127, 0.1)',
    warning: '#f59e0b',
    danger: '#ef4444',
};

// Mapbox Configuration
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const AdhamSatelliteMap = ({ coords, fieldId, esodaKey }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(31.2357);
    const [lat, setLat] = useState(30.0444);
    const [zoom, setZoom] = useState(14);
    const [pitch, setPitch] = useState(60); // Initial 3D pitch
    const [mapLoaded, setMapLoaded] = useState(false);
    const [activeLayer, setActiveLayer] = useState('satellite'); // satellite, ndvi, moisture
    const [layerLoading, setLayerLoading] = useState(false);
    const [layerData, setLayerData] = useState(null);

    useEffect(() => {
        if (coords && Array.isArray(coords) && coords.length > 0) {
            // Validate coordinates format: should be [lat, lng] or [lng, lat]
            // Try to detect format by checking if first coord[0] is in valid lat range
            const firstCoord = coords[0];
            if (!firstCoord || !Array.isArray(firstCoord) || firstCoord.length < 2) {
                console.warn("[AdhamSatelliteMap] Invalid coordinate format:", firstCoord);
                return;
            }
            
            // Assume format is [lat, lng] if lat is between -90 and 90
            const isLatFirst = Math.abs(firstCoord[0]) <= 90;
            const lats = coords.map(c => isLatFirst ? c[0] : c[1]);
            const lngs = coords.map(c => isLatFirst ? c[1] : c[0]);
            
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            
            // Validate bounds
            if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLng) || isNaN(maxLng)) {
                console.warn("Invalid coordinate values");
                return;
            }
            
            setLat((minLat + maxLat) / 2);
            setLng((minLng + maxLng) / 2);
        }
    }, [coords]);

    // Fetch EOSDA Layer
    const fetchLayer = async (layerType) => {
        if (layerType === 'satellite') {
            setLayerData(null);
            return;
        }

        setLayerLoading(true);
        try {
            const response = await fetch('/api/eosda/imagery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fieldId: fieldId,
                    polygon: coords, // Fallback if fieldId fails or is missing
                    index: layerType === 'moisture' ? 'ndmi' : 'ndvi' // NDMI is often used for moisture
                })
            });

            if (!response.ok) throw new Error('Failed to fetch layer');

            const data = await response.json();
            if (data.imagery && data.imagery.imageUrl) {
                setLayerData(data);
            }
        } catch (error) {
            console.error("Layer fetch error:", error);
        } finally {
            setLayerLoading(false);
        }
    };

    useEffect(() => {
        if (activeLayer !== 'satellite') {
            fetchLayer(activeLayer);
        } else {
            setLayerData(null);
        }
    }, [activeLayer, fieldId]);

    // Update Map Layer
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // Remove existing raster layer if any
        if (map.current.getLayer('eosda-layer')) {
            map.current.removeLayer('eosda-layer');
        }
        if (map.current.getSource('eosda-source')) {
            map.current.removeSource('eosda-source');
        }

        if (layerData && layerData.imagery && layerData.imagery.imageUrl) {
            // Add new raster layer
            const bounds = layerData.imagery.bounds;
            // Mapbox image source expects [[minLng, maxLat], [maxLng, maxLat], [maxLng, minLat], [minLng, minLat]]
            // But 'image' source takes 'coordinates' array: top-left, top-right, bottom-right, bottom-left
            const coordinates = [
                [bounds.west, bounds.north], // Top Left
                [bounds.east, bounds.north], // Top Right
                [bounds.east, bounds.south], // Bottom Right
                [bounds.west, bounds.south]  // Bottom Left
            ];

            map.current.addSource('eosda-source', {
                type: 'image',
                url: layerData.imagery.imageUrl,
                coordinates: coordinates
            });

            map.current.addLayer({
                id: 'eosda-layer',
                type: 'raster',
                source: 'eosda-source',
                paint: {
                    'raster-opacity': 0.8,
                    'raster-fade-duration': 0
                }
            }, 'field-outline'); // Place below field outline
        }

    }, [layerData, mapLoaded]);

    useEffect(() => {
        if (map.current) return; // initialize map only once
        if (!MAPBOX_TOKEN) {
            console.error("Mapbox token is missing");
            setMapLoaded(true); // Set loaded even on error to show message
            return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Use Mapbox satellite style for better quality
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-v9', // Use Mapbox satellite style
            center: [lng, lat],
            zoom: zoom,
            pitch: pitch,
            bearing: 0, // Reset bearing for better view
            antialias: true,
            preserveDrawingBuffer: true // For better rendering
        });

        map.current.on('load', () => {
            setMapLoaded(true);

            // Add 3D terrain source only if Mapbox token is valid
            try {
                map.current.addSource('mapbox-dem', {
                    'type': 'raster-dem',
                    'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                    'tileSize': 512,
                    'maxzoom': 14
                });
                map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.2 }); // Reduced exaggeration for realism
            } catch (error) {
                console.warn("3D terrain not available:", error);
                // Continue without terrain
            }

            // Add sky layer only if terrain is available
            try {
                map.current.addLayer({
                    'id': 'sky',
                    'type': 'sky',
                    'paint': {
                        'sky-type': 'atmosphere',
                        'sky-atmosphere-sun': [0.0, 0.0],
                        'sky-atmosphere-sun-intensity': 10 // Reduced intensity
                    }
                });
            } catch (error) {
                console.warn("Sky layer not available:", error);
            }

            // Add navigation controls
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            if (coords && Array.isArray(coords) && coords.length > 0) {
                // Validate and convert coordinates to [lng, lat] format for Mapbox
                const firstCoord = coords[0];
                if (!Array.isArray(firstCoord) || firstCoord.length < 2) {
                    console.warn("Invalid coordinate format in map initialization");
                    return;
                }
                
                // Detect format: [lat, lng] or [lng, lat]
                const isLatFirst = Math.abs(firstCoord[0]) <= 90;
                const mapboxCoords = coords.map(c => {
                    if (!Array.isArray(c) || c.length < 2) return null;
                    return isLatFirst ? [c[1], c[0]] : [c[0], c[1]]; // Always [lng, lat] for Mapbox
                }).filter(c => c !== null);

                if (mapboxCoords.length < 3) {
                    console.warn("Not enough valid coordinates for polygon");
                    return;
                }

                // Close the polygon if not already closed
                if (mapboxCoords[0][0] !== mapboxCoords[mapboxCoords.length - 1][0] ||
                    mapboxCoords[0][1] !== mapboxCoords[mapboxCoords.length - 1][1]) {
                    mapboxCoords.push(mapboxCoords[0]);
                }

                map.current.addSource('field', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': [mapboxCoords]
                        },
                        'properties': {
                            'name': 'Field Boundary'
                        }
                    }
                });

                // Add field fill layer (2D for better compatibility)
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

                // Add field outline
                map.current.addLayer({
                    'id': 'field-outline',
                    'type': 'line',
                    'source': 'field',
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': BRAND.accent,
                        'line-width': 3,
                        'line-opacity': 0.8
                    }
                });

                // Fly to field with smooth animation
                const bounds = new mapboxgl.LngLatBounds();
                mapboxCoords.forEach(coord => bounds.extend(coord));
                map.current.fitBounds(bounds, { 
                    padding: 80,
                    duration: 1500,
                    maxZoom: 16
                });
            } else {
                // Default view for Egypt
                map.current.setCenter([31.2357, 30.0444]);
                map.current.setZoom(13);
            }
        });

        // Handle map errors gracefully
        map.current.on('error', (e) => {
            console.error("Map error:", e);
            setMapLoaded(true); // Show map even with errors
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Layer Controls */}
            {mapLoaded && (
                <div className="absolute top-6 left-6 z-[400] flex flex-col gap-2">
                    <div className="bg-black/80 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-lg">
                        <button
                            onClick={() => setActiveLayer('satellite')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all w-full text-left ${activeLayer === 'satellite' ? 'bg-primary text-black' : 'text-gray-300 hover:bg-white/10'}`}
                        >
                            🛰️ Satellite
                        </button>
                        <button
                            onClick={() => setActiveLayer('ndvi')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all w-full text-left ${activeLayer === 'ndvi' ? 'bg-primary text-black' : 'text-gray-300 hover:bg-white/10'}`}
                        >
                            🌱 NDVI Health
                        </button>
                        <button
                            onClick={() => setActiveLayer('moisture')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all w-full text-left ${activeLayer === 'moisture' ? 'bg-primary text-black' : 'text-gray-300 hover:bg-white/10'}`}
                        >
                            💧 Soil Moisture
                        </button>
                    </div>
                </div>
            )}

            {/* Status Indicator */}
            {mapLoaded && (
                <div className="absolute bottom-6 left-6 z-[400] bg-black/80 backdrop-blur-md px-4 py-3 rounded-lg border border-primary/30 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${layerLoading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                            {!layerLoading && <div className="absolute top-0 left-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></div>}
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 font-mono tracking-wider uppercase">Map Status</div>
                            <div className={`text-sm font-semibold ${layerLoading ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                {layerLoading ? 'Loading Layer...' : 'Live Satellite View'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend (Dynamic based on layer) */}
            {activeLayer === 'ndvi' && !layerLoading && (
                <div className="absolute bottom-6 right-6 z-[400] bg-black/80 backdrop-blur-md p-3 rounded-lg border border-white/10">
                    <div className="text-xs text-gray-400 mb-2">NDVI Index</div>
                    <div className="h-2 w-32 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>Low</span>
                        <span>High</span>
                    </div>
                </div>
            )}
            {activeLayer === 'moisture' && !layerLoading && (
                <div className="absolute bottom-6 right-6 z-[400] bg-black/80 backdrop-blur-md p-3 rounded-lg border border-white/10">
                    <div className="text-xs text-gray-400 mb-2">Moisture Index</div>
                    <div className="h-2 w-32 bg-gradient-to-r from-red-500 via-blue-300 to-blue-600 rounded-full"></div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>Dry</span>
                        <span>Wet</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdhamSatelliteMap;
