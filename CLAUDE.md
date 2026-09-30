# Deni hub — context for Claude Code

Hebrew-first (RTL) fan/coverage site about Deni Avdija. Core promise: Israeli fans wake up after a
night game and get Deni's stat line, a Hebrew recap, video and articles in 30 seconds.
Full spec: the Claude Doc "איפיון מוצר: אתר סיקור דני אבדיה" (tabs: main spec + מקורות).

## Stack
Next.js 16 (App Router, TS) · React 19 · Supabase Postgres · Vercel (hosting + Cron) · Claude API for Hebrew text.
No Supabase env → site runs on demo data from `lib/mock.ts` (banner shown).

## Map
- `supabase/migrations/0001_init.sql` — schema; every table keyed by player_id (more Israeli players later).
- `lib/data.ts` — read layer for pages (Supabase or mock).
- `lib/providers/` — `stats.ts` contract, `balldontlie.ts` adapter, `youtube.ts`, `news.ts` (RSS).
- `lib/jobs/` — `syncSchedule`, `closeGames` (box score → records → recap), `huntHighlights`, `ingestNews`; `log.ts` writes job_runs.
- `app/api/cron/[job]` — Vercel Cron entry, guarded by `CRON_SECRET`. Schedules in `vercel.json` (UTC).
- `lib/ai/prompts.ts` — Hebrew prompts + fixed glossary. Model writes words only; numbers come from DB.
- `lib/records.ts` — deterministic season/career-high detection.

## Rules
- Never download/re-host video. YouTube embeds only (youtube-nocookie).
- Articles: title + our own Hebrew summary + link. Never copy body text.
- No NBA/team logos. Footer states "unofficial fan site".
- All times shown in Asia/Jerusalem.
- No scraping of sites whose ToS forbid it (Basketball-Reference, stats.nba.com).
- Recaps default to `draft` until AUTO_PUBLISH_RECAPS=true.

## Status
Done: schema, read layer, 4 jobs, cron route, pages (home, games, game, stats, videos, news), spoiler-free mode, build passes.
Done (2026-09-30):
- Next.js 16 + React 19 upgrade; npm audit clean (0 vulnerabilities).
- Stats provider switched from balldontlie (free plan blocks /stats) to `lib/providers/nbacdn.ts` — reads NBA public S3 bucket (cdn.nba.com blocked server-side by Akamai; S3 bucket identical, open).
- Supabase connected; migration run; Deni's NBA personId `1630166` saved to `players.provider_ids.nba`.
- `sync-schedule` running on 2026-27 schedule (8 games in window); `closeGames` wired to nbacdn + correct personId.
- Backfill 2025-26: 82 games + 82 `player_game_stats` + `season_stats` (24.2 pts / 6.9 reb / 6.7 ast, 66 games played).
- `ingest-news` running: 52 articles with Hebrew summaries from Google News RSS (IL + US).
- 5 draft `game_recaps` generated for last 5 games of 2025-26; prompt fixed to include team name.
- `ANTHROPIC_MODEL=claude-sonnet-4-6` set in `.env.local` (default in code was wrong model name).

## Next (in order)
1. Deploy to Vercel: set all `.env.local` vars as Vercel env vars, verify cron triggers.
2. Fill `CHANNEL_WHITELIST` in `lib/providers/youtube.ts` (channel IDs for NBA, Trail Blazers, ספורט 5, איגוד הכדורסל).
3. Add direct publisher RSS feeds to `FEEDS` in `lib/providers/news.ts` (see מקורות tab in Claude Doc).
4. Admin page (`/admin`, Supabase auth): approve recaps, confirm video↔game + move tags.
5. Telegram alerts on job failure; then Push + Telegram channel for the 07:00 morning recap.
6. OG share image per game (`app/games/[slug]/opengraph-image.tsx`).
7. Stage 2 pages: career timeline, national team, contract & earnings.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
