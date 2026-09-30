// Read layer for pages. Supabase when configured, demo data otherwise.
import { hasSupabase, publicDb } from "./supabase";
import { mockArticles, mockGames, mockSeason, mockVideos } from "./mock";
import type { Article, Game, SeasonStats, Video } from "./types";

export const isDemo = !hasSupabase;
const PLAYER_SLUG = "deni-avdija";

async function playerId(): Promise<string | null> {
  const db = publicDb();
  if (!db) return null;
  const { data } = await db.from("players").select("id").eq("slug", PLAYER_SLUG).single();
  return data?.id ?? null;
}

const GAME_SELECT = "*, stats:player_game_stats(*), recap:game_recaps(headline_he, body_he, key_points, records)";

export async function getGames(): Promise<Game[]> {
  const db = publicDb(); const pid = await playerId();
  if (!db || !pid) return mockGames;
  const { data, error } = await db.from("games").select(GAME_SELECT).eq("player_id", pid).order("starts_at", { ascending: false }).limit(120);
  if (error) throw error;
  return (data ?? []) as Game[];
}

export async function getGame(slug: string): Promise<Game | null> {
  const db = publicDb();
  if (!db) return mockGames.find((g) => g.slug === slug) ?? null;
  const { data } = await db.from("games").select(GAME_SELECT).eq("slug", slug).single();
  return (data as Game) ?? null;
}

export async function getLastAndNext() {
  const games = await getGames();
  const last = games.find((g) => g.status === "final") ?? null;
  const next = [...games].reverse().find((g) => g.status === "scheduled" || g.status === "live") ?? null;
  return { last, next, recent: games.filter((g) => g.status === "final").slice(0, 5) };
}

export async function getSeasonStats(): Promise<SeasonStats[]> {
  const db = publicDb(); const pid = await playerId();
  if (!db || !pid) return mockSeason;
  const { data } = await db.from("season_stats").select("*").eq("player_id", pid).order("season", { ascending: false });
  return (data ?? []) as SeasonStats[];
}

export async function getVideos(opts: { gameSlug?: string; move?: string; limit?: number } = {}): Promise<Video[]> {
  const db = publicDb(); const pid = await playerId();
  let list: Video[];
  if (!db || !pid) list = mockVideos;
  else {
    const { data } = await db.from("videos").select("youtube_id, title, channel_title, published_at, thumbnail_url, season, move_types, game:games(slug)")
      .eq("player_id", pid).order("published_at", { ascending: false }).limit(opts.limit ?? 60);
    list = (data ?? []).map((v: any) => ({ ...v, game_slug: v.game?.slug ?? null }));
  }
  if (opts.gameSlug) list = list.filter((v) => v.game_slug === opts.gameSlug);
  if (opts.move) list = list.filter((v) => v.move_types.includes(opts.move as any));
  return list.slice(0, opts.limit ?? 60);
}

export async function getArticles(opts: { country?: "IL" | "US"; limit?: number } = {}): Promise<Article[]> {
  const db = publicDb(); const pid = await playerId();
  let list: Article[];
  if (!db || !pid) list = mockArticles;
  else {
    const { data } = await db.from("articles").select("*").eq("player_id", pid).order("published_at", { ascending: false }).limit(opts.limit ?? 50);
    list = (data ?? []) as Article[];
  }
  if (opts.country) list = list.filter((a) => a.country === opts.country);
  return list.slice(0, opts.limit ?? 50);
}
