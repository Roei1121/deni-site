/**
 * One-off backfill: 2025-26 Portland Trail Blazers season.
 * Strategy:
 *   1. Fetch Portland's 82-game schedule from BallDontLie (free tier: /games works).
 *   2. For each game, fetch the NBA S3 boxscore by brute-forcing sequential NBA gameIds
 *      (0022500001–0022501300) with concurrency=20 to find POR games.
 *   3. Match by date + home/away tricode, upsert into games + player_game_stats.
 *
 * Run: npx tsx scripts/backfill.ts
 */

import { createClient } from "@supabase/supabase-js";

// ── config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BDL_KEY      = process.env.BALLDONTLIE_API_KEY!;
const S3           = "https://nba-prod-us-east-1-mediaops-stats.s3.amazonaws.com/NBA";
const UA           = { "User-Agent": "deni-hub/0.1" };
const DENI_PERSON  = "1630166";
const POR_TEAM_EN  = "Portland Trail Blazers";
const SEASON       = "2025-26";
const CONCURRENCY  = 20;
// ID range for the 2025-26 regular season (30 teams × 82 games / 2 = 1230 games total)
const ID_FROM = 1, ID_TO = 1300;

// ── helpers ───────────────────────────────────────────────────────────────────
function parsePt(pt: string): number {
  const m = pt.match(/PT(\d+)M([\d.]+)S/);
  return m ? Number(m[1]) + Number(m[2]) / 60 : 0;
}

function seasonLabel(startYear: number) {
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const TEAM_HE: Record<string, string> = {
  "Atlanta Hawks": "אטלנטה הוקס", "Boston Celtics": "בוסטון סלטיקס",
  "Brooklyn Nets": "ברוקלין נטס", "Charlotte Hornets": "שרלוט הורנטס",
  "Chicago Bulls": "שיקגו בולס", "Cleveland Cavaliers": "קליבלנד קאבס",
  "Dallas Mavericks": "דאלאס מאבס", "Denver Nuggets": "דנבר נאגטס",
  "Detroit Pistons": "דטרויט פיסטונס", "Golden State Warriors": "גולדן סטייט וורירז",
  "Houston Rockets": "יוסטון רוקטס", "Indiana Pacers": "אינדיאנה פייסרס",
  "LA Clippers": "לוס אנג׳לס קליפרס", "Los Angeles Lakers": "לוס אנג׳לס לייקרס",
  "Memphis Grizzlies": "ממפיס גריזליס", "Miami Heat": "מיאמי היט",
  "Milwaukee Bucks": "מילווקי באקס", "Minnesota Timberwolves": "מינסוטה טימברוולבס",
  "New Orleans Pelicans": "ניו אורלינס פליקנס", "New York Knicks": "ניו יורק ניקס",
  "Oklahoma City Thunder": "אוקלהומה סיטי ת׳אנדר", "Orlando Magic": "אורלנדו מג׳יק",
  "Philadelphia 76ers": "פילדלפיה 76רס", "Phoenix Suns": "פניקס סאנס",
  "Portland Trail Blazers": "פורטלנד טרייל בלייזרס", "Sacramento Kings": "סקרמנטו קינגס",
  "San Antonio Spurs": "סן אנטוניו ספרס", "Toronto Raptors": "טורונטו ראפטורס",
  "Utah Jazz": "יוטה ג׳אז", "Washington Wizards": "וושינגטון ויזארדס",
};

// ── BallDontLie: all POR games for 2025-26 ────────────────────────────────────
interface BdlGame {
  id: number; date: string;
  home_team: { id: number; full_name: string; abbreviation: string };
  visitor_team: { id: number; full_name: string; abbreviation: string };
  home_team_score: number | null; visitor_team_score: number | null;
  status: string; datetime: string | null; postseason: boolean;
}

async function fetchBdlGames(): Promise<BdlGame[]> {
  const out: BdlGame[] = [];
  let cursor: string | undefined;
  do {
    const qs = new URLSearchParams({
      "team_ids[]": "25", "seasons[]": "2025", per_page: "100",
      ...(cursor ? { cursor } : {}),
    });
    const res = await fetch(`https://api.balldontlie.io/v1/games?${qs}`, {
      headers: { Authorization: BDL_KEY },
    });
    if (!res.ok) throw new Error(`BallDontLie /games ${res.status}`);
    const d = await res.json();
    out.push(...d.data);
    cursor = d.meta?.next_cursor ? String(d.meta.next_cursor) : undefined;
  } while (cursor);
  return out;
}

// ── NBA S3 boxscore scan ───────────────────────────────────────────────────────
interface NbaBoxscore {
  gameId: string;
  // gameCode format: "20251022/MINPOR" — first 8 chars are YYYYMMDD
  gameCode: string;
  gameStatus: number;
  homeTeam: { teamTricode: string; teamCity: string; teamName: string; score: number | null; players: any[] };
  awayTeam: { teamTricode: string; teamCity: string; teamName: string; score: number | null; players: any[] };
}

// "20251022/MINPOR" → "2025-10-22T00:00:00.000Z"
function gameCodeToUtc(code: string): string {
  const d = code.slice(0, 8);
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T00:00:00.000Z`;
}

async function fetchBoxscore(id: string): Promise<NbaBoxscore | null> {
  try {
    const res = await fetch(`${S3}/liveData/boxscore/boxscore_${id}.json`, { headers: UA });
    if (!res.ok) return null;
    const d = await res.json();
    return d.game as NbaBoxscore;
  } catch {
    return null;
  }
}

async function scanPorBoxscores(): Promise<NbaBoxscore[]> {
  const por: NbaBoxscore[] = [];
  const ids = Array.from({ length: ID_TO - ID_FROM + 1 }, (_, i) =>
    `002250${String(ID_FROM + i).padStart(4, "0")}`
  );

  let i = 0;
  const total = ids.length;
  while (i < total) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(fetchBoxscore));
    for (const g of results) {
      if (!g) continue;
      if (g.homeTeam.teamTricode === "POR" || g.awayTeam.teamTricode === "POR") {
        por.push(g);
        const date = g.gameCode?.slice(0, 8) ?? "?";
        const opp = g.homeTeam.teamTricode === "POR"
          ? g.awayTeam.teamTricode : g.homeTeam.teamTricode;
        console.log(`  Found POR game: ${g.gameId} ${date} vs ${opp} status=${g.gameStatus}`);
      }
    }
    i += CONCURRENCY;
    if (i % 200 === 0) console.log(`  Scanned ${i}/${total}...`);
  }
  return por;
}

// ── extract Deni's stat line from boxscore ─────────────────────────────────────
function deniLine(g: NbaBoxscore) {
  const all = [...g.homeTeam.players, ...g.awayTeam.players];
  const p = all.find((x) => String(x.personId) === DENI_PERSON);
  if (!p || p.played !== "1") return null;
  const s = p.statistics;
  return {
    minutes: parsePt(s.minutes ?? "PT0M0.00S"),
    pts: s.points, reb: s.reboundsTotal, ast: s.assists,
    stl: s.steals, blk: s.blocks, tov: s.turnovers, pf: s.foulsPersonal,
    fgm: s.fieldGoalsMade, fga: s.fieldGoalsAttempted,
    fg3m: s.threePointersMade, fg3a: s.threePointersAttempted,
    ftm: s.freeThrowsMade, fta: s.freeThrowsAttempted,
    plus_minus: s.plusMinusPoints ?? null,
  };
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing Supabase env vars");
  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Get player row
  const { data: player, error: pe } = await db.from("players").select("*").eq("slug", "deni-avdija").single();
  if (pe || !player) throw new Error("Player deni-avdija not found — run the migration first");
  console.log("Player:", player.slug, "id:", player.id);

  // 1. Fetch Portland 2025-26 schedule from BallDontLie
  console.log("\n1. Fetching Portland 2025-26 schedule from BallDontLie...");
  const bdlGames = await fetchBdlGames();
  const finalBdl = bdlGames.filter((g) => g.status === "Final");
  console.log(`   Total games: ${bdlGames.length}, Final: ${finalBdl.length}`);

  // Build date→BDL lookup for matching
  const bdlByDate = new Map<string, BdlGame>();
  for (const g of bdlGames) {
    const date = (g.datetime ?? g.date).slice(0, 10);
    const isHome = g.home_team.full_name === POR_TEAM_EN;
    const opp = isHome ? g.visitor_team.abbreviation : g.home_team.abbreviation;
    bdlByDate.set(`${date}|${isHome ? "H" : "A"}|${opp}`, g);
  }

  // 2. Scan NBA boxscores for POR games (gets us NBA gameIds + Deni's stats)
  console.log(`\n2. Scanning NBA boxscore IDs 002250${String(ID_FROM).padStart(4,"0")}–002250${String(ID_TO).padStart(4,"0")} (concurrency=${CONCURRENCY})...`);
  const nbaGames = await scanPorBoxscores();
  console.log(`   Found ${nbaGames.length} Portland games in NBA boxscores`);

  // 3. Upsert into Supabase
  console.log("\n3. Upserting into Supabase...");
  let upsertedGames = 0, upsertedStats = 0, skipped = 0;

  for (const ng of nbaGames) {
    const isHome = ng.homeTeam.teamTricode === "POR";
    const oppTricode = isHome ? ng.awayTeam.teamTricode : ng.homeTeam.teamTricode;
    const oppFullName = isHome
      ? `${ng.awayTeam.teamCity} ${ng.awayTeam.teamName}`
      : `${ng.homeTeam.teamCity} ${ng.homeTeam.teamName}`;
    const startsAt = gameCodeToUtc(ng.gameCode);
    const date = startsAt.slice(0, 10);

    // Try to match BDL game for supplemental info (scores confirmed, opponent name)
    const bdlKey = `${date}|${isHome ? "H" : "A"}|${oppTricode}`;
    const bdl = bdlByDate.get(bdlKey);

    const teamScore  = isHome ? (ng.homeTeam.score ?? bdl?.home_team_score ?? null)
                               : (ng.awayTeam.score ?? bdl?.visitor_team_score ?? null);
    const oppScore   = isHome ? (ng.awayTeam.score ?? bdl?.visitor_team_score ?? null)
                               : (ng.homeTeam.score ?? bdl?.home_team_score ?? null);
    const status: string = ng.gameStatus === 3 ? "final" : ng.gameStatus === 2 ? "live" : "scheduled";

    const slug = `${date}-${slugify(POR_TEAM_EN.split(" ")[0])}-vs-${slugify(oppFullName.split(" ").slice(-1)[0])}`;

    const gameRow = {
      player_id: player.id,
      provider: "nbacdn",
      provider_game_id: ng.gameId,
      slug,
      season: SEASON,
      kind: "regular",
      starts_at: startsAt,
      is_home: isHome,
      team_en: POR_TEAM_EN,
      opponent_en: oppFullName,
      opponent_he: TEAM_HE[oppFullName] ?? null,
      team_score: teamScore,
      opponent_score: oppScore,
      status,
      closed_at: status === "final" ? startsAt : null,
    };

    const { error: ge } = await db.from("games")
      .upsert(gameRow, { onConflict: "provider,provider_game_id,player_id" });
    if (ge) { console.error(`  Game upsert error ${ng.gameId}:`, ge.message); skipped++; continue; }

    const { data: gameRow2 } = await db.from("games")
      .select("id").eq("provider_game_id", ng.gameId).eq("player_id", player.id).single();
    if (!gameRow2) { skipped++; continue; }

    upsertedGames++;

    const line = deniLine(ng);
    const statsRow = {
      game_id: gameRow2.id,
      player_id: player.id,
      ...(line ?? {}),
      did_not_play: !line || !line.minutes,
    };
    const { error: se } = await db.from("player_game_stats")
      .upsert(statsRow, { onConflict: "game_id" });
    if (se) { console.error(`  Stats upsert error ${ng.gameId}:`, se.message); }
    else upsertedStats++;
  }

  console.log(`\nDone. Games upserted: ${upsertedGames}, Stats upserted: ${upsertedStats}, Skipped: ${skipped}`);

  // 4. Verify
  const { count: gc } = await db.from("games").select("*", { count: "exact", head: true })
    .eq("player_id", player.id).eq("season", SEASON);
  const { count: sc } = await db.from("player_game_stats").select("*", { count: "exact", head: true })
    .eq("player_id", player.id);
  console.log(`Supabase: ${gc} games, ${sc} stat rows for ${player.slug} in ${SEASON}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
