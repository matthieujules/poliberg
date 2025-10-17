import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PolymarketEvent } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Polymarket Frontier",
  },
});

export async function POST(request: NextRequest) {
  try {
    const eventData: any = await request.json();

    // Handle both title and question field (backend uses aliases)
    const title = eventData.title || eventData.question || "Unknown event";
    const description = eventData.description || "";
    const probability = eventData.probability || 0.5;

    console.log(`[API Route] Analyzing: ${title}`);

    const systemPrompt = `You identify stock tickers affected by prediction market events.

Return exactly 8 tickers as JSON. Keep rationales under 15 words. Output ONLY the JSON, nothing else.

Format:
{
  "tickers": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc",
      "rationale": "Brief impact",
      "impactScore": 0.85,
      "direction": "bullish"
    }
  ]
}`;

    const userPrompt = `Event: ${title}

Find 8 stocks affected if this event occurs. Return ONLY JSON:`;


    const model = process.env.OPENROUTER_MODEL || "openai/gpt-5-mini";

    let response;
    try {
      console.log(`[API Route] Calling ${model}...`);
      response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000, // Increased to ensure complete JSON
      } as any);
      console.log(`[API Route] Got response - content length:`, response.choices[0].message.content?.length || 0);
    } catch (gptError: any) {
      console.error("[API Route] Error:", gptError?.message);
      throw gptError;
    }

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from GPT");
    }

    // Parse JSON
    let data;
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;

      console.log(`[API Route] Attempting to parse ${jsonString.length} chars of JSON...`);
      data = JSON.parse(jsonString.trim());
      console.log(`[API Route] Parse successful`);
    } catch (parseError) {
      console.error("[API Route] JSON parse failed");
      console.error("[API Route] Response length:", content.length);
      console.error("[API Route] Last 200 chars:", content.substring(Math.max(0, content.length - 200)));
      throw new Error("Invalid JSON from GPT");
    }

    if (!data.tickers || !Array.isArray(data.tickers)) {
      console.error("[API Route] Missing tickers array. Keys:", Object.keys(data));
      throw new Error("Response missing tickers array");
    }

    console.log(`[API Route] Parsed ${data.tickers.length} tickers from GPT`);

    // Transform to match frontend TickerSuggestion interface
    const tickers = data.tickers.slice(0, 8).map((t: any) => ({
      symbol: t.symbol?.toUpperCase() || "UNKNOWN",
      name: t.name || "Unknown Company",
      rationale: t.rationale || "No rationale provided",
      confidence: Math.min(1, Math.max(0, t.impactScore || 0.5)),
      direction: (t.direction || "neutral").toLowerCase(),
      relatedTags: [],
    }));

    console.log(`[API Route] Returning ${tickers.length} tickers`);
    return NextResponse.json(tickers);
  } catch (error: any) {
    console.error("[API Route] ERROR:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate tickers" },
      { status: 500 }
    );
  }
}
