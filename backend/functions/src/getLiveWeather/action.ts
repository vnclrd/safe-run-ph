import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const CACHE_COLLECTION = "weather_cache";
const CACHE_DOC = "metro_manila_hybrid";

/**
 * Metro Manila Center (Manila City)
 */
const NCR_LAT = 14.5995;
const NCR_LON = 120.9842;

// PAGASA Benchmark Stations for Heat Index
const PAGASA_STATIONS = [
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

/**
 * OpenWeatherMap (Current Air Temp)
 * Now using the Firebase Secret: OPENWEATHER_API_KEY
 */
async function fetchCurrentTemp() {
  const API_KEY = process.env.OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    console.error("API KEY MISSING: Ensure OPENWEATHER_API_KEY is set in Firebase Secrets.");
    return null;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${NCR_LAT}&lon=${NCR_LON}&appid=${API_KEY}&units=metric`;
  
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json() as any;
    console.error("OWM Error:", errorData.message);
    return null;
  }
  
  const data = await res.json() as any;
  return Math.round(data.main.temp); 
}

/**
 * PAGASA (Official Heat Index)
 */
async function fetchPagasaHI(lat: number, long: number) {
  const url = `https://iheatmap.pagasa.dost.gov.ph/api/internal/pixel?lat=${lat}&long=${long}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  
  const data = await res.json() as any;
  const values = data.values || [];
  const manilaHour = getManilaHour();

  const currentReading = values.find((v: any) => v.time === manilaHour);
  return currentReading ? currentReading.value : values[values.length - 1]?.value;
}

export async function fetchAndCacheWeather() {
  const cacheRef = db.collection(CACHE_COLLECTION).doc(CACHE_DOC);
  const cacheSnap = await cacheRef.get();

  // 1. Check for fresh hybrid cache (20-minute window)
  if (cacheSnap.exists) {
    const data = cacheSnap.data();
    const lastUpdated = data?.timestamp?.toDate().getTime();
    if (lastUpdated && (Date.now() - lastUpdated < 20 * 60 * 1000)) {
      console.log("Serving hybrid weather from cache.");
      return data;
    }
  }

  // ⚠️ TEMPORARY: Bypass SSL for PAGASA's specific certificate issue
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    console.log("🌦️ Safe-Run: Fetching Hybrid Weather Data...");

    // 2. Parallel Fetch: OWM for Temp, PAGASA for Heat Index
    const [actualTemp, hiReadings] = await Promise.all([
      fetchCurrentTemp(),
      Promise.all(PAGASA_STATIONS.map(s => fetchPagasaHI(s.lat, s.long)))
    ]);

    // 3. Calculate PAGASA Average Heat Index
    const validHIs = hiReadings.filter(t => t !== null) as number[];
    const avgHI = validHIs.length > 0 
      ? Math.round(validHIs.reduce((a, b) => a + b, 0) / validHIs.length)
      : null;

    // 4. Combine Results
    const weatherData = {
      temp: actualTemp ?? 31,      // Fallback to average Manila temp
      heatIndex: avgHI ?? 35,     // Fallback to baseline HI
      timestamp: new Date(),
      status: "hybrid_fresh",
      debug: {
        using_owm: actualTemp !== null,
        hi_stations: validHIs.length
      }
    };

    await cacheRef.set(weatherData);
    
    console.log(`Hybrid Success: Temp ${weatherData.temp}°C | HI ${weatherData.heatIndex}°C`);
    return weatherData;

  } catch (error) {
    console.error("Critical Hybrid Fetch Error:", error);
    return { temp: 31, heatIndex: 35, status: "error_fallback" };
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
  }
}