import recommendations from "@/lib/recommendations.json";
import metricMsgs from "@/lib/metrics.json";

export function getHeatIndexColor(heatIndex: number): string {
  if (heatIndex < 26) return "#3b82f6"; // Chilly (Blue)
  if (heatIndex <= 31) return "#10b981"; // Good (Green)
  if (heatIndex <= 38) return "#f59e0b"; // Caution (Orange)
  return "#ef4444"; // Danger (Red)
}

// Helper: Get Random Message from Metrics JSON
export const getRandMetricMsg = (cat: string, lvl: string) => {
  const pool = (metricMsgs as any)[cat]?.[lvl];
  return pool ? pool[Math.floor(Math.random() * pool.length)] : "";
};

// Helper: UV Color Logic
export const getUvHexColor = (uv: number) => {
  if (uv <= 2) return "#34d399";
  if (uv <= 5) return "#fbbf24";
  if (uv <= 7) return "#f97316";
  if (uv <= 10) return "#f43f5e";
  return "#ff00ff";
};

// ⚡ Alternative 1: Fetch from your local Next.js Route Handler
export async function fetchWeatherData(coords: { lat: number; lon: number } | null) {
  const res = await fetch("/api/weather", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: coords?.lat,
      lon: coords?.lon,
    }),
  });

  if (!res.ok) {
    throw new Error(`Weather fetch failed: ${res.statusText}`);
  }

  return await res.json();
}

// The Analysis Engine (with our night-aware and encouragement logic)
export function analyzeWeather(weather: any) {
  const defaultStatus = {
    bgGradient: "bg-slate-200",
    bgSubtle: "bg-rose-50",
    bgColor: "bg-slate-200",
    textColor: "text-slate-400",
    label: "LOADING",
  };

  if (!weather) {
    return { status: defaultStatus, recommendation: null, metrics: null, runScore: "0.00" };
  }

  const effectiveTemp = weather.heatIndex || weather.temp || 0;
  const precip = weather.precip || 0;
  const wind = weather.windSpeed || 0;
  const currentUv = weather.uvIndex || 0;
  const hum = weather.humidity || 0;

  const isNight = currentUv < 1.0;

  // Logic Flags
  const isExtremeTemp = effectiveTemp >= 42;
  const isExtremePrecip = precip >= 7.6;
  const isExtremeWind = wind >= 39;
  const isExtremeUv = currentUv >= 11;

  const extremeCount =
    (isExtremeTemp ? 1 : 0) +
    (isExtremePrecip ? 1 : 0) +
    (isExtremeWind ? 1 : 0) +
    (isExtremeUv ? 1 : 0);

  const isRainy = precip > 0;
  const isWindy = wind >= 29;
  const isSunny = currentUv >= 6;
  const isWarm = isNight ? effectiveTemp >= 36 : effectiveTemp >= 32;
  const isHumid = isNight ? hum > 85 : hum > 65;
  const isVeryHot = effectiveTemp >= 38;

  const cautionCount =
    (isRainy ? 1 : 0) +
    (isWindy ? 1 : 0) +
    (isSunny ? 1 : 0) +
    (isHumid ? 1 : 0) +
    (isWarm ? 1 : 0);

  // Scoring Logic
  let score = 10.0;
  if (isExtremeTemp) score -= 5.0; else if (effectiveTemp >= 32) score -= 1.0;
  if (isExtremePrecip) score -= 5.0; else if (isRainy) score -= 2.0;
  if (isExtremeUv) score -= 4.0; else if (isSunny) score -= 1.0;
  if (isExtremeWind) score -= 4.0; else if (isWindy) score -= 2.0;
  if (hum > 65 && effectiveTemp >= 30) score -= 1.0;

  const runScore = Math.max(0, Math.min(10, score)).toFixed(2);

  // Category & Status Determination
  let category: "CHILLY" | "GOOD" | "CAUTION" | "DANGER" = "GOOD";
  let status = defaultStatus;

  if (extremeCount >= 1 || cautionCount >= 3) {
    category = "DANGER";
    status = { bgGradient: "from-orange-500 to-rose-500", bgSubtle: "bg-rose-50", bgColor: "bg-rose-500/90", textColor: "text-rose-600", label: "DANGER" };
  } else if (effectiveTemp < 26) {
    category = "CHILLY";
    status = { bgGradient: "from-sky-400 to-blue-500", bgSubtle: "bg-indigo-50", bgColor: "bg-blue-600/60", textColor: "text-blue-600", label: "CHILLY" };
  } else if (cautionCount >= 2 || isVeryHot) {
    category = "CAUTION";
    status = { bgGradient: "from-amber-400 to-orange-500", bgSubtle: "bg-orange-50", bgColor: "bg-orange-600/60", textColor: "text-orange-600", label: "CAUTION" };
  } else {
    category = "GOOD";
    status = { bgGradient: "from-emerald-400 to-cyan-500", bgSubtle: "bg-teal-50", bgColor: "bg-emerald-600/60", textColor: "text-emerald-600", label: "GOOD" };
  }

  // Sub-Category Routing
  let subCategory = "optimal";
  const actualHumid = hum > 60;
  const actualWarm = effectiveTemp >= 32;

  if (category === "DANGER") subCategory = "extreme";
  else if (isRainy && isWindy) subCategory = "rainy_windy";
  else if (isSunny && actualHumid) subCategory = "sunny_humid";
  else if (isSunny && isWindy) subCategory = "sunny_windy";
  else if (actualHumid && isWindy) subCategory = "humid_windy";
  else if (isRainy) subCategory = "rainy";
  else if (isSunny) subCategory = "sunny";
  else if (category === "CAUTION" && isVeryHot) subCategory = "warm";
  else if (category === "GOOD" && actualWarm) subCategory = "warm";
  else if (actualHumid) subCategory = "humid";
  else if (isWindy) subCategory = "windy";

  const recPool = (recommendations as any)[category]?.[subCategory] || (recommendations as any)[category]?.["optimal"] || [];
  const randomAdvice = recPool.length > 0 ? recPool[Math.floor(Math.random() * recPool.length)] : null;

  const uvLvl = currentUv >= 11 ? "extreme" : currentUv >= 8 ? "extreme" : currentUv >= 6 ? "high" : currentUv >= 3 ? "moderate" : "low";
  const uvLabel = currentUv >= 11 ? "Extreme" : currentUv >= 8 ? "Very High" : currentUv >= 6 ? "High" : currentUv >= 3 ? "Moderate" : "Low";

  return {
    status,
    recommendation: randomAdvice,
    runScore,
    metrics: {
      uv: { desc: getRandMetricMsg("uvIndex", uvLvl), color: getUvHexColor(currentUv), percent: Math.min((currentUv / 11) * 100, 100), status: uvLabel },
      humidity: { desc: getRandMetricMsg("humidity", hum < 30 ? "low" : hum <= 60 ? "optimal" : "high"), color: hum >= 85 ? "text-rose-500" : hum > 60 ? "text-amber-500" : hum < 30 ? "text-blue-500" : "text-emerald-500" },
      precip: { desc: getRandMetricMsg("precipitation", precip === 0 ? "dry" : precip < 7.6 ? "light" : "heavy"), color: precip >= 7.6 ? "text-rose-500" : precip > 0 ? "text-amber-500" : "text-emerald-500" },
      wind: { desc: getRandMetricMsg("windSpeed", wind < 12 ? "calm" : wind <= 28 ? "breezy" : "windy"), color: wind >= 39 ? "text-rose-500" : wind >= 29 ? "text-orange-500" : "text-emerald-500" },
    },
  };
}