
import { GoogleGenerativeAI } from "@google/generative-ai";

export const createGeminiModel = (apiKey: string) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using standard stable model
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
};
