// Detect season/career highs from the new line vs. previous games. Deterministic — the model only phrases them.
import type { ProviderStatLine } from "./providers/stats";

type Line = Pick<ProviderStatLine, "pts" | "reb" | "ast" | "stl" | "blk" | "fg3m">;
const LABELS: Record<keyof Line, string> = { pts: "נקודות", reb: "ריבאונדים", ast: "אסיסטים", stl: "חטיפות", blk: "חסימות", fg3m: "שלשות" };

export function detectRecords(line: Line, season: Line[], career: Line[]): string[] {
  const out: string[] = [];
  for (const k of Object.keys(LABELS) as (keyof Line)[]) {
    const v = line[k];
    if (!v) continue;
    const careerMax = Math.max(0, ...career.map((l) => l[k] ?? 0));
    const seasonMax = Math.max(0, ...season.map((l) => l[k] ?? 0));
    if (career.length && v > careerMax) out.push(`שיא קריירה ב${LABELS[k]} (${v})`);
    else if (season.length && v > seasonMax) out.push(`שיא עונתי ב${LABELS[k]} (${v})`);
  }
  if ([line.pts, line.reb, line.ast].filter((x) => x >= 10).length >= 3) out.push("טריפל-דאבל");
  return out;
}
