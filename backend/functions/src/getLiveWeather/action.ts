import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const CACHE_COLLECTION = "weather_cache";
const CACHE_DOC = "metro_manila_temp";

// Benchmark Stations
const STATIONS = [
  { name: "Manila", lat: 14.5884, long: 120.9679 },
  { name: "Pasay", lat: 14.5047, long: 121.0048 },
  { name: "QC", lat: 14.6451, long: 121.0443 }
];

/**
 * Helper to get the current hour in Manila (GMT+8)
 */
function getManilaHour(): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    hour12: false
  };
  const hour = new Intl.DateTimeFormat('en-GB', options).format(new Date());
  return `${hour}:00`;
}

async function fetchRealTimeTemp(lat: number, long: number) {
  const url = `https://iheatmap.pagasa.dost.gov.ph/api/internal/pixel?lat=${lat}&long=${long}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  
  const data = await res.json() as any;
  const values = data.values || [];

  const manilaHour = getManilaHour();
  console.log(`🔍 Searching for Manila Hour: ${manilaHour}`);

  // Find the specific value for "Now" in Manila time
  const currentReading = values.find((v: any) => v.time === manilaHour);
  
  /**
   * FALLBACK LOGIC: 
   * If the exact hour isn't found (sometimes PAGASA lags), 
   * we grab the very last item in the array (the absolute latest entry).
   */
  return currentReading ? currentReading.value : values[values.length - 1]?.value;
}

export async function fetchAndCacheWeather() {
  const cacheRef = db.collection(CACHE_COLLECTION).doc(CACHE_DOC);

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    const readings = await Promise.all(
      STATIONS.map(s => fetchRealTimeTemp(s.lat, s.long))
    );

    const temps = readings.filter(t => t !== null) as number[];
    if (temps.length === 0) return 24; // Fallback to current Manila night temp

    const avg = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);

    await cacheRef.set({
      temp: avg,
      timestamp: new Date(),
      debug_hour: getManilaHour()
    });

    console.log(`✅ Fixed Temp (Manila Time): ${avg}°C`);
    return avg;

  } catch (error) {
    console.error("Fetch Error:", error);
    return 24;
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
  }
}