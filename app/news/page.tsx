import type { Metadata } from "next";
import Link from "next/link";
import { getArticles } from "@/lib/data";
import { ArticleItem } from "@/components/Article";

export const revalidate = 600;
export const metadata: Metadata = { title: "חדשות" };

export default async function News({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const country = from === "il" ? "IL" : from === "us" ? "US" : undefined;
  const articles = await getArticles({ country });
  return (
    <main className="wrap">
      <section className="section">
        <div className="section-head"><h2>חדשות</h2></div>
        <nav className="chips" aria-label="סינון לפי מדינה">
          <Link className="chip" href="/news" aria-current={!country}>הכל</Link>
          <Link className="chip" href="/news?from=il" aria-current={country === "IL"}>ישראל</Link>
          <Link className="chip" href="/news?from=us" aria-current={country === "US"}>ארה״ב</Link>
        </nav>
        <p className="lede">כתבות באנגלית מקבלות תקציר בעברית. כל כתבה מקושרת למקור.</p>
        <ul className="news">{articles.map((a) => <ArticleItem key={a.url} a={a} />)}</ul>
      </section>
    </main>
  );
}
