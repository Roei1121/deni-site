// Every 15 min: pull recent uploads from whitelisted channels, keep Deni videos,
// link to the game played in the 18h before upload, classify move type.
import { CHANNEL_WHITELIST, mentionsDeni, recentUploads } from "../providers/youtube";
import { serviceDb } from "../supabase";
import { askJson } from "../ai/claude";
import { VIDEO_CLASSIFY_SYSTEM } from "../ai/prompts";
import { deni } from "./log";

export async function huntHighlights() {
  const db = serviceDb();
  const p = await deni(db);
  let added = 0;
  for (const ch of CHANNEL_WHITELIST) {
    const uploads = (await recentUploads(ch.id)).filter((u) => mentionsDeni(`${u.title} ${u.description}`));
    for (const u of uploads) {
      const { data: exists } = await db.from("videos").select("id").eq("youtube_id", u.youtubeId).maybeSingle();
      if (exists) continue;
      const since = new Date(new Date(u.publishedAt).getTime() - 18 * 36e5).toISOString();
      const { data: game } = await db.from("games").select("id, season").eq("player_id", p.id)
        .gte("starts_at", since).lte("starts_at", u.publishedAt).order("starts_at", { ascending: false }).limit(1).maybeSingle();
      const cls = await askJson<{ move_types: string[]; about_deni: boolean }>(VIDEO_CLASSIFY_SYSTEM, `${u.title}\n\n${u.description.slice(0, 600)}`, 200);
      if (!cls.about_deni) continue;
      await db.from("videos").insert({
        player_id: p.id, youtube_id: u.youtubeId, channel_id: u.channelId, channel_title: u.channelTitle,
        title: u.title, published_at: u.publishedAt, thumbnail_url: u.thumbnail,
        game_id: game?.id ?? null, season: game?.season ?? null, move_types: cls.move_types, approved: false,
      });
      added++;
    }
  }
  return { added, channels: CHANNEL_WHITELIST.length };
}
