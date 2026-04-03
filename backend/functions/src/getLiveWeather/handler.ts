import { onCall, HttpsError } from "firebase-functions/v2/https";
import { fetchAndCacheWeather } from "./action";

/**
 * 🛰️ WEATHER SERVICE
 * Fetches real-time conditions (Temp, Heat Index, Humidity) 
 * and a 7-day forecast from Open-Meteo.
 * Note: Open-Meteo is keyless, so no 'secrets' array is needed here.
 */
export const getLiveWeather = onCall({
  region: "asia-southeast1",
  cors: true,
}, async () => {
  try {
    const weather = await fetchAndCacheWeather();
    
    if (!weather) {
      throw new HttpsError("internal", "Weather data is currently unavailable.");
    }
    
    return { 
      success: true, 
      ...weather 
    };
  } catch (error: any) {
    console.error("CRITICAL: Weather Fetch Failure", error);
    throw new HttpsError(
      "internal", 
      error.message || "Failed to retrieve weather from the provider."
    );
  }
});