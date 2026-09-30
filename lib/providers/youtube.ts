// YouTube Data API v3. We poll each whitelisted channel's uploads playlist (1 quota unit per call)
// instead of search.list (100 units). Videos from these channels are auto-approved on ingest.
export const CHANNEL_WHITELIST: { id: string; name: string }[] = [
  { id: "UCWJ2lWNubArHWmf3FIHbfcQ", name: "NBA" },
  { id: "UCXk66yyzXo7-2M1BMqLhltQ", name: "Portland Trail Blazers" },
  { id: "UCyXf5cz6E9IIL40aivg7tOw", name: "ספורט 5" },
  { id: "UCJuHDy_gH7Qc6cn29wlRlJw", name: "איגוד הכדורסל" },
  { id: "UC9-OpMMVoNP5o10_Iyq7Ndw", name: "Bleacher Report" },
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
