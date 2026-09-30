export type GameStatus = "scheduled" | "live" | "final" | "postponed";
export type MoveType =
  | "dunk" | "three" | "assist" | "block" | "steal" | "defense" | "clutch" | "full_recap" | "interview" | "other";

export interface StatLine {
  minutes: number | null;
  pts: number; reb: number; ast: number; stl: number; blk: number; tov: number;
  fgm: number; fga: number; fg3m: number; fg3a: number; ftm: number; fta: number;
  plus_minus: number | null;
  did_not_play: boolean;
}

export interface Game {
  id: string;
  slug: string;
  season: string;
  kind: "preseason" | "regular" | "playin" | "playoffs" | "national_team";
  starts_at: string; // ISO UTC
  is_home: boolean;
  team_en: string;
  opponent_en: string;
  opponent_he: string | null;
  team_score: number | null;
  opponent_score: number | null;
  status: GameStatus;
  stats?: StatLine | null;
  recap?: Recap | null;
}

export interface Recap {
  headline_he: string;
  body_he: string;
  key_points: string[];
  records: string[];
}

export interface Video {
  youtube_id: string;
  title: string;
  channel_title: string | null;
  published_at: string;
  thumbnail_url: string | null;
  game_slug: string | null;
  season: string | null;
  move_types: MoveType[];
}

export interface Article {
  url: string;
  source: string;
  lang: "he" | "en";
  country: "IL" | "US";
  title: string;
  summary_he: string | null;
  topic: string | null;
  published_at: string;
}

export interface SeasonStats {
  season: string;
  league: string;
  team_en: string | null;
  games: number;
  minutes: number;
  pts: number; reb: number; ast: number; stl: number; blk: number;
  fg_pct: number; fg3_pct: number; ft_pct: number;
}
