// Provider-agnostic contract. Swap BALLDONTLIE for Sportradar/API-Sports by writing another adapter.
export interface ProviderGame {
  providerGameId: string;
  startsAt: string; // ISO UTC
  season: string;   // '2026-27'
  kind: "preseason" | "regular" | "playin" | "playoffs";
  homeTeam: string; awayTeam: string;
  homeScore: number | null; awayScore: number | null;
  status: "scheduled" | "live" | "final" | "postponed";
}
export interface ProviderStatLine {
  minutes: number | null;
  pts: number; reb: number; ast: number; stl: number; blk: number; tov: number; pf: number;
  fgm: number; fga: number; fg3m: number; fg3a: number; ftm: number; fta: number;
  plus_minus: number | null;
}
export interface StatsProvider {
  name: string;
  gamesForTeam(teamName: string, from: Date, to: Date): Promise<ProviderGame[]>;
  game(providerGameId: string): Promise<ProviderGame>;
  playerLine(providerGameId: string, providerPlayerId: string): Promise<ProviderStatLine | null>;
}
