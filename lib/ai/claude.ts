import Anthropic from "@anthropic-ai/sdk";

const client = () => new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_WORKSPACE_ID
    ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } }
    : {}),
});
export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

// Forced tool_use: model must call this tool, so `input` arrives as a parsed
// object — no JSON.parse, no fence-stripping, no prefill hacks needed.
const OUTPUT_TOOL: Anthropic.Tool = {
  name: "output",
  description: "Return the structured output as described in the system prompt.",
  input_schema: { type: "object" },
};

export async function askJson<T>(system: string, user: string, maxTokens = 1200): Promise<T> {
  const run = async (): Promise<T> => {
    const msg = await client().messages.create({
      model: MODEL, max_tokens: maxTokens, system,
      tools: [OUTPUT_TOOL],
      tool_choice: { type: "tool", name: "output" },
      messages: [{ role: "user", content: user }],
    });
    const block = msg.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("no tool_use block");
    return block.input as T;
  };
  try {
    return await run();
  } catch (e) {
    if (e instanceof SyntaxError) return run();
    throw e;
  }
}
