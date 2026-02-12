
import { GoogleGenAI } from "@google/genai";

// Default model if not specified
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

/**
 * Creates a GenAI model instance with a simplified interface.
 * Abstraction layer to centralize model configuration.
 */
export const createGeminiModel = (apiKey: string, modelName: string = DEFAULT_GEMINI_MODEL) => {
    const client = new GoogleGenAI({ apiKey });

    return {
        // Wrapper to match the usage in route.ts (or simplify it)
        generateContent: async (prompt: string) => {
            try {
                const response = await client.models.generateContent({
                    model: modelName,
                    contents: [{
                        role: 'user',
                        parts: [{ text: prompt }]
                    }]
                });
                return response;
            } catch (error) {
                console.error("Gemini API Error:", error);
                throw error;
            }
        }
    };
};
