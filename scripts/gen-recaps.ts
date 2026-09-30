/**
 * One-off: generate Hebrew recaps for the last N games of 2025-26.
 * Uses the same RECAP_SYSTEM prompt as closeGames.
 * Run: npx tsx scripts/gen-recaps.ts
 */
import { createClient } from "@supabase/supabase-js";
import { askJson } from "../lib/ai/claude";
import { RECAP_SYSTEM } from "../lib/ai/prompts";
import { detectRecords } from "../lib/records";

const N = 5;

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const { data: player } = await db.from("players").select("id").eq("slug", "deni-avdija").single();
  if (!player) throw new Error("player not found");

  // Last N final games with stats
  const { data: games, error } = await db
    .from("games")
    .select(`
      id, slug, starts_at, is_home, opponent_en, opponent_he,
      team_score, opponent_score, season,
      player_game_stats(
        minutes, pts, reb, ast, stl, blk, fg3m, fgm, fga,
        fg3a, ftm, fta, tov, pf, plus_minus, did_not_play
      )
    `)
    .eq("player_id", player.id)
    .eq("season", "2025-26")
    .eq("status", "final")
    .order("starts_at", { ascending: false })
    .limit(N * 3); // fetch extra so we can filter DNP locally

  if (error) throw error;

  // Supabase returns the 1:1 join as an object, not array
  const played = (games ?? [])
    .filter((g) => {
      const s = g.player_game_stats as any;
      return s && !s.did_not_play;
    })
    .slice(0, N);

  console.log(`Generating recaps for ${played.length} games...\n`);

  // Fetch all prior stats for record detection
  const { data: allStats } = await db
    .from("player_game_stats")
    .select("pts,reb,ast,stl,blk,fg3m,game:games!inner(season)")
    .eq("player_id", player.id)
    .eq("did_not_play", false);

  for (const g of played) {
    const s = g.player_game_stats as any;
    const line = {
      pts: s.pts, reb: s.reb, ast: s.ast, stl: s.stl, blk: s.blk, fg3m: s.fg3m,
      minutes: s.minutes, fgm: s.fgm, fga: s.fga, fg3a: s.fg3a,
      ftm: s.ftm, fta: s.fta, tov: s.tov, pf: s.pf, plus_minus: s.plus_minus,
    };

    const career = (allStats ?? []) as any[];
    const season = career.filter((r) => r.game?.season === g.season);
    const records = detectRecords(line, season, career);

    const won = (g.team_score ?? 0) > (g.opponent_score ?? 0);
    const facts = {
      team: "פורטלנד טרייל בלייזרס",
      opponent: g.opponent_he ?? g.opponent_en,
      home: g.is_home,
      result: won ? "ניצחון" : "הפסד",
      score: `${g.team_score}-${g.opponent_score}`,
      line,
      records,
    };

    console.log(`── ${g.starts_at.slice(0, 10)} ${g.is_home ? "נגד" : "ב"}${g.opponent_he ?? g.opponent_en} ──`);
    const recap = await askJson<{
      headline_he: string; body_he: string; key_points: string[]; records: string[];
    }>(RECAP_SYSTEM, JSON.stringify(facts));

    // Upsert (draft — user approves in admin)
    const { error: ue } = await db.from("game_recaps").upsert(
      {
        game_id: g.id,
        headline_he: recap.headline_he,
        body_he: recap.body_he,
        key_points: recap.key_points,
        records: recap.records,
        status: "draft",
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      },
      { onConflict: "game_id" }
    );
    if (ue) console.error("  upsert error:", ue.message);

    console.log(`  כותרת:   ${recap.headline_he}`);
    console.log(`  גוף:     ${recap.body_he}`);
    console.log(`  נקודות:  ${recap.key_points.join(" | ")}`);
    if (recap.records.length) console.log(`  שיאים:   ${recap.records.join(", ")}`);
    console.log();
  }

  const { count } = await db
    .from("game_recaps")
    .select("*", { count: "exact", head: true });
  console.log(`סה"כ game_recaps בDB: ${count}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
