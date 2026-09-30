"use client";
import { useState } from "react";
import type { Video as V } from "@/lib/types";
import { ilShort } from "@/lib/format";

/** Thumbnail until tapped, then the official YouTube embed. We never host video. */
export function Video({ v }: { v: V }) {
  const [play, setPlay] = useState(false);
  const demo = v.youtube_id.startsWith("demo");
  const thumb = v.thumbnail_url ?? (demo ? null : `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`);
  return (
    <figure className="video">
      <div className="video-frame">
        {play && !demo ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.youtube_id}?autoplay=1&rel=0`}
            title={v.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setPlay(true)} aria-label={`נגן: ${v.title}`}>
            {thumb ? <img src={thumb} alt="" loading="lazy" /> : <span className="placeholder">סרטון דמו</span>}
            <span className="play" aria-hidden />
          </button>
        )}
      </div>
      <figcaption>
        {v.title}
        <small>{v.channel_title} · {ilShort(v.published_at)}</small>
      </figcaption>
    </figure>
  );
}
