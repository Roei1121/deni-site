import { NextRequest, NextResponse } from "next/server";
import { runJob } from "@/lib/jobs/log";
import { syncSchedule } from "@/lib/jobs/syncSchedule";
import { closeGames } from "@/lib/jobs/closeGames";
import { huntHighlights } from "@/lib/jobs/huntHighlights";
import { ingestNews } from "@/lib/jobs/ingestNews";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const JOBS: Record<string, () => Promise<unknown>> = {
  "sync-schedule": syncSchedule,
  "close-games": closeGames,
  "hunt-highlights": huntHighlights,
  "ingest-news": ingestNews,
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { job } = await params;
  const fn = JOBS[job];
  if (!fn) return NextResponse.json({ error: `unknown job ${job}` }, { status: 404 });
  const result = await runJob(job, fn);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
