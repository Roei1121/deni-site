# דני. הבוקר שאחרי

```bash
npm install
npm run dev          # http://localhost:3000 — רץ על נתוני דמו
```

חיבור לנתונים אמיתיים: להעתיק `.env.example` ל-`.env.local`, למלא, ולהריץ את
`supabase/migrations/0001_init.sql` בפרויקט Supabase.

הרצת תהליך ידנית:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-schedule
```
תהליכים: `sync-schedule`, `close-games`, `hunt-highlights`, `ingest-news`.

פירוט מלא ותוכנית המשך: `CLAUDE.md`.
