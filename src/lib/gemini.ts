
import { GoogleGenerativeAI } from "@google/generative-ai";

// Default model if not specified
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

export const createGeminiModel = (apiKey: string, modelName: string = DEFAULT_GEMINI_MODEL) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: modelName });
};
