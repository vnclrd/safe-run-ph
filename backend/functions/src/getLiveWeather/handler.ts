import { onCall, HttpsError } from "firebase-functions/v2/https";
import { validateWeatherRequest } from "./request";
import { fetchAndCacheWeather } from "./action";

/**
 * getLiveWeather Handler (v2)
 * Explicitly set to Singapore (asia-southeast1) for PH runners.
 */
export const getLiveWeather = onCall({
  region: "asia-southeast1",
  cors: true,
  maxInstances: 10
}, async (request) => {
  
  // 1. Validate Input (Check if city was provided)
  const validatedData = validateWeatherRequest(request.data);
  
  try {

    // 2. Execute Business Logic (PAGASA Fetch)
    const heatIndex = await fetchAndCacheWeather();

    // 3. Return structured response to the frontend
    return {
      success: true,
      city: validatedData.city,
      heatIndex: heatIndex,
      timestamp: Date.now(),
      status: "fetched_live"
    };

  } catch (error: any) {
    // Log the actual error in the Firebase Console so you can debug it
    console.error("CRITICAL: Weather Handler Failure", error);

    // Throw a structured error that the Firebase SDK understands
    throw new HttpsError(
      "internal", 
      error.message || "Failed to retrieve weather data."
    );
  }
});