import type { Article as A } from "@/lib/types";
import { ilShort } from "@/lib/format";

export function ArticleItem({ a }: { a: A }) {
  return (
    <li>
      <a href={a.url} target="_blank" rel="noopener noreferrer" lang={a.lang}>{a.title}</a>
      {a.summary_he && a.lang !== "he" && <p>{a.summary_he}</p>}
      <div className="src"><span className="flag">{a.country === "IL" ? "ישראל" : "ארה״ב"}</span> · {a.source} · {ilShort(a.published_at)}</div>
    </li>
  );
}
