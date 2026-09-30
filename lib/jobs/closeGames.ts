// Every 10 min: for games that should be over and aren't closed, fetch final + Deni's line,
// detect records, write the Hebrew recap.
import { nbacdn as provider } from "../providers/nbacdn";
import { serviceDb } from "../supabase";
import { askJson, MODEL } from "../ai/claude";
import { RECAP_SYSTEM } from "../ai/prompts";
import { detectRecords } from "../records";
import { deni } from "./log";
import { revalidatePath } from "next/cache";

const GAME_LENGTH_H = 2.25;

export async function closeGames() {
  const db = serviceDb();
  const p = await deni(db);
  const providerPlayerId = p.provider_ids?.nba ?? process.env.DENI_PLAYER_ID;
  if (!providerPlayerId) throw new Error("Set players.provider_ids.nba or DENI_PLAYER_ID");

  const cutoff = new Date(Date.now() - GAME_LENGTH_H * 36e5).toISOString();
  const { data: open } = await db.from("games").select("*").eq("player_id", p.id).is("closed_at", null).lte("starts_at", cutoff).neq("status", "postponed");
  const closed: string[] = [];

  for (const g of open ?? []) {
    const fresh = await provider.game(g.provider_game_id);
    if (fresh.status !== "final") continue;
    const isHome = g.is_home;
    const teamScore = isHome ? fresh.homeScore : fresh.awayScore;
    const oppScore = isHome ? fresh.awayScore : fresh.homeScore;

    const line = await provider.playerLine(g.provider_game_id, providerPlayerId);
    await db.from("player_game_stats").upsert({ game_id: g.id, player_id: p.id, ...(line ?? {}), did_not_play: !line || !line.minutes });

    let records: string[] = [];
    if (line && line.minutes) {
      const { data: prev } = await db.from("player_game_stats").select("pts, reb, ast, stl, blk, fg3m, game:games!inner(season)").eq("player_id", p.id).neq("game_id", g.id);
      const career = (prev ?? []) as any[];
      records = detectRecords(line, career.filter((r) => r.game?.season === g.season), career);

      const facts = {
        team: (p as any).team_he ?? p.team_en,
        opponent: g.opponent_he ?? g.opponent_en,
        home: isHome,
        result: (teamScore ?? 0) > (oppScore ?? 0) ? "ניצחון" : "הפסד",
        score: `${teamScore}-${oppScore}`, line, records,
      };
      const recap = await askJson<{ headline_he: string; body_he: string; key_points: string[]; records: string[] }>(RECAP_SYSTEM, JSON.stringify(facts));
      await db.from("game_recaps").upsert({
        game_id: g.id, ...recap, records, model: MODEL,
        status: process.env.AUTO_PUBLISH_RECAPS === "true" ? "approved" : "draft",
      });
    }

    await db.from("games").update({ status: "final", team_score: teamScore, opponent_score: oppScore, closed_at: new Date().toISOString() }).eq("id", g.id);
    closed.push(g.slug);
    revalidatePath(`/games/${g.slug}`);
  }
  if (closed.length) revalidatePath("/");
  return { closed };
}
