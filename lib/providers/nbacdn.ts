// NBA CDN adapter — reads public S3 bucket (same data as cdn.nba.com, no Akamai block).
// Schedule: scheduleLeagueV2_1.json (current season, refreshed by NBA throughout year)
// Boxscore: liveData/boxscore/boxscore_{gameId}.json (available for every game)
import type { ProviderGame, ProviderStatLine, StatsProvider } from "./stats";

const S3 = "https://nba-prod-us-east-1-mediaops-stats.s3.amazonaws.com/NBA";
const UA = { "User-Agent": "deni-hub/0.1" };

// ISO duration "PT32M33.10S" → decimal minutes
function parsePt(pt: string): number {
  const m = pt.match(/PT(\d+)M([\d.]+)S/);
  return m ? Number(m[1]) + Number(m[2]) / 60 : 0;
}

// gameStatus: 1=scheduled, 2=live, 3=final; postponedStatus: "N"=normal
function mapStatus(gs: number, ps: string): ProviderGame["status"] {
  if (ps !== "N") return "postponed";
  if (gs === 3) return "final";
  if (gs === 2) return "live";
  return "scheduled";
}

function mapKind(label: string): ProviderGame["kind"] {
  if (label === "Preseason") return "preseason";
  if (label === "Play-In") return "playin";
  if (label === "Playoffs") return "playoffs";
  return "regular";
}

// Season label from gameId prefix: "002250XXXX" → year 2025 → "2025-26"
function seasonFromId(gameId: string): string {
  const yr = parseInt(gameId.slice(3, 5), 10) + 2000;
  return `${yr}-${String(yr + 1).slice(-2)}`;
}

// Cache schedule for the process lifetime (refreshed each cold start / cron invocation)
let scheduleCache: any[] | null = null;
async function getSchedule(): Promise<any[]> {
  if (scheduleCache) return scheduleCache;
  const res = await fetch(`${S3}/staticData/scheduleLeagueV2_1.json`, { headers: UA, cache: "no-store" });
  if (!res.ok) throw new Error(`nbacdn schedule ${res.status}`);
  const d = await res.json();
  scheduleCache = d.leagueSchedule.gameDates.flatMap((day: any) => day.games);
  return scheduleCache!;
}

async function fetchBoxscore(gameId: string): Promise<any> {
  const res = await fetch(`${S3}/liveData/boxscore/boxscore_${gameId}.json`, { headers: UA, cache: "no-store" });
  if (!res.ok) throw new Error(`nbacdn boxscore ${gameId} ${res.status}`);
  const d = await res.json();
  return d.game;
}

function mapScheduleGame(g: any): ProviderGame {
  const ht = g.homeTeam, at = g.awayTeam;
  return {
    providerGameId: g.gameId,
    startsAt: g.gameDateTimeUTC,
    season: seasonFromId(g.gameId),
    kind: mapKind(g.gameLabel ?? ""),
    homeTeam: `${ht.teamCity} ${ht.teamName}`,
    awayTeam: `${at.teamCity} ${at.teamName}`,
    homeScore: ht.score ?? null,
    awayScore: at.score ?? null,
    status: mapStatus(g.gameStatus, g.postponedStatus ?? "N"),
  };
}

function mapBoxscoreGame(g: any): ProviderGame {
  const ht = g.homeTeam, at = g.awayTeam;
  return {
    providerGameId: g.gameId,
    startsAt: g.gameDateTimeUTC,
    season: seasonFromId(g.gameId),
    kind: "regular",
    homeTeam: `${ht.teamCity} ${ht.teamName}`,
    awayTeam: `${at.teamCity} ${at.teamName}`,
    homeScore: ht.score ?? null,
    awayScore: at.score ?? null,
    status: mapStatus(g.gameStatus, "N"),
  };
}

function extractLine(player: any): ProviderStatLine | null {
  if (player.played !== "1") return null;
  const s = player.statistics;
  return {
    minutes: parsePt(s.minutes ?? "PT0M0.00S"),
    pts: s.points,
    reb: s.reboundsTotal,
    ast: s.assists,
    stl: s.steals,
    blk: s.blocks,
    tov: s.turnovers,
    pf: s.foulsPersonal,
    fgm: s.fieldGoalsMade,
    fga: s.fieldGoalsAttempted,
    fg3m: s.threePointersMade,
    fg3a: s.threePointersAttempted,
    ftm: s.freeThrowsMade,
    fta: s.freeThrowsAttempted,
    plus_minus: s.plusMinusPoints ?? null,
  };
}

export const nbacdn: StatsProvider = {
  name: "nbacdn",

  async gamesForTeam(teamName, from, to) {
    const all = await getSchedule();
    return all
      .filter((g) => {
        const ht = `${g.homeTeam.teamCity} ${g.homeTeam.teamName}`;
        const at = `${g.awayTeam.teamCity} ${g.awayTeam.teamName}`;
        if (ht !== teamName && at !== teamName) return false;
        const d = new Date(g.gameDateTimeUTC);
        return d >= from && d <= to;
      })
      .map(mapScheduleGame);
  },

  async game(gameId) {
    const g = await fetchBoxscore(gameId);
    return mapBoxscoreGame(g);
  },

  async playerLine(gameId, personId) {
    const g = await fetchBoxscore(gameId);
    const all = [...g.homeTeam.players, ...g.awayTeam.players];
    const player = all.find((p: any) => String(p.personId) === String(personId));
    if (!player) return null;
    return extractLine(player);
  },
};
