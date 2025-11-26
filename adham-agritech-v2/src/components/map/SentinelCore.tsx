"use client";

import { useMemo, useState, useEffect } from "react";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { LatLngBoundsExpression, PathOptions } from "leaflet";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";

import { useAgriContext } from "@/hooks/useAgriContext";

const layerOptions = [
  { id: "TRUE_COLOR", label: "True Color" },
  { id: "NDVI", label: "NDVI" },
  { id: "MOISTURE_INDEX", label: "Moisture" },
];

const TILE_MATRIX_SET = "PopularWebMercator512";
const defaultCenter: [number, number] = [30.0444, 31.2357]; // Cairo fallback

function computeBounds(feature?: Feature<Polygon | MultiPolygon>): LatLngBoundsExpression | null {
  if (!feature) return null;
  const geometry = feature.geometry;
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;

  const consume = (coords: number[][]) => {
    coords.forEach(([lng, lat]) => {
      minLat = Math.min(minLat, lat);
      minLng = Math.min(minLng, lng);
      maxLat = Math.max(maxLat, lat);
      maxLng = Math.max(maxLng, lng);
    });
  };

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring) => consume(ring));
  } else {
    geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => consume(ring));
    });
  }

  if (!Number.isFinite(minLat) || !Number.isFinite(minLng)) {
    return null;
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

function buildTileUrl(instanceId: string, layerId: string) {
  const base = `https://services.sentinel-hub.com/ogc/wms/${instanceId}`;
  const params = [
    "SERVICE=WMS",
    "REQUEST=GetMap",
    `LAYERS=${layerId}`,
    "MAXCC=30",
    "FORMAT=image/png",
    "TRANSPARENT=true",
    "SHOWLOGO=false",
    "STYLE=default",
    `TILEMATRIXSET=${TILE_MATRIX_SET}`,
    "TILEMATRIX={z}",
    "TILEROW={y}",
    "TILECOL={x}",
  ];
  return `${base}?${params.join("&")}`;
}

interface SentinelCoreProps {
  fieldGeometry?: Feature<Polygon | MultiPolygon>;
  ndvi?: number | null;
  moisture?: number | null;
}

function BoundsController({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [bounds, map]);
  return null;
}

export function SentinelCore({ fieldGeometry, ndvi = null, moisture = null }: SentinelCoreProps) {
  const [activeLayer, setActiveLayer] = useState(layerOptions[0].id);
  const bounds = useMemo(() => computeBounds(fieldGeometry), [fieldGeometry]);
  const { setMetricsContext } = useAgriContext();
  const instanceId = process.env.NEXT_PUBLIC_ESODA_INSTANCE_ID;

  useEffect(() => {
    setMetricsContext(ndvi ?? null, moisture ?? null);
  }, [ndvi, moisture, setMetricsContext]);

  const tileUrl = useMemo(() => {
    if (!instanceId) return null;
    return buildTileUrl(instanceId, activeLayer);
  }, [instanceId, activeLayer]);

  const boundaryStyle: PathOptions = useMemo(
    () => ({ color: "#00E676", weight: 2, fillColor: "#00E676", fillOpacity: 0.15 }),
    []
  );

  return (
    <div className="relative h-full w-full">
      {!instanceId && (
        <div className="absolute inset-4 z-10 rounded-2xl border border-danger/50 bg-black/80 p-6 text-danger">
          NEXT_PUBLIC_ESODA_INSTANCE_ID is missing. Configure it to load Sentinel layers.
        </div>
      )}
      <div className="absolute left-4 top-4 z-20 flex flex-col gap-2 rounded-2xl border border-primary/20 bg-black/80 p-4 shadow-lg shadow-primary/20">
        <p className="text-sm uppercase tracking-wide text-muted">Layers</p>
        <div className="flex flex-wrap gap-2">
          {layerOptions.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id)}
              className={`rounded-full px-4 py-1 text-sm transition ${
                activeLayer === layer.id
                  ? "bg-primary text-background shadow shadow-primary/60"
                  : "bg-surface text-muted hover:text-primary"
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>
      <div className="absolute right-4 top-4 z-20 rounded-2xl border border-primary/30 bg-black/80 px-4 py-3 text-sm text-muted">
        <p>
          NDVI: <span className="text-primary font-semibold">{ndvi?.toFixed(2) ?? "--"}</span>
        </p>
        <p>
          Moisture: <span className="text-primary font-semibold">{moisture ? `${(moisture * 100).toFixed(1)}%` : "--"}</span>
        </p>
      </div>
      {tileUrl && (
        <MapContainer
          center={defaultCenter}
          zoom={11}
          scrollWheelZoom
          className="h-full w-full rounded-2xl"
          style={{ minHeight: "100%", background: "transparent" }}
        >
          <TileLayer
            url={tileUrl}
            attribution='Imagery © <a href="https://www.sentinel-hub.com/">Sentinel Hub</a>'
          />
          <BoundsController bounds={bounds} />
          {fieldGeometry && (
            <GeoJSON
              key={fieldGeometry.id ?? "field-footprint"}
              data={fieldGeometry}
              style={() => boundaryStyle}
            />
          )}
        </MapContainer>
      )}
    </div>
  );
}
