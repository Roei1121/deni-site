import Anthropic from "@anthropic-ai/sdk";

const client = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

/** Ask for JSON only, strip stray fences, parse. */
export async function askJson<T>(system: string, user: string, maxTokens = 1200): Promise<T> {
  const msg = await client().messages.create({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] });
  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim()) as T;
}
