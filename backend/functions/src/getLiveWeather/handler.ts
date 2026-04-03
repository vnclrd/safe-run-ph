import { onCall, HttpsError } from "firebase-functions/v2/https";
import { validateWeatherRequest } from "./request";
import { fetchAndCacheWeather, getAIRunAdvice } from "./action";

/**
 * ⚡ FAST: Just the weather data.
 */
export const getLiveWeather = onCall({
  region: "asia-southeast1",
  cors: true,
  secrets: ["OPENWEATHER_API_KEY"] 
}, async (request) => {
  const validatedData = validateWeatherRequest(request.data);
  try {
    const weather = await fetchAndCacheWeather();
    if (!weather) throw new Error("Weather data unavailable.");

    return {
      success: true,
      city: validatedData.city,
      temp: weather.temp,
      heatIndex: weather.heatIndex,
      timestamp: Date.now()
    };
  } catch (error: any) {
    throw new HttpsError("internal", error.message);
  }
});

/**
 * 🤖 AI-SPECIFIC: Just the coach advice.
 */
export const getRunRecommendation = onCall({
  region: "asia-southeast1",
  cors: true,
  secrets: ["GEMINI_API_KEY"]
}, async (request) => {
  const { temp, heatIndex } = request.data;
  
  if (temp === undefined || heatIndex === undefined) {
    throw new HttpsError("invalid-argument", "Missing required weather data.");
  }
  
  try {
    const recommendation = await getAIRunAdvice(temp, heatIndex);
    return { success: true, recommendation };
  } catch (error: any) {
    throw new HttpsError("internal", "AI failed to respond.");
  }
});