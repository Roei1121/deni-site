import { serviceDb } from "../supabase";

export async function runJob<T>(job: string, fn: () => Promise<T>) {
  const db = serviceDb();
  const { data: run } = await db.from("job_runs").insert({ job }).select("id").single();
  try {
    const detail = await fn();
    await db.from("job_runs").update({ finished_at: new Date().toISOString(), ok: true, detail }).eq("id", run?.id);
    return { ok: true, detail };
  } catch (e: any) {
    await db.from("job_runs").update({ finished_at: new Date().toISOString(), ok: false, detail: { error: String(e?.message ?? e) } }).eq("id", run?.id);
    // TODO: notify editor on Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_EDITOR_CHAT_ID)
    return { ok: false, detail: { error: String(e?.message ?? e) } };
  }
}

export async function deni(db = serviceDb()) {
  const { data, error } = await db.from("players").select("*").eq("slug", "deni-avdija").single();
  if (error || !data) throw new Error("player deni-avdija missing — run the migration");
  return data as { id: string; team_en: string; provider_ids: Record<string, string> };
}
