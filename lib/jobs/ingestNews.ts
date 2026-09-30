// Every 20 min: read feeds, dedupe by URL, write a short Hebrew summary from the headline only.
import { FEEDS, readFeed } from "../providers/news";
import { serviceDb } from "../supabase";
import { askJson } from "../ai/claude";
import { ARTICLE_SYSTEM } from "../ai/prompts";
import { deni } from "./log";

export async function ingestNews() {
  const db = serviceDb();
  const p = await deni(db);
  let added = 0;
  for (const feed of FEEDS) {
    const items = (await readFeed(feed)).slice(0, 30);
    for (const it of items) {
      const { data: exists } = await db.from("articles").select("id").eq("url", it.url).maybeSingle();
      if (exists) continue;
      const a = await askJson<{ summary_he: string; topic: string; about_deni: boolean }>(ARTICLE_SYSTEM, `${it.source}: ${it.title}`, 300);
      if (!a.about_deni) continue;
      await db.from("articles").insert({
        player_id: p.id, url: it.url, source: it.source, lang: it.lang, country: it.country,
        title: it.title, summary_he: a.summary_he, topic: a.topic, published_at: it.publishedAt,
      });
      added++;
    }
  }
  return { added };
}
