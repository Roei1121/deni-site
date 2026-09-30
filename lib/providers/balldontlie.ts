// BALLDONTLIE adapter. Endpoint paths and field names follow their v1 docs —
// VERIFY against https://docs.balldontlie.io before first production run.
import type { ProviderGame, ProviderStatLine, StatsProvider } from "./stats";

const BASE = "https://api.balldontlie.io/v1";

async function get<T>(path: string, params: Record<string, string | string[]> = {}): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) (Array.isArray(v) ? v : [v]).forEach((x) => qs.append(k, x));
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { Authorization: process.env.BALLDONTLIE_API_KEY ?? "" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`balldontlie ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

const seasonLabel = (startYear: number) => `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

function mapGame(g: any): ProviderGame {
  const status: ProviderGame["status"] =
    g.status === "Final" ? "final" : g.period > 0 ? "live" : "scheduled";
  return {
    providerGameId: String(g.id),
    startsAt: g.datetime ?? g.date,
    season: seasonLabel(g.season),
    kind: g.postseason ? "playoffs" : "regular",
    homeTeam: g.home_team.full_name,
    awayTeam: g.visitor_team.full_name,
    homeScore: g.home_team_score ?? null,
    awayScore: g.visitor_team_score ?? null,
    status,
  };
}

let teamIdCache: Record<string, number> = {};
async function teamId(fullName: string) {
  if (!teamIdCache[fullName]) {
    const { data } = await get<{ data: any[] }>("/teams");
    teamIdCache = Object.fromEntries(data.map((t) => [t.full_name, t.id]));
  }
  const id = teamIdCache[fullName];
  if (!id) throw new Error(`Unknown team ${fullName}`);
  return id;
}

const day = (d: Date) => d.toISOString().slice(0, 10);

export const balldontlie: StatsProvider = {
  name: "balldontlie",
  async gamesForTeam(teamName, from, to) {
    const id = await teamId(teamName);
    const out: ProviderGame[] = [];
    let cursor: string | undefined;
    do {
      const r = await get<{ data: any[]; meta?: { next_cursor?: number } }>("/games", {
        "team_ids[]": String(id), start_date: day(from), end_date: day(to), per_page: "100",
        ...(cursor ? { cursor } : {}),
      });
      out.push(...r.data.map(mapGame));
      cursor = r.meta?.next_cursor ? String(r.meta.next_cursor) : undefined;
    } while (cursor);
    return out;
  },
  async game(providerGameId) {
    const r = await get<{ data: any }>(`/games/${providerGameId}`);
    return mapGame(r.data);
  },
  async playerLine(providerGameId, providerPlayerId) {
    const r = await get<{ data: any[] }>("/stats", { "game_ids[]": providerGameId, "player_ids[]": providerPlayerId });
    const s = r.data[0];
    if (!s) return null;
    const [mm, ss] = String(s.min ?? "0").split(":").map(Number);
    return {
      minutes: mm + (ss || 0) / 60,
      pts: s.pts, reb: s.reb, ast: s.ast, stl: s.stl, blk: s.blk, tov: s.tov, pf: s.pf,
      fgm: s.fgm, fga: s.fga, fg3m: s.fg3m, fg3a: s.fg3a, ftm: s.ftm, fta: s.fta,
      plus_minus: s.plus_minus ?? null,
    };
  },
};
