"use client";
import React, { useEffect, useRef, useState } from "react";
import { Map as MapIcon, Crosshair } from "lucide-react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ─── Metro Manila boundary polygon (lat/lon, clockwise) ─────────────────────
const METRO_MANILA_POLYGON: [number, number][] = [
  [14.765, 120.96], [14.765, 121.01], [14.72, 121.02], [14.71, 121.08],
  [14.68, 121.11], [14.62, 121.13], [14.57, 121.12], [14.54, 121.1],
  [14.49, 121.08], [14.46, 121.06], [14.4, 121.045], [14.38, 121.02],
  [14.38, 120.98], [14.42, 120.96], [14.47, 120.97], [14.5, 120.96],
  [14.59, 120.95], [14.66, 120.93], [14.72, 120.94], [14.765, 120.96],
];

function isInsideMetroManila(lat: number, lon: number): boolean {
  const poly = METRO_MANILA_POLYGON;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distanceToMMBoundary(lat: number, lon: number): number {
  const poly = METRO_MANILA_POLYGON;
  let minDist = Infinity;

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ay, ax] = poly[i];
    const [by, bx] = poly[j];

    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((lon - ax) * dx + (lat - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = ax + t * dx;
    const closestY = ay + t * dy;

    const d = Math.sqrt((lon - closestX) ** 2 + (lat - closestY) ** 2);
    if (d < minDist) minDist = d;
  }

  return isInsideMetroManila(lat, lon) ? minDist : -minDist;
}

interface HeatMapProps {
  weather: any;
  loading: boolean;
  status: { bgGradient: string; textColor: string; label: string };
}

function CityZoomButton({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  const handleZoom = () => map.flyTo([lat, lon], 11, { duration: 1.5 });

  return (
    <button
      onClick={handleZoom}
      className="absolute bottom-4 left-4 z-[400] bg-white text-white p-3 rounded-full shadow-lg hover:bg-slate-200 hover:scale-105 transition-all flex items-center justify-center"
      title="Find Me"
    >
      <Crosshair size={18} className="text-slate-400" />
    </button>
  );
}

// ─── Canvas Heatmap Layer ────────────────────────────────────────────────────
function CanvasHeatmapLayer({ gridData }: { gridData: any[] }) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !gridData || gridData.length === 0) return;

    const L = require("leaflet");

    const CanvasLayer = L.Layer.extend({
      onAdd(map: any) {
        const canvas = L.DomUtil.create("canvas", "leaflet-canvas-heatmap") as HTMLCanvasElement;
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.pointerEvents = "none";
        canvas.style.opacity = "0.80";

        map.getPanes().tilePane.appendChild(canvas);
        canvasRef.current = canvas;

        this._map = map;
        this._draw();

        map.on("zoom move resize", this._draw, this);
      },

      onRemove(map: any) {
        if (canvasRef.current) canvasRef.current.remove();
        map.off("zoom move resize", this._draw, this);
      },

      _draw() {
        const map = this._map;
        if (!map || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const size = map.getSize();
        canvas.width = size.x;
        canvas.height = size.y;

        const topLeft = map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(canvas, topLeft);

        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const STEP = 4; 
        const COLOR_STOPS = [
          { temp: 22, r: 59, g: 130, b: 246 }, 
          { temp: 26, r: 16, g: 185, b: 129 }, 
          { temp: 32, r: 245, g: 158, b: 11 }, 
          { temp: 39, r: 239, g: 68, b: 68 },  
          { temp: 44, r: 180, g: 20, b: 20 },  
        ];

        function tempToRgb(temp: number): [number, number, number] {
          if (temp <= COLOR_STOPS[0].temp) return [COLOR_STOPS[0].r, COLOR_STOPS[0].g, COLOR_STOPS[0].b];
          if (temp >= COLOR_STOPS[COLOR_STOPS.length - 1].temp) return [COLOR_STOPS[COLOR_STOPS.length - 1].r, COLOR_STOPS[COLOR_STOPS.length - 1].g, COLOR_STOPS[COLOR_STOPS.length - 1].b];
          
          for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
            const lo = COLOR_STOPS[i], hi = COLOR_STOPS[i + 1];
            if (temp >= lo.temp && temp <= hi.temp) {
              const f = (temp - lo.temp) / (hi.temp - lo.temp);
              return [
                Math.round(lo.r + f * (hi.r - lo.r)),
                Math.round(lo.g + f * (hi.g - lo.g)),
                Math.round(lo.b + f * (hi.b - lo.b)),
              ];
            }
          }
          return [239, 68, 68];
        }

        const projectedCities = gridData.map((city: any) => {
          const pt = map.latLngToContainerPoint([city.lat, city.lon]);
          return { x: pt.x, y: pt.y, temp: city.temp };
        });

        const imgData = ctx.createImageData(canvas.width, canvas.height);
        const data = imgData.data;

        for (let py = 0; py < canvas.height; py += STEP) {
          for (let px = 0; px < canvas.width; px += STEP) {
            let numerator = 0, denominator = 0;

            for (const city of projectedCities) {
              const dx = px - city.x, dy = py - city.y;
              const distSq = dx * dx + dy * dy;
              const safeDist = Math.max(distSq, 1);
              const w = 1 / Math.pow(safeDist, 1.5);
              numerator += city.temp * w;
              denominator += w;
            }

            const interpolatedTemp = numerator / denominator;
            const [r, g, b] = tempToRgb(interpolatedTemp);

            const latlng = map.containerPointToLatLng([px, py]);
            const dist = distanceToMMBoundary(latlng.lat, latlng.lng);

            if (dist < -0.012) continue;

            const FEATHER_DEG = 0.018;
            const edgeAlpha = dist >= FEATHER_DEG ? 1.0 : dist <= 0 ? 0.0 : dist / FEATHER_DEG;
            const smoothAlpha = edgeAlpha * edgeAlpha * (3 - 2 * edgeAlpha);
            const finalAlpha = Math.round(smoothAlpha * 185);
            
            if (finalAlpha === 0) continue;

            for (let oy = 0; oy < STEP && py + oy < canvas.height; oy++) {
              for (let ox = 0; ox < STEP && px + ox < canvas.width; ox++) {
                const idx = ((py + oy) * canvas.width + (px + ox)) * 4;
                data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = finalAlpha;
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        ctx.filter = `blur(${STEP * 3}px)`;
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = "none";
      },
    });

    const layer = new CanvasLayer();
    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [map, gridData]);

  return null;
}

// ─── Legend ──────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="absolute top-4 right-4 z-[400] bg-white/80 backdrop-blur-md rounded-xl px-3 py-2 flex flex-col gap-1 max-w-[140px] sm:max-w-none scale-90 sm:scale-100 origin-bottom-right">
      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
        Heat Index
      </p>
      {[
        { color: "bg-blue-500", label: "< 26°C", sub: "Chilly" },
        { color: "bg-emerald-500", label: "26–31°C", sub: "Good" },
        { color: "bg-amber-500", label: "32–38°C", sub: "Caution" },
        { color: "bg-red-500", label: "≥ 39°C", sub: "Danger" },
      ].map(({ color, label, sub }) => (
        <div key={sub} className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">{label}</span>
          <span className="text-[8px] sm:text-[9px] text-slate-500">{sub}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HeatMap({ weather, loading, status }: HeatMapProps) {
  // Add state to track if it's currently daytime
  const [isDaytime, setIsDaytime] = useState(true);

  // Check the time on mount and update every minute
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      // 6:00 AM (6) to 5:59 PM (17) is Daytime
      setIsDaytime(hour >= 6 && hour < 18);
    };

    checkTime(); // Run immediately
    const timer = setInterval(checkTime, 60000); // Check every 60 seconds
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className={`w-full h-[22rem] rounded-[2rem] animate-pulse border shadow-sm flex items-center justify-center ${isDaytime ? "bg-slate-100 border-slate-200" : "bg-slate-900 border-slate-800"}`}>
        <MapIcon className="animate-bounce text-slate-400" size={32} />
      </div>
    );
  }

  const lat = weather?.lat || 14.5995;
  const lon = weather?.lon || 120.9842;
  const gridData = weather?.heatmapGrid || [];

  // Determine styles and map URL based on the time of day
  const mapUrl = isDaytime 
    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    
  const mapBgColor = isDaytime ? "#f1f5f9" : "#1e293b";
  const containerBgClass = isDaytime ? "bg-slate-100" : "bg-slate-800";

  return (
    <div className="w-full h-75 p-6 sm:p-8 rounded-[2rem] bg-white shadow-sm transition-all duration-700">
      <div className="flex items-center gap-1.5 mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center sm:text-left">
          Heat Map
        </p>
      </div>

      <div className={`w-full h-55 sm:h-50 rounded-[1rem] overflow-hidden relative z-0 transition-colors duration-1000 ${containerBgClass}`}>
        <MapContainer
          center={[14.55, 121.02]}
          zoom={10}
          zoomControl={false}
          minZoom={10}
          maxBounds={[
            [14.35, 120.88],
            [14.78, 121.16],
          ]}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", backgroundColor: mapBgColor }}
        >
          <TileLayer key={isDaytime ? "light" : "dark"} url={mapUrl} />

          <CanvasHeatmapLayer gridData={gridData} />
          <CityZoomButton lat={lat} lon={lon} />
          <Legend />
        </MapContainer>
      </div>
    </div>
  );
}