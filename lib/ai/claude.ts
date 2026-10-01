import Anthropic from "@anthropic-ai/sdk";

const client = () => new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_WORKSPACE_ID
    ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } }
    : {}),
});
export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

/** Ask for JSON only. Prefills `{` so Claude is forced into a JSON object,
 *  strips stray fences, and retries once on parse failure. */
export async function askJson<T>(system: string, user: string, maxTokens = 1200): Promise<T> {
  const run = async (): Promise<T> => {
    const msg = await client().messages.create({
      model: MODEL, max_tokens: maxTokens, system,
      messages: [
        { role: "user", content: user },
        { role: "assistant", content: "{" },
      ],
    });
    const raw = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return JSON.parse(("{" + raw).replace(/```json|```/g, "").trim()) as T;
  };
  try {
    return await run();
  } catch (e) {
    if (e instanceof SyntaxError) return run();
    throw e;
  }
}
