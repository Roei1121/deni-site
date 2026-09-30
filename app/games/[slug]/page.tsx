import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGame, getVideos } from "@/lib/data";
import { ilDate, ilTime, pct, shareLine, teamHe } from "@/lib/format";
import { Video } from "@/components/Video";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = await getGame(slug);
  if (!g) return {};
  const opp = g.opponent_he ?? teamHe(g.opponent_en);
  return { title: g.stats ? `אבדיה מול ${opp}: ${shareLine(g.stats)}` : `אבדיה מול ${opp}` };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await getGame(slug);
  if (!g) notFound();
  const videos = await getVideos({ gameSlug: g.slug });
  const s = g.stats;
  const opp = g.opponent_he ?? teamHe(g.opponent_en);
  const won = (g.team_score ?? 0) > (g.opponent_score ?? 0);

  return (
    <main className="wrap">
      <section className="section">
        <p className="lede">{ilDate(g.starts_at)} · {ilTime(g.starts_at)} שעון ישראל · {g.is_home ? "בית" : "חוץ"}</p>
        <h2>{g.recap?.headline_he ?? `פורטלנד ${g.is_home ? "נגד" : "ב"}${g.is_home ? " " : ""}${opp}`}</h2>
        {g.status === "final" && (
          <p className="lede spoiler" style={{ marginTop: 10 }}>
            {won ? "ניצחון" : "הפסד"} <span className="num">{g.team_score}-{g.opponent_score}</span>
          </p>
        )}
      </section>

      {s && !s.did_not_play && (
        <section className="section" aria-label="שורת הסטטיסטיקה של דני">
          <div className="table-wrap spoiler">
            <table>
              <thead><tr><th>דקות</th><th>נק׳</th><th>ריב׳</th><th>אס׳</th><th>חט׳</th><th>חס׳</th><th>איב׳</th><th>שדה</th><th>שלוש</th><th>עונשין</th><th>+/-</th></tr></thead>
              <tbody><tr>
                <td>{Math.round(s.minutes ?? 0)}</td><td><b>{s.pts}</b></td><td>{s.reb}</td><td>{s.ast}</td><td>{s.stl}</td><td>{s.blk}</td><td>{s.tov}</td>
                <td className="num">{s.fgm}/{s.fga} ({pct(s.fgm, s.fga)})</td><td className="num">{s.fg3m}/{s.fg3a}</td><td className="num">{s.ftm}/{s.fta}</td>
                <td className="num">{s.plus_minus != null && s.plus_minus > 0 ? "+" : ""}{s.plus_minus ?? "—"}</td>
              </tr></tbody>
            </table>
          </div>
        </section>
      )}

      {g.recap && (
        <section className="section spoiler">
          <p className="recap">{g.recap.body_he}</p>
          <ul className="points">{g.recap.key_points.map((k) => <li key={k}>{k}</li>)}</ul>
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2>וידאו מהמשחק</h2></div>
        {videos.length ? <div className="videos">{videos.map((v) => <Video key={v.youtube_id} v={v} />)}</div>
          : <p className="lede">הסרטונים עולים בדרך כלל עד שלוש שעות אחרי סיום המשחק. הדף מתעדכן לבד.</p>}
      </section>
    </main>
  );
}
