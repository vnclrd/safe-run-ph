import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const CACHE_COLLECTION = "weather_cache";
const CACHE_DOC = "metro_manila_weather";

/**
 * Metro Manila Center (Manila City)
 */
const NCR_LAT = 14.5995;
const NCR_LON = 120.9842;

async function fetchWeatherFromOWM() {
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

  return {
    temp: Math.round(data.main.temp),            // Actual Air Temp
    heatIndex: Math.round(data.main.feels_like), // "Real Feel" / Heat Index
    humidity: data.main.humidity,
    description: data.weather[0].description
  };
}

export async function fetchAndCacheWeather() {
  const cacheRef = db.collection(CACHE_COLLECTION).doc(CACHE_DOC);
  const cacheSnap = await cacheRef.get();

  // 1. Check for fresh cache (15-minute window for better accuracy)
  if (cacheSnap.exists) {
    const data = cacheSnap.data();
    const lastUpdated = data?.timestamp?.toDate().getTime();
    if (lastUpdated && (Date.now() - lastUpdated < 15 * 60 * 1000)) {
      console.log("Serving weather from cache.");
      return data;
    }
  }

  try {
    console.log("Safe-Run PH: Fetching Live Data from OpenWeatherMap...");

    // 2. Single API Call
    const weather = await fetchWeatherFromOWM();

    if (!weather) throw new Error("Could not reach OpenWeatherMap");

    // 3. Combine Results
    const weatherData = {
      temp: weather.temp,           
      heatIndex: weather.heatIndex, 
      timestamp: new Date(),
      status: "owm_verified",
      details: {
        humidity: weather.humidity,
        condition: weather.description
      }
    };

    await cacheRef.set(weatherData);
    
    console.log(`Success: Temp ${weatherData.temp}°C | Real Feel ${weatherData.heatIndex}°C`);
    return weatherData;

  } catch (error) {
    console.error("Critical Weather Fetch Error:", error);
    // Fallback values if the API is down
    return { temp: "N/A", heatIndex: "N/A", status: "error_fallback" };
  }
}