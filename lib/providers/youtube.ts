// YouTube Data API v3. We poll each whitelisted channel's uploads playlist (1 quota unit per call)
// instead of search.list (100 units). Channel IDs: fill in after mapping (see CLAUDE.md).
export const CHANNEL_WHITELIST: { id: string; name: string }[] = [
  // { id: "UC...", name: "NBA" },
  // { id: "UC...", name: "Portland Trail Blazers" },
  // { id: "UC...", name: "ספורט 5" },
];

export interface YtUpload { youtubeId: string; channelId: string; channelTitle: string; title: string; description: string; publishedAt: string; thumbnail: string | null; }

const uploadsPlaylist = (channelId: string) => "UU" + channelId.slice(2);

export async function recentUploads(channelId: string, max = 25): Promise<YtUpload[]> {
  const qs = new URLSearchParams({ part: "snippet", playlistId: uploadsPlaylist(channelId), maxResults: String(max), key: process.env.YOUTUBE_API_KEY ?? "" });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`youtube ${channelId} ${res.status}`);
  const json = await res.json();
  return (json.items ?? []).map((it: any) => ({
    youtubeId: it.snippet.resourceId.videoId,
    channelId,
    channelTitle: it.snippet.channelTitle,
    title: it.snippet.title,
    description: it.snippet.description ?? "",
    publishedAt: it.snippet.publishedAt,
    thumbnail: it.snippet.thumbnails?.high?.url ?? null,
  }));
}

export const mentionsDeni = (text: string) => /avdija|אבדיה/i.test(text);
