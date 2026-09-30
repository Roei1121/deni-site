import type { Metadata } from "next";
import Link from "next/link";
import { getVideos } from "@/lib/data";
import { MOVE_LABELS } from "@/lib/format";
import { Video } from "@/components/Video";
import type { MoveType } from "@/lib/types";

export const revalidate = 600;
export const metadata: Metadata = { title: "וידאו" };

const FILTERS: MoveType[] = ["full_recap", "dunk", "three", "assist", "block", "defense", "clutch", "interview"];

export default async function Videos({ searchParams }: { searchParams: Promise<{ move?: string }> }) {
  const { move } = await searchParams;
  const videos = await getVideos({ move });
  return (
    <main className="wrap">
      <section className="section">
        <div className="section-head"><h2>וידאו</h2></div>
        <nav className="chips" aria-label="סינון לפי סוג מהלך">
          <Link className="chip" href="/videos" aria-current={!move}>הכל</Link>
          {FILTERS.map((m) => <Link key={m} className="chip" href={`/videos?move=${m}`} aria-current={move === m}>{MOVE_LABELS[m]}</Link>)}
        </nav>
        {videos.length ? <div className="videos">{videos.map((v) => <Video key={v.youtube_id} v={v} />)}</div>
          : <p className="lede">עדיין אין סרטונים בקטגוריה הזו. נסו "הכל".</p>}
      </section>
    </main>
  );
}
