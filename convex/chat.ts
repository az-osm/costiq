import { v } from "convex/values";
import { action } from "./_generated/server";

declare const process: { env: Record<string, string | undefined> };

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";

export const sendMessage = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
    system: v.string(),
  },
  returns: v.string(),
  handler: async (_ctx, { messages, system }) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_API_KEY not configured. Set it with: bunx convex env set GOOGLE_API_KEY your-key",
      );
    }

    // Convert messages to Gemini format
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const text =
      (
        data as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        }
      ).candidates?.[0]?.content?.parts?.[0]?.text ??
      "Connection error — please retry.";
    return text;
  },
});
