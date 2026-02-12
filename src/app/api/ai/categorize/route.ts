
import { NextResponse } from 'next/server';
import { createGeminiModel } from '@/lib/gemini';
import { Category } from '@/types';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { apiKey, categories, model } = body;

        // Support both single (legacy/form) and batch (auto-categorize) modes
        const transactions = body.transactions || (body.note || body.amount ? [{ note: body.note, amount: body.amount, id: 'single' }] : []);

        // Use User's API Key or Fallback to Env
        const finalApiKey = apiKey || process.env.GEMINI_API_KEY;

        if (!finalApiKey) {
            return NextResponse.json({ error: "Missing Gemini API Key. Please configure it in Settings." }, { status: 401 });
        }

        if (transactions.length === 0) {
            return NextResponse.json({ error: "No transactions provided" }, { status: 400 });
        }

        // Simplistic prompt for now. Can be optimized.
        const categoryList = categories.map((c: Category) => `- ${c.name} (ID: ${c.id}, Type: ${c.type})`).join('\n');

        const transactionList = transactions.map((t: { id: string, note?: string, amount: number, type?: string }, index: number) =>
            `[ID: ${t.id || index}] Type: ${t.type?.toUpperCase() || 'UNKNOWN'}, Note: "${t.note || ''}", Amount: ${t.amount}`
        ).join('\n');

        const prompt = `
        You are a financial assistant. Categorize the following transactions into the provided categories.
        
        Available Categories:
        ${categoryList}
        
        Transactions to Categorize:
        ${transactionList}
        
        Rules:
        1. Return ONLY a JSON object. No markdown.
        2. Format: { "results": [{ "id": "TRANSACTION_ID", "categoryId": "CATEGORY_ID", "confidence": 0.0-1.0 }] }
        3. STRICT RULE: The category Type MUST match the transaction Type. 
           - If Transaction Type is INCOME, you MUST pick an INCOME category.
           - If Transaction Type is EXPENSE, you MUST pick an EXPENSE category.
           - Make your BEST GUESS even if the description is vague. **NEVER return null for categoryId.**
           - If you are unsure, pick the "Chi phí khác" (Other Expense) or "Thu nhập khác" (Other Income) category.
        4. "ID" in the output must match the "[ID: ...]" provided in the input. Ensure EVERY transaction ID has a result.
        `;

        const aiModel = createGeminiModel(finalApiKey, model);
        const result = await aiModel.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Clean up markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(text);

            // If handling single mode (legacy), return flat format for backward compatibility
            if (body.note || body.amount) {
                const singleResult = data.results?.find((r: { id: string }) => r.id === 'single');
                return NextResponse.json(singleResult || {});
            }

            return NextResponse.json(data);
        } catch {
            console.error("AI Parse Error:", text);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
