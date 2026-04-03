import { onCall, HttpsError } from "firebase-functions/v2/https";
import { validateWeatherRequest } from "./request";
import { fetchAndCacheWeather } from "./action";

export const getLiveWeather = onCall({
  region: "asia-southeast1",
  cors: true,
  maxInstances: 10,
  secrets: ["OPENWEATHER_API_KEY"] 
}, async (request) => {
  
  const validatedData = validateWeatherRequest(request.data);
  
  try {
    const weather = await fetchAndCacheWeather();

    // This tells TypeScript: "If weather is null or undefined, stop here."
    if (!weather) {
      throw new Error("Weather data could not be retrieved from any source.");
    }

    return {
      success: true,
      city: validatedData.city,
      temp: weather.temp,
      heatIndex: weather.heatIndex,
      timestamp: Date.now(),
      status: weather.status || "fetched_live"
    };

  } catch (error: any) {
    console.error("CRITICAL: Weather Handler Failure", error);

    throw new HttpsError(
      "internal", 
      error.message || "Failed to retrieve hybrid weather data."
    );
  }
});