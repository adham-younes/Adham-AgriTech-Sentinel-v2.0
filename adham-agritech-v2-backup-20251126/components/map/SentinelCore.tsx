import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Environment variable for ESODA/Sentinel Hub instance ID
const WMS_URL = `https://services.sentinel-hub.com/ogc/wms/${process.env.NEXT_PUBLIC_ESODA_INSTANCE_ID}`;

// Define available layers
const layers = {
    NDVI: 'NDVI',
    MOISTURE: 'MOISTURE_INDEX',
    TRUE_COLOR: 'TRUE_COLOR',
};

// Helper component to fit map to GeoJSON bounds
function FitBounds({ geojson }: { geojson: GeoJSON.GeoJsonObject }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.geoJSON(geojson);
        map.fitBounds(layer.getBounds());
    }, [geojson, map]);
    return null;
}

interface SentinelCoreProps {
    /** GeoJSON polygon representing the field */
    userFieldPolygon: GeoJSON.GeoJsonObject;
}

export default function SentinelCore({ userFieldPolygon }: SentinelCoreProps) {
    const mapRef = useRef<any>(null);

    return (
        <MapContainer
            ref={mapRef}
            className="h-[60vh] w-full"
            center={[0, 0]}
            zoom={2}
            scrollWheelZoom={true}
        >
            <LayersControl position="topright">
                {Object.entries(layers).map(([key, layerName]) => (
                    <LayersControl.BaseLayer key={key} name={key} checked={key === 'TRUE_COLOR'}>
                        <TileLayer
                            url={WMS_URL}
                            layers={layerName}
                            format="image/png"
                            transparent={true}
                            attribution="© Sentinel Hub"
                        />
                    </LayersControl.BaseLayer>
                ))}
            </LayersControl>
            <GeoJSON data={userFieldPolygon} style={{ color: '#00E676', weight: 2 }} />
            <FitBounds geojson={userFieldPolygon} />
        </MapContainer>
    );
}
