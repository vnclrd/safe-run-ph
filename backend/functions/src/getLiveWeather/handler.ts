import { onCall, HttpsError } from "firebase-functions/v2/https";
import { fetchAndCacheWeather } from "./action";

export const getLiveWeather = onCall({
  region: "asia-southeast1",
  cors: true,
}, async (request) => {
  try {
    const { lat, lon } = request.data || {};
    const weather = await fetchAndCacheWeather(lat, lon);
    
    if (!weather) {
      throw new HttpsError("internal", "Weather data unavailable.");
    }
    
    return { success: true, ...weather };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to retrieve weather.");
  }
});