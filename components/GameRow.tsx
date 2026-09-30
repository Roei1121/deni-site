import Link from "next/link";
import type { Game } from "@/lib/types";
import { ilShort, shareLine, teamHe, whenLabel } from "@/lib/format";

export function GameRow({ g }: { g: Game }) {
  const opp = g.opponent_he ?? teamHe(g.opponent_en);
  const final = g.status === "final";
  const won = final && (g.team_score ?? 0) > (g.opponent_score ?? 0);
  return (
    <li>
      <Link className="game-row" href={`/games/${g.slug}`}>
        <span className="game-date">{ilShort(g.starts_at)}</span>
        <span>
          <span className="game-opp">{g.is_home ? "נגד" : "ב"}{g.is_home ? " " : ""}{opp}<small>{g.is_home ? "בית" : "חוץ"}</small></span>
          <br />
          <span className="game-line spoiler">
            {final ? (g.stats && !g.stats.did_not_play ? shareLine(g.stats) : "לא שיחק") : whenLabel(g.starts_at)}
          </span>
        </span>
        {final ? (
          <span className={`result spoiler ${won ? "w" : "l"}`}>
            {won ? "נ" : "ה"} <span className="num">{g.team_score}-{g.opponent_score}</span>
          </span>
        ) : <span className="result">{g.status === "live" ? "חי" : ""}</span>}
      </Link>
    </li>
  );
}
