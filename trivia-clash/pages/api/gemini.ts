import type { NextApiRequest, NextApiResponse } from "next";

// Tipul așteptat ca răspuns
interface Trivia {
	question: string;
	options: [string, string, string, string];
	answer: string;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Trivia | { error: string }>
) {
	// Acceptăm doar cereri POST
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
  "answer": "..." // exact text from options
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
			console.error("Missing text from Gemini response:", data);
			return res.status(500).json({ error: "No content returned from Gemini" });
		}

		const clean = rawText.replace(/```json|```/g, "").trim();
		const json = JSON.parse(clean);

// validare minimala

