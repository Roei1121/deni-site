/**
 * Run ingest-news once and print results.
 * Run: npx tsx scripts/run-ingest-news.ts
 */
import { ingestNews } from "../lib/jobs/ingestNews";
import { createClient } from "@supabase/supabase-js";

async function main() {
  console.log("Running ingest-news...");
  const result = await ingestNews();
  console.log(`Added: ${result.added} articles`);

  if (result.added === 0) {
    console.log("(All articles already existed in DB)");
  }

  // Show the 5 most recent articles with summary_he
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data } = await db
    .from("articles")
    .select("title,source,lang,country,summary_he,topic,published_at")
    .order("published_at", { ascending: false })
    .limit(5);

  console.log("\nLast 5 articles in DB:");
  for (const a of data ?? []) {
    console.log(`\n  [${a.country}/${a.lang}] ${a.source}`);
    console.log(`  EN: ${a.title}`);
    console.log(`  HE: ${a.summary_he}`);
    console.log(`  topic: ${a.topic} | ${a.published_at?.slice(0, 10)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
