/**
 * One-off: aggregate player_game_stats → season_stats for 2025-26.
 * Run: npx tsx scripts/fill-season-stats.ts
 */
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const { data: player } = await db.from("players").select("id,team_en").eq("slug", "deni-avdija").single();
  if (!player) throw new Error("player not found");

  const { data: rows, error } = await db
    .from("player_game_stats")
    .select("minutes,pts,reb,ast,stl,blk,fgm,fga,fg3m,fg3a,ftm,fta")
    .eq("player_id", player.id)
    .eq("did_not_play", false);
  if (error) throw error;

  const n = rows!.length;
  if (!n) throw new Error("No played games found");

  const sum = (f: keyof typeof rows[0]) =>
    rows!.reduce((acc, r) => acc + ((r[f] as number) ?? 0), 0);

  const pct = (made: number, att: number) => (att > 0 ? made / att : 0);

  const fgm = sum("fgm"), fga = sum("fga");
  const fg3m = sum("fg3m"), fg3a = sum("fg3a");
  const ftm = sum("ftm"), fta = sum("fta");

  const stat = {
    player_id: player.id,
    season: "2025-26",
    league: "NBA",
    team_en: player.team_en,
    games: n,
    minutes: sum("minutes") / n,
    pts:     sum("pts")     / n,
    reb:     sum("reb")     / n,
    ast:     sum("ast")     / n,
    stl:     sum("stl")     / n,
    blk:     sum("blk")     / n,
    fg_pct:  pct(fgm, fga),
    fg3_pct: pct(fg3m, fg3a),
    ft_pct:  pct(ftm, fta),
    updated_at: new Date().toISOString(),
  };

  const { error: ue } = await db
    .from("season_stats")
    .upsert(stat, { onConflict: "player_id,season,league" });
  if (ue) throw ue;

  console.log(`season_stats upserted (${n} games):`);
  console.log(`  ${stat.pts.toFixed(1)} pts / ${stat.reb.toFixed(1)} reb / ${stat.ast.toFixed(1)} ast`);
  console.log(`  FG ${(stat.fg_pct * 100).toFixed(1)}% / 3P ${(stat.fg3_pct * 100).toFixed(1)}% / FT ${(stat.ft_pct * 100).toFixed(1)}%`);
  console.log(`  ${stat.minutes.toFixed(1)} min / ${stat.stl.toFixed(1)} stl / ${stat.blk.toFixed(1)} blk`);
}

main().catch((e) => { console.error(e); process.exit(1); });
