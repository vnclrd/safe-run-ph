"use client";
import React, { useEffect, useRef } from "react";
import { Map as MapIcon, Crosshair } from "lucide-react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ─── Metro Manila boundary polygon (lat/lon, clockwise) ─────────────────────
// Traced along the actual administrative boundary of NCR
const METRO_MANILA_POLYGON: [number, number][] = [
  [14.765, 120.96], // Valenzuela NW
  [14.765, 121.01], // Valenzuela NE
  [14.72, 121.02], // Caloocan/QC north
  [14.71, 121.08], // Quezon City NE
  [14.68, 121.11], // Marikina north
  [14.62, 121.13], // Marikina east
  [14.57, 121.12], // Pasig/Marikina SE
  [14.54, 121.1], // Pateros/Taguig east
  [14.49, 121.08], // Taguig SE
  [14.46, 121.06], // Taguig south
  [14.4, 121.045], // Muntinlupa SE
  [14.38, 121.02], // Muntinlupa south
  [14.38, 120.98], // Muntinlupa SW
  [14.42, 120.96], // Las Piñas SW
  [14.47, 120.97], // Parañaque west
  [14.5, 120.96], // Pasay/Manila Bay
  [14.59, 120.95], // Manila west (bay)
  [14.66, 120.93], // Navotas/Malabon west
  [14.72, 120.94], // Malabon NW
  [14.765, 120.96], // close
];

/** Point-in-polygon test (ray casting) */
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

/**
 * Signed distance to the polygon boundary (in degrees).
 * Positive = inside, negative = outside.
 * Used to feather the alpha at edges for a smooth, non-blocky border.
 */
function distanceToMMBoundary(lat: number, lon: number): number {
  const poly = METRO_MANILA_POLYGON;
  let minDist = Infinity;

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ay, ax] = poly[i];
    const [by, bx] = poly[j];

    // Closest point on segment to (lat, lon)
    const dx = bx - ax,
      dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((lon - ax) * dx + (lat - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = ax + t * dx;
    const closestY = ay + t * dy;

    const d = Math.sqrt((lon - closestX) ** 2 + (lat - closestY) ** 2);
    if (d < minDist) minDist = d;
  }

  // Return positive inside, negative outside
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

// ─── Color Scale ────────────────────────────────────────────────────────────
// Maps a normalized intensity (0–1) to an RGBA color matching your status palette
function tempToRgba(intensity: number, alpha: number): string {
  // Gradient stops: blue → emerald → amber → red
  // Matching: CHILLY(<26°C) → GOOD(26–31°C) → CAUTION(32–38°C) → DANGER(≥39°C)
  const stops = [
    { t: 0.0, r: 59, g: 130, b: 246 }, // blue-500   (CHILLY)
    { t: 0.35, r: 16, g: 185, b: 129 }, // emerald-500 (GOOD)
    { t: 0.65, r: 245, g: 158, b: 11 }, // amber-500  (CAUTION)
    { t: 1.0, r: 239, g: 68, b: 68 }, // red-500    (DANGER)
  ];

  // Clamp
  const t = Math.min(Math.max(intensity, 0), 1);

  // Find the two stops we're between
  let lo = stops[0],
    hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }

  const range = hi.t - lo.t || 1;
  const f = (t - lo.t) / range;
  const r = Math.round(lo.r + f * (hi.r - lo.r));
  const g = Math.round(lo.g + f * (hi.g - lo.g));
  const b = Math.round(lo.b + f * (hi.b - lo.b));

  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Canvas Heatmap Layer ────────────────────────────────────────────────────
function CanvasHeatmapLayer({ gridData }: { gridData: any[] }) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !gridData || gridData.length === 0)
      return;

    const L = require("leaflet");

    // ── 1. Build a Leaflet canvas layer ──────────────────────────────────────
    const CanvasLayer = L.Layer.extend({
      onAdd(map: any) {
        const canvas = L.DomUtil.create(
          "canvas",
          "leaflet-canvas-heatmap",
        ) as HTMLCanvasElement;
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.pointerEvents = "none";
        canvas.style.opacity = "0.80";

        // tilePane sits below shadowPane, overlayPane, AND the label layer
        // so city names from the CARTO tile always render on top
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

        // Align canvas to map's top-left pixel origin
        const topLeft = map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(canvas, topLeft);

        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ── 2. IDW on a pixel grid ──────────────────────────────────────────
        const STEP = 4; // evaluate every 4px — smooth but fast

        // ABSOLUTE temperature scale anchored to your status thresholds:
        // CHILLY < 26°C | GOOD 26–31°C | CAUTION 32–38°C | DANGER ≥ 39°C
        // Gradient stops map these exact breakpoints to colors, so a city
        // at 34°C always renders amber regardless of its neighbors.
        const COLOR_STOPS = [
          { temp: 22, r: 59, g: 130, b: 246 }, // blue-500    (deep chilly)
          { temp: 26, r: 16, g: 185, b: 129 }, // emerald-500 (CHILLY→GOOD boundary)
          { temp: 32, r: 245, g: 158, b: 11 }, // amber-500   (GOOD→CAUTION boundary)
          { temp: 39, r: 239, g: 68, b: 68 }, // red-500     (DANGER)
          { temp: 44, r: 180, g: 20, b: 20 }, // deep red    (extreme danger)
        ];

        function tempToRgb(temp: number): [number, number, number] {
          if (temp <= COLOR_STOPS[0].temp) {
            const s = COLOR_STOPS[0];
            return [s.r, s.g, s.b];
          }
          if (temp >= COLOR_STOPS[COLOR_STOPS.length - 1].temp) {
            const s = COLOR_STOPS[COLOR_STOPS.length - 1];
            return [s.r, s.g, s.b];
          }
          for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
            const lo = COLOR_STOPS[i];
            const hi = COLOR_STOPS[i + 1];
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

        // Pre-project city coords to screen pixels once per draw
        const projectedCities = gridData.map((city: any) => {
          const pt = map.latLngToContainerPoint([city.lat, city.lon]);
          return { x: pt.x, y: pt.y, temp: city.temp };
        });

        const imgData = ctx.createImageData(canvas.width, canvas.height);
        const data = imgData.data;

        for (let py = 0; py < canvas.height; py += STEP) {
          for (let px = 0; px < canvas.width; px += STEP) {
            let numerator = 0;
            let denominator = 0;

            for (const city of projectedCities) {
              const dx = px - city.x;
              const dy = py - city.y;
              const distSq = dx * dx + dy * dy;
              const safeDist = Math.max(distSq, 1);
              const w = 1 / Math.pow(safeDist, 1.5);
              numerator += city.temp * w;
              denominator += w;
            }

            const interpolatedTemp = numerator / denominator;
            const [r, g, b] = tempToRgb(interpolatedTemp);

            // Feathered polygon clip — smooth circular fade at MM boundary
            const latlng = map.containerPointToLatLng([px, py]);
            const dist = distanceToMMBoundary(latlng.lat, latlng.lng);

            // Skip pixels clearly outside (with margin so feather has room)
            if (dist < -0.012) continue;

            // FEATHER_DEG: how many degrees from the boundary to fade over.
            // 0.018° ≈ ~2km in Metro Manila — wide enough to be smooth,
            // tight enough to stay within city boundaries.
            const FEATHER_DEG = 0.018;
            const edgeAlpha =
              dist >= FEATHER_DEG ? 1.0 : dist <= 0 ? 0.0 : dist / FEATHER_DEG;

            // Smooth the ramp with a cubic ease for a rounder edge feel
            const smoothAlpha = edgeAlpha * edgeAlpha * (3 - 2 * edgeAlpha);
            const finalAlpha = Math.round(smoothAlpha * 185);
            if (finalAlpha === 0) continue;

            // Fill STEP×STEP block
            for (let oy = 0; oy < STEP && py + oy < canvas.height; oy++) {
              for (let ox = 0; ox < STEP && px + ox < canvas.width; ox++) {
                const idx = ((py + oy) * canvas.width + (px + ox)) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = finalAlpha;
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // ── 3. Smooth the blocky pixels with a blur pass ────────────────────
        // This turns the STEP-grid into a perfectly smooth gradient
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
    <div
      className="
        absolute top-4 right-4 z-[400]
        bg-white/80 backdrop-blur-md rounded-xl
        px-3 py-2 flex flex-col gap-1

        max-w-[140px] sm:max-w-none
        scale-90 sm:scale-100
        origin-bottom-right
        "
    >
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
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">
            {label}
          </span>
          <span className="text-[8px] sm:text-[9px] text-slate-500">{sub}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HeatMap({ weather, loading, status }: HeatMapProps) {
  if (loading) {
    return (
      <div className="w-full h-[22rem] rounded-[2rem] bg-slate-900 animate-pulse border border-slate-800 shadow-sm flex items-center justify-center">
        <MapIcon className="animate-bounce text-slate-600" size={32} />
      </div>
    );
  }

  const lat = weather?.lat || 14.5995;
  const lon = weather?.lon || 120.9842;
  const gridData = weather?.heatmapGrid || [];

  return (
    <div className="w-full p-6 sm:p-8 rounded-[2rem] bg-white shadow-xl transition-all duration-700">
      <div className="flex items-center gap-1.5 mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center sm:text-left">
          Heat Map
        </p>
      </div>

      <div className="w-full h-64 sm:h-72 rounded-[1rem] overflow-hidden bg-slate-800 relative z-0">
        <MapContainer
          center={[14.55, 121.02]}
          zoom={10}
          zoomControl={false}
          minZoom={10}
          maxBounds={[
            [14.35, 120.88], // SW corner (beyond Muntinlupa/Las Piñas)
            [14.78, 121.16], // NE corner (beyond Valenzuela/Marikina)
          ]}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", backgroundColor: "#1e293b" }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

          <CanvasHeatmapLayer gridData={gridData} />
          <CityZoomButton lat={lat} lon={lon} />
          <Legend />
        </MapContainer>
      </div>
    </div>
  );
}
