import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI RECOMMENDATION ENGINE
 */
export async function getAIRunAdvice(temp: number, heatIndex: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // Use 'gemini-2.5-flash' (Stable) on the 'v1' endpoint
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" }, 
      { apiVersion: 'v1' }
    );

    const prompt = `
      You are an encouraging Filipino running coach for "Safe-Run PH". 
      Current Weather in Manila: ${temp}°C (Actual) | ${heatIndex}°C (Heat Index).
      
      Task: Generate a UNIQUE, creative recommendation. 
      1. Title: Very punchy (max 5 words).
      2. Message: EXACTLY 2 short sentences (max 100 characters total). 
      3. Action: 3-word label.

      Constraints: 
      - Keep it concise so it fits a small UI card.
      - Use local Manila flavor/slang.
      
      Return ONLY JSON: { "title": "string", "message": "string", "action": "string" }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Detailed AI Error:", error.message);
    return { 
      title: "Coach is Hydrating", 
      message: "The AI coach is taking a break. Stick to your usual safety routine!", 
      action: "Check Back Later"
    };
  }
}