import recommendations from "@/lib/recommendations.json";
import metricMsgs from "@/lib/metrics.json";

export function getHeatIndexColor(heatIndex: number): string {
  if (heatIndex < 26) return "#3b82f6"; // Chilly (Blue)
  if (heatIndex <= 31) return "#10b981"; // Good (Green)
  if (heatIndex <= 38) return "#f59e0b"; // Caution (Orange)
  return "#ef4444"; // Danger (Red)
}

export const getRandMetricMsg = (cat: string, lvl: string) => {
  const pool = (metricMsgs as any)[cat]?.[lvl];
  return pool ? pool[Math.floor(Math.random() * pool.length)] : "";
};

export const getUvHexColor = (uv: number) => {
  if (uv <= 2) return "#34d399";
  if (uv <= 5) return "#fbbf24";
  if (uv <= 7) return "#f97316";
  if (uv <= 10) return "#f43f5e";
  return "#ff00ff";
};

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

  // Real daytime check: 6:00 AM to 5:59 PM (18:00)
  const currentHour = new Date().getHours();
  const isNight = currentHour < 6 || currentHour >= 18;

  // PAGASA & Runner Stress Thresholds
  const isExtremeTemp = effectiveTemp >= 42; // Danger (Cramps/Heatstroke likely)
  const isExtremePrecip = precip >= 7.6;     // Heavy rain / flooded roads
  const isExtremeWind = wind >= 39;          // Gale force
  const isExtremeUv = currentUv >= 11;       // Extreme radiation

  const isRainy = precip > 0.2;
  const isWindy = wind >= 28;
  const isSunny = currentUv >= 6;

  // At night, Pinoy runners can tolerate 32-34°C if there's no radiant sun.
  // But during the day, 33°C+ heat index is immediately warm/caution.
  const isWarm = isNight ? effectiveTemp >= 35 : effectiveTemp >= 33;
  const isHumid = hum > 70;

  // Scoring Logic (Accurate Deductions out of 10.0)
  let score = 10.0;

  // Heat Index Deductions
  if (effectiveTemp >= 42) {
    score -= 5.5;
  } else if (effectiveTemp >= 37) {
    score -= 3.0; // 37-41: High Caution
  } else if (effectiveTemp >= 33) {
    score -= 2.0; // 33-36: Moderate Caution (e.g., 36°C drops score to 8.0 or below)
  } else if (effectiveTemp < 24) {
    score -= 0.5;
  }

  // Weather Deductions
  if (precip >= 7.6) score -= 4.0;
  else if (precip > 1.5) score -= 2.0;
  else if (precip > 0) score -= 1.0;

  if (currentUv >= 11) score -= 3.0;
  else if (currentUv >= 8) score -= 2.0;
  else if (currentUv >= 6) score -= 1.0;

  if (wind >= 39) score -= 3.5;
  else if (wind >= 28) score -= 1.5;

  if (hum > 75 && effectiveTemp >= 30) score -= 1.0;

  const runScore = Math.max(0, Math.min(10, score)).toFixed(2);

  // Status Category Determination
  let category: "CHILLY" | "GOOD" | "CAUTION" | "DANGER" = "GOOD";
  let status = defaultStatus;

  if (isExtremeTemp || isExtremePrecip || isExtremeWind || isExtremeUv || effectiveTemp >= 42) {
    category = "DANGER";
    status = {
      bgGradient: "from-orange-500 to-rose-500",
      bgSubtle: "bg-rose-50",
      bgColor: "bg-rose-500/90",
      textColor: "text-rose-600",
      label: "DANGER",
    };
  } else if (effectiveTemp < 25) {
    category = "CHILLY";
    status = {
      bgGradient: "from-sky-400 to-blue-500",
      bgSubtle: "bg-indigo-50",
      bgColor: "bg-blue-600/60",
      textColor: "text-blue-600",
      label: "CHILLY",
    };
  } else if (effectiveTemp >= 34 || isSunny || (isRainy && wind >= 20) || (hum > 80 && effectiveTemp >= 31)) {
    category = "CAUTION";
    status = {
      bgGradient: "from-amber-400 to-orange-500",
      bgSubtle: "bg-orange-50",
      bgColor: "bg-orange-600/60",
      textColor: "text-orange-600",
      label: "CAUTION",
    };
  } else {
    category = "GOOD";
    status = {
      bgGradient: "from-emerald-400 to-cyan-500",
      bgSubtle: "bg-teal-50",
      bgColor: "bg-emerald-600/60",
      textColor: "text-emerald-600",
      label: "GOOD",
    };
  }

  // Routing Subcategory
  let subCategory = "optimal";
  if (category === "DANGER") subCategory = "extreme";
  else if (isRainy && isWindy) subCategory = "rainy_windy";
  else if (isSunny && hum > 65) subCategory = "sunny_humid";
  else if (isSunny) subCategory = "sunny";
  else if (isRainy) subCategory = "rainy";
  else if (effectiveTemp >= 33) subCategory = isNight ? "warm_night" : "warm_day";
  else if (hum > 70) subCategory = isNight ? "humid_night" : "humid";
  else if (isWindy) subCategory = "windy";

  const recPool =
    (recommendations as any)[category]?.[subCategory] ||
    (recommendations as any)[category]?.[isNight ? "warm_night" : "warm_day"] ||
    (recommendations as any)[category]?.["optimal"] ||
    [];

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