import { onCall, HttpsError } from "firebase-functions/v2/https";
import { fetchAndCacheWeather, getAIRunAdvice } from "./action";

export const getLiveWeather = onCall({
  region: "asia-southeast1",
  cors: true,
  secrets: ["OPENWEATHER_API_KEY"] 
}, async () => {
  const weather = await fetchAndCacheWeather();
  if (!weather) throw new HttpsError("internal", "Weather unavailable.");
  return { success: true, ...weather };
});

export const getRunRecommendation = onCall({
  region: "asia-southeast1",
  cors: true,
  secrets: ["GEMINI_API_KEY"]
}, async (request) => {
  const { temp, heatIndex } = request.data;
  const recommendation = await getAIRunAdvice(temp, heatIndex);
  return { success: true, recommendation };
});