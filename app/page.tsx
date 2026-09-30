import Link from "next/link";
import { getArticles, getLastAndNext, getSeasonStats, getVideos } from "@/lib/data";
import { ilDate, pct, teamHe, whenLabel } from "@/lib/format";
import { GameRow } from "@/components/GameRow";
import { Video } from "@/components/Video";
import { ArticleItem } from "@/components/Article";

export const revalidate = 300;

export default async function Home() {
  const [{ last, next, recent }, season, videos, articles] = await Promise.all([
    getLastAndNext(), getSeasonStats(), getVideos({ limit: 4 }), getArticles({ limit: 6 }),
  ]);
  const s = last?.stats;
  const won = last && (last.team_score ?? 0) > (last.opponent_score ?? 0);
  const cur = season[0];

  return (
    <>
      {last && s && (
        <section className="hero" aria-labelledby="last-title">
          <div className="wrap">
            <p className="hero-kicker">{ilDate(last.starts_at)}</p>
            <h1 id="last-title" className="hero-title">{last.recap?.headline_he ?? `אבדיה ${last.is_home ? "נגד" : "ב"}${last.is_home ? " " : ""}${last.opponent_he ?? teamHe(last.opponent_en)}`}</h1>
            <div className="line spoiler" aria-label={`${s.pts} נקודות, ${s.reb} ריבאונדים, ${s.ast} אסיסטים`}>
              <div><b className="num">{s.pts}</b><span>נקודות</span></div>
              <div><b className="num">{s.reb}</b><span>ריבאונדים</span></div>
              <div><b className="num">{s.ast}</b><span>אסיסטים</span></div>
            </div>
            <ul className="hero-meta spoiler">
              <li>{won ? "ניצחון" : "הפסד"} <span className="num">{last.team_score}-{last.opponent_score}</span></li>
              <li><span className="num">{s.fgm}/{s.fga}</span> מהשדה ({pct(s.fgm, s.fga)})</li>
              <li><span className="num">{s.fg3m}/{s.fg3a}</span> לשלוש</li>
              <li><span className="num">{Math.round(s.minutes ?? 0)}</span> דקות</li>
            </ul>
            {!!last.recap?.records?.length && (
              <div className="hero-records spoiler">{last.recap.records.map((r) => <span key={r} className="record">{r}</span>)}</div>
            )}
            <Link className="hero-cta" href={`/games/${last.slug}`}>לתקציר והסרטונים מהמשחק</Link>
          </div>
        </section>
      )}

      {next && (
        <div className="next">
          <div className="wrap">
            <span>המשחק הבא:</span>
            <strong>{next.is_home ? "נגד" : "ב"}{next.is_home ? " " : ""}{next.opponent_he ?? teamHe(next.opponent_en)}</strong>
            <span>{whenLabel(next.starts_at)} שעון ישראל</span>
          </div>
        </div>
      )}

      <main className="wrap">
        {cur && (
          <section className="section" aria-labelledby="season-h">
            <div className="section-head"><h2 id="season-h">העונה עד עכשיו</h2><Link href="/stats">כל הסטטיסטיקה</Link></div>
            <div className="season">
              <div><b className="num">{cur.pts.toFixed(1)}</b><span>נקודות למשחק</span></div>
              <div><b className="num">{cur.reb.toFixed(1)}</b><span>ריבאונדים</span></div>
              <div><b className="num">{cur.ast.toFixed(1)}</b><span>אסיסטים</span></div>
              <div><b className="num">{Math.round(cur.fg_pct * 100)}%</b><span>מהשדה, {cur.games} משחקים</span></div>
            </div>
          </section>
        )}

        <section className="section" aria-labelledby="video-h">
          <div className="section-head"><h2 id="video-h">סרטונים אחרונים</h2><Link href="/videos">לכל הסרטונים</Link></div>
          <div className="videos">{videos.map((v) => <Video key={v.youtube_id} v={v} />)}</div>
        </section>

        <div className="cols">
          <section className="section" aria-labelledby="news-h">
            <div className="section-head"><h2 id="news-h">מה כותבים עליו</h2><Link href="/news">לכל החדשות</Link></div>
            <ul className="news">{articles.map((a) => <ArticleItem key={a.url} a={a} />)}</ul>
          </section>
          <section className="section" aria-labelledby="games-h">
            <div className="section-head"><h2 id="games-h">משחקים אחרונים</h2><Link href="/games">ללוח המלא</Link></div>
            <ul className="games">{recent.map((g) => <GameRow key={g.id} g={g} />)}</ul>
          </section>
        </div>
      </main>
    </>
  );
}
