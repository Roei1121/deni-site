import type { Metadata } from "next";
import { getGames, getSeasonStats } from "@/lib/data";
import { ilShort, pct, teamHe } from "@/lib/format";

export const revalidate = 3600;
export const metadata: Metadata = { title: "סטטיסטיקה" };

export default async function Stats() {
  const [seasons, games] = await Promise.all([getSeasonStats(), getGames()]);
  const log = games.filter((g) => g.status === "final" && g.stats && !g.stats.did_not_play);
  return (
    <main className="wrap">
      <section className="section">
        <div className="section-head"><h2>ממוצעים לפי עונה</h2></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>עונה</th><th>ליגה</th><th>משח׳</th><th>דקות</th><th>נק׳</th><th>ריב׳</th><th>אס׳</th><th>שדה</th><th>שלוש</th><th>עונשין</th></tr></thead>
            <tbody>{seasons.map((s) => (
              <tr key={s.season + s.league}>
                <td className="num">{s.season}</td><td>{s.league}</td><td>{s.games}</td><td>{s.minutes.toFixed(1)}</td>
                <td><b>{s.pts.toFixed(1)}</b></td><td>{s.reb.toFixed(1)}</td><td>{s.ast.toFixed(1)}</td>
                <td>{Math.round(s.fg_pct * 100)}%</td><td>{Math.round(s.fg3_pct * 100)}%</td><td>{Math.round(s.ft_pct * 100)}%</td>
              </tr>))}</tbody>
          </table>
        </div>
      </section>
      <section className="section">
        <div className="section-head"><h2>משחק אחר משחק</h2></div>
        <div className="table-wrap spoiler">
          <table>
            <thead><tr><th>יריבה</th><th>תאריך</th><th>נק׳</th><th>ריב׳</th><th>אס׳</th><th>שדה</th><th>שלוש</th><th>+/-</th></tr></thead>
            <tbody>{log.map((g) => { const s = g.stats!; return (
              <tr key={g.id}>
                <td><a href={`/games/${g.slug}`}>{g.opponent_he ?? teamHe(g.opponent_en)}</a></td><td>{ilShort(g.starts_at)}</td>
                <td><b>{s.pts}</b></td><td>{s.reb}</td><td>{s.ast}</td>
                <td className="num">{s.fgm}/{s.fga} ({pct(s.fgm, s.fga)})</td><td className="num">{s.fg3m}/{s.fg3a}</td><td className="num">{s.plus_minus}</td>
              </tr>); })}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
