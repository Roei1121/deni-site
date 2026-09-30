// Daily: upsert the team's games 3 days back → 30 days ahead.
import { nbacdn as provider } from "../providers/nbacdn";
import { serviceDb } from "../supabase";
import { teamHe } from "../format";
import { deni } from "./log";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function syncSchedule() {
  const db = serviceDb();
  const p = await deni(db);
  const from = new Date(Date.now() - 3 * 864e5), to = new Date(Date.now() + 30 * 864e5);
  const games = await provider.gamesForTeam(p.team_en, from, to);
  await db.from("raw_payloads").insert({ provider: provider.name, endpoint: "games", payload: games });

  const rows = games.map((g) => {
    const isHome = g.homeTeam === p.team_en;
    const opponent = isHome ? g.awayTeam : g.homeTeam;
    return {
      player_id: p.id, provider: provider.name, provider_game_id: g.providerGameId,
      slug: `${g.startsAt.slice(0, 10)}-${slugify(p.team_en.split(" ")[0])}-vs-${slugify(opponent.split(" ").slice(-1)[0])}`,
      season: g.season, kind: g.kind, starts_at: g.startsAt, is_home: isHome,
      team_en: p.team_en, opponent_en: opponent, opponent_he: teamHe(opponent),
      team_score: isHome ? g.homeScore : g.awayScore, opponent_score: isHome ? g.awayScore : g.homeScore,
      status: g.status,
    };
  });
  const { error } = await db.from("games").upsert(rows, { onConflict: "provider,provider_game_id,player_id" });
  if (error) throw error;
  return { upserted: rows.length };
}
