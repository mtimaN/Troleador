import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic = "technology", difficulty = "medium" } = req.body ?? {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing API key" });
  }

  const prompt = `Generate a trivia question about ${topic}, difficulty ${difficulty}. Format the output strictly as JSON:
{
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "answer": "..."
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-1219:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(500).json({ error: "No content returned from Gemini" });
    }

    const clean = rawText.replace(/```json|```/g, "").trim();
    const json = JSON.parse(clean);

    return res.status(200).json(json);
  } catch (error) {
    console.error("Gemini error:", error);
    return res.status(500).json({ error: "Failed to fetch from Gemini" });
  }
}
