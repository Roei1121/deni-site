// נתוני דמו בלבד — לא נתונים אמיתיים. משמשים כשאין חיבור ל-Supabase.
import type { Article, Game, SeasonStats, Video } from "./types";

const H = 36e5;
const now = Date.now();
const iso = (hoursFromNow: number) => new Date(now + hoursFromNow * H).toISOString();

const line = (pts: number, reb: number, ast: number, extra: Partial<Record<string, number>> = {}) => ({
  minutes: 34, pts, reb, ast, stl: extra.stl ?? 1, blk: extra.blk ?? 0, tov: extra.tov ?? 2,
  fgm: extra.fgm ?? Math.round(pts / 2.4), fga: extra.fga ?? Math.round(pts / 1.2),
  fg3m: extra.fg3m ?? 2, fg3a: extra.fg3a ?? 5, ftm: extra.ftm ?? 4, fta: extra.fta ?? 5,
  plus_minus: extra.pm ?? 4, did_not_play: false,
});

export const mockGames: Game[] = [
  {
    id: "g5", slug: "demo-next-vs-lakers", season: "2026-27", kind: "regular",
    starts_at: iso(20), is_home: true, team_en: "Portland Trail Blazers",
    opponent_en: "Los Angeles Lakers", opponent_he: "הלייקרס",
    team_score: null, opponent_score: null, status: "scheduled",
  },
  {
    id: "g4", slug: "demo-last-vs-denver", season: "2026-27", kind: "regular",
    starts_at: iso(-7), is_home: false, team_en: "Portland Trail Blazers",
    opponent_en: "Denver Nuggets", opponent_he: "דנבר",
    team_score: 118, opponent_score: 112, status: "final",
    stats: line(28, 9, 7, { fgm: 10, fga: 18, fg3m: 3, fg3a: 6, ftm: 5, fta: 6, pm: 11, stl: 2 }),
    recap: {
      headline_he: "אבדיה הוביל את פורטלנד לניצחון חוץ בדנבר",
      body_he:
        "נתוני דמו. אבדיה סיים עם 28 נקודות, 9 ריבאונדים ו-7 אסיסטים ב-34 דקות, וקלע 10 מ-18 מהשדה. ברבע הרביעי קלע 11 נקודות, כולל שלשה שהעלתה את פורטלנד ליתרון של 6 שתי דקות לסיום.",
      key_points: ["11 נקודות ברבע הרביעי", "3 מ-6 לשלוש", "פלוס 11 כשהיה על המגרש"],
      records: ["שיא עונתי בנקודות"],
    },
  },
  {
    id: "g3", slug: "demo-vs-golden-state", season: "2026-27", kind: "regular",
    starts_at: iso(-55), is_home: true, team_en: "Portland Trail Blazers",
    opponent_en: "Golden State Warriors", opponent_he: "גולדן סטייט",
    team_score: 104, opponent_score: 109, status: "final",
    stats: line(19, 7, 5, { pm: -3 }),
  },
  {
    id: "g2", slug: "demo-vs-phoenix", season: "2026-27", kind: "regular",
    starts_at: iso(-103), is_home: false, team_en: "Portland Trail Blazers",
    opponent_en: "Phoenix Suns", opponent_he: "פיניקס",
    team_score: 121, opponent_score: 115, status: "final",
    stats: line(22, 8, 6, { pm: 7 }),
  },
  {
    id: "g1", slug: "demo-vs-utah", season: "2026-27", kind: "regular",
    starts_at: iso(-150), is_home: true, team_en: "Portland Trail Blazers",
    opponent_en: "Utah Jazz", opponent_he: "יוטה",
    team_score: 126, opponent_score: 101, status: "final",
    stats: line(17, 10, 8, { pm: 18 }),
  },
];

export const mockSeason: SeasonStats[] = [
  { season: "2026-27", league: "NBA", team_en: "Portland Trail Blazers", games: 4, minutes: 34, pts: 21.5, reb: 8.5, ast: 6.5, stl: 1.3, blk: 0.3, fg_pct: 0.49, fg3_pct: 0.38, ft_pct: 0.8 },
];

export const mockVideos: Video[] = [
  { youtube_id: "demo1", title: "דמו: כל הנקודות מהניצחון בדנבר", channel_title: "ערוץ דמו", published_at: iso(-5), thumbnail_url: null, game_slug: "demo-last-vs-denver", season: "2026-27", move_types: ["full_recap"] },
  { youtube_id: "demo2", title: "דמו: ההטבעה מהרבע השלישי", channel_title: "ערוץ דמו", published_at: iso(-5.5), thumbnail_url: null, game_slug: "demo-last-vs-denver", season: "2026-27", move_types: ["dunk"] },
  { youtube_id: "demo3", title: "דמו: 5 אסיסטים מול גולדן סטייט", channel_title: "ערוץ דמו", published_at: iso(-52), thumbnail_url: null, game_slug: "demo-vs-golden-state", season: "2026-27", move_types: ["assist"] },
  { youtube_id: "demo4", title: "דמו: חסימה בשנייה האחרונה", channel_title: "ערוץ דמו", published_at: iso(-100), thumbnail_url: null, game_slug: "demo-vs-phoenix", season: "2026-27", move_types: ["block", "clutch"] },
];

export const mockArticles: Article[] = [
  { url: "https://example.com/demo-1", source: "מקור דמו", lang: "he", country: "IL", title: "כותרת דמו: אבדיה אחרי המשחק בדנבר", summary_he: "תקציר דמו בעברית, נכתב מחדש ולא הועתק.", topic: "game", published_at: iso(-4) },
  { url: "https://example.com/demo-2", source: "Demo Source", lang: "en", country: "US", title: "Demo headline: Avdija powers Portland past Denver", summary_he: "תקציר דמו מתורגם מכתבה אמריקאית.", topic: "game", published_at: iso(-6) },
  { url: "https://example.com/demo-3", source: "מקור דמו", lang: "he", country: "IL", title: "כותרת דמו: הנבחרת לקראת חלון נובמבר", summary_he: "תקציר דמו.", topic: "national_team", published_at: iso(-30) },
];
