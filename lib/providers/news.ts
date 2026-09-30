import { XMLParser } from "fast-xml-parser";

export interface Feed { source: string; lang: "he" | "en"; country: "IL" | "US"; url: string; filter?: RegExp }

const gnews = (q: string, lang: "he" | "en") =>
  lang === "he"
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=he&gl=IL&ceid=IL:he`
    : `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

// Direct publisher feeds get added here after tomorrow's RSS mapping (see "מקורות" tab).
export const FEEDS: Feed[] = [
  { source: "Google News", lang: "he", country: "IL", url: gnews('"דני אבדיה"', "he") },
  { source: "Google News", lang: "en", country: "US", url: gnews('"Deni Avdija"', "en") },
];

export interface FeedItem { url: string; title: string; publishedAt: string; source: string; lang: "he" | "en"; country: "IL" | "US" }

const parser = new XMLParser({ ignoreAttributes: false });

export async function readFeed(feed: Feed): Promise<FeedItem[]> {
  const res = await fetch(feed.url, { cache: "no-store", headers: { "User-Agent": "deni-hub/0.1" } });
  if (!res.ok) throw new Error(`feed ${feed.url} ${res.status}`);
  const xml = parser.parse(await res.text());
  const items: any[] = [].concat(xml?.rss?.channel?.item ?? []);
  return items
    .map((it) => {
      // Google News titles end with " - Publisher"; keep the publisher as the source.
      const raw = String(it.title ?? "");
      const pub = typeof it.source === "object" ? it.source["#text"] : undefined;
      const title = pub && raw.endsWith(` - ${pub}`) ? raw.slice(0, -(pub.length + 3)) : raw;
      return { url: String(it.link), title, publishedAt: new Date(it.pubDate ?? Date.now()).toISOString(), source: pub ?? feed.source, lang: feed.lang, country: feed.country };
    })
    .filter((i) => (feed.filter ? feed.filter.test(i.title) : true));
}
