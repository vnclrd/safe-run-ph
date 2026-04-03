import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const db = getFirestore();
const CACHE_COLLECTION = "weather_cache";
const CACHE_DOC = "metro_manila_weather";

const NCR_LAT = 14.5995;
const NCR_LON = 120.9842;

/**
 * 🤖 AI COACH ENGINE
 * This is now EXPORTED and independent.
 */
export async function getAIRunAdvice(temp: number, heatIndex: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" }, 
      { apiVersion: 'v1' }
    );

    const prompt = `
      You are an encouraging Filipino running coach for "Safe-Run PH". 
      Current Weather: ${temp}°C | Heat Index: ${heatIndex}°C.
      
      Task: Generate a UNIQUE recommendation. 
      1. Title: Very punchy (max 4 words).
      2. Message: EXACTLY 2 short sentences (max 100 characters total). 
      3. Action: 3-word label.
      
      Return ONLY JSON: { "title": "string", "message": "string", "action": "string" }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("AI Error:", error.message);
    return { 
      title: "Coach is Hydrating", 
      message: "The AI coach is taking a break. Stick to your usual safety routine!", 
      action: "Check Back Later" 
    };
  }
}

/**
 * ⚡ WEATHER FETCHER (Now 100% AI-free)
 */
export async function fetchAndCacheWeather() {
  const cacheRef = db.collection(CACHE_COLLECTION).doc(CACHE_DOC);
  const cacheSnap = await cacheRef.get();

  // 1. Return cached weather if fresh (15 mins)
  if (cacheSnap.exists) {
    const data = cacheSnap.data();
    const lastUpdated = data?.timestamp?.toDate().getTime();
    if (lastUpdated && (Date.now() - lastUpdated < 15 * 60 * 1000)) {
      return data;
    }
  }

  try {
    // 2. Fetch from OpenWeatherMap
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${NCR_LAT}&lon=${NCR_LON}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    const weatherData = await res.json() as any;

    const finalData = {
      temp: Math.round(weatherData.main.temp),           
      heatIndex: Math.round(weatherData.main.feels_like), 
      timestamp: new Date(),
      status: "owm_verified"
    };

    // 3. Update cache with ONLY weather data
    await cacheRef.set(finalData);
    return finalData;

  } catch (error) {
    console.error("Weather Fetch Error:", error);
    return null;
  }
}