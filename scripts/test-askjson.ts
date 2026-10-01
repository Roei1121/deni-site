import { askJson, MODEL } from "../lib/ai/claude";
import { ARTICLE_SYSTEM } from "../lib/ai/prompts";

console.log("Model:", MODEL);
askJson<{ summary_he: string; topic: string; about_deni: boolean }>(
  ARTICLE_SYSTEM,
  "ESPN: Deni Avdija drops 31 points and 8 assists in Trail Blazers win",
  300
).then((r) => {
  console.log("askJson result:", JSON.stringify(r, null, 2));
  if (typeof r.summary_he !== "string" || typeof r.about_deni !== "boolean")
    throw new Error("unexpected shape: " + JSON.stringify(r));
  console.log("✓ shape valid");
}).catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
