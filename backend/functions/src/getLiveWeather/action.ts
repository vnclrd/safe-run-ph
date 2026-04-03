import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const db = getFirestore();
const CACHE_DOC = "metro_manila_weather";
const NCR_LAT = 14.5995;
const NCR_LON = 120.9842;

export async function getAIRunAdvice(temp: number, heatIndex: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing.");
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1' });
    const prompt = `Witty Pinoy running coach. Weather: ${temp}°C | HI: ${heatIndex}°C. JSON: { "title": "max 4 words", "message": "2 short sentences", "action": "3 words" }`;
    const result = await model.generateContent(prompt);
    return JSON.parse((await result.response).text().replace(/```json|```/g, "").trim());
  } catch (error) {
    return { title: "Coach is Hydrating", message: "Stay safe and stay hydrated!", action: "Safety First" };
  }
}

export async function fetchAndCacheWeather() {
  const cacheRef = db.collection("weather_cache").doc(CACHE_DOC);
  const snap = await cacheRef.get();
  
  if (snap.exists && (Date.now() - snap.data()?.timestamp.toDate().getTime() < 15 * 60 * 1000)) {
    return snap.data();
  }

  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${NCR_LAT}&lon=${NCR_LON}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`);
  const data = await res.json() as any;
  const weatherData = { temp: Math.round(data.main.temp), heatIndex: Math.round(data.main.feels_like), timestamp: new Date() };
  await cacheRef.set(weatherData);
  return weatherData;
}