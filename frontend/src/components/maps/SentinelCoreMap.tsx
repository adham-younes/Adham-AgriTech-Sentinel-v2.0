'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, LayersControl, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

// Fix Leaflet icon issues in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
});

interface SentinelCoreMapProps {
    onPolygonComplete?: (geoJson: any) => void;
    center?: [number, number];
    zoom?: number;
    viewId?: string | null; // If provided, we show the EOSDA layer
}

const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

export default function SentinelCoreMap({
    onPolygonComplete,
    center = [30.0444, 31.2357], // Cairo default
    zoom = 13,
    viewId
}: SentinelCoreMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-full w-full bg-[#121212] animate-pulse" />;

    return (
        <div className="h-full w-full relative z-0">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%', background: '#121212' }}
                zoomControl={false}
            >
                <MapController center={center} zoom={zoom} />

                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Dark Matter (CartoDB)">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                    </LayersControl.BaseLayer>

                    <LayersControl.BaseLayer name="Satellite (Esri)">
                        <TileLayer
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>

                    {viewId && (
                        <LayersControl.Overlay checked name="EOSDA Sentinel-2 (NDVI)">
                            {/* 
                  NOTE: This is a conceptual URL pattern. 
                  In a real implementation, we would need a proxy that forwards 
                  x/y/z to EOSDA's WMTS or similar service using the viewId.
                  For now, we assume /api/eosda/proxy handles this.
               */}
                            <TileLayer
                                url={`/api/eosda/proxy?viewId=${viewId}&z={z}&x={x}&y={y}&preset=NDVI`}
                                opacity={0.7}
                            />
                        </LayersControl.Overlay>
                    )}
                </LayersControl>

                <FeatureGroup>
                    <EditControl
                        position="topright"
                        onCreated={(e: any) => {
                            const layer = e.layer;
                            const geoJson = layer.toGeoJSON();
                            if (onPolygonComplete) onPolygonComplete(geoJson);
                        }}
                        draw={{
                            rectangle: false,
                            circle: false,
                            circlemarker: false,
                            marker: false,
                            polyline: false,
                            polygon: {
                                allowIntersection: false,
                                drawError: {
                                    color: '#e1e100',
                                    message: '<strong>Oh snap!<strong> you can\'t draw that!',
                                },
                                shapeOptions: {
                                    color: '#00FF9D',
                                    fillColor: '#00FF9D',
                                    fillOpacity: 0.2,
                                },
                            },
                        }}
                    />
                </FeatureGroup>
            </MapContainer>

            {/* Floating UI Controls Container - Can be used for custom buttons */}
            <div className="absolute bottom-8 right-4 z-[1000] flex flex-col gap-2">
                {/* Add custom controls here if needed */}
            </div>
        </div>
    );
}
