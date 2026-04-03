import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAIRunAdvice } from "./action";

/**
 * AI-SPECIFIC: Triggers the Gemini AI coach.
 * Called by the frontend AFTER the weather has already loaded.
 */
export const getRunRecommendation = onCall({
  region: "asia-southeast1",
  cors: true,
  maxInstances: 10,
  secrets: ["GEMINI_API_KEY"]
}, async (request) => {
  // We expect temp and heatIndex to be passed from the frontend
  const { temp, heatIndex } = request.data;

  if (temp === undefined || heatIndex === undefined) {
    throw new HttpsError("invalid-argument", "Temperature and Heat Index are required.");
  }
  
  try {
    // Call the specific AI logic from your action.ts
    const recommendation = await getAIRunAdvice(temp, heatIndex);

    return {
      success: true,
      recommendation
    };

  } catch (error: any) {
    console.error("CRITICAL: AI Recommendation Failure", error);
    throw new HttpsError(
      "internal", 
      error.message || "The AI Coach failed to generate advice."
    );
  }
});