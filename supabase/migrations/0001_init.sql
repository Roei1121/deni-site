-- Deni hub — schema v1. Everything keyed by player_id so more Israeli players can be added later.

create table players (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,            -- 'deni-avdija'
  name_he       text not null,
  name_en       text not null,
  team_he       text,
  team_en       text,
  provider_ids  jsonb not null default '{}'::jsonb, -- {"balldontlie": 123, "euroleague": "..."}
  created_at    timestamptz not null default now()
);

create type game_status as enum ('scheduled', 'live', 'final', 'postponed');
create type game_kind   as enum ('preseason', 'regular', 'playin', 'playoffs', 'national_team');

create table games (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid not null references players(id) on delete cascade,
  provider        text not null,
  provider_game_id text not null,
  slug            text unique not null,          -- '2026-11-03-portland-vs-denver'
  season          text not null,                 -- '2026-27'
  kind            game_kind not null default 'regular',
  starts_at       timestamptz not null,          -- UTC; UI converts to Asia/Jerusalem
  is_home         boolean not null,
  team_en         text not null,
  opponent_en     text not null,
  opponent_he     text,
  team_score      int,
  opponent_score  int,
  status          game_status not null default 'scheduled',
  closed_at       timestamptz,                   -- when close-games job finished
  unique (provider, provider_game_id, player_id)
);
create index games_player_starts on games (player_id, starts_at desc);

create table player_game_stats (
  game_id   uuid primary key references games(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  minutes   numeric(5,2),
  pts int, reb int, ast int, stl int, blk int, tov int, pf int,
  fgm int, fga int, fg3m int, fg3a int, ftm int, fta int,
  plus_minus int,
  did_not_play boolean not null default false
);

create table season_stats (
  player_id uuid not null references players(id) on delete cascade,
  season    text not null,
  league    text not null default 'NBA',        -- NBA / Euroleague / Winner / FIBA
  team_en   text,
  games     int, minutes numeric(5,2),
  pts numeric(5,2), reb numeric(5,2), ast numeric(5,2), stl numeric(5,2), blk numeric(5,2),
  fg_pct numeric(5,3), fg3_pct numeric(5,3), ft_pct numeric(5,3),
  updated_at timestamptz not null default now(),
  primary key (player_id, season, league)
);

create type recap_status as enum ('draft', 'approved', 'rejected');

create table game_recaps (
  game_id     uuid primary key references games(id) on delete cascade,
  headline_he text not null,
  body_he     text not null,
  key_points  jsonb not null default '[]'::jsonb,  -- ["...", "...", "..."]
  records     jsonb not null default '[]'::jsonb,  -- detected career/season highs
  status      recap_status not null default 'draft',
  model       text,
  created_at  timestamptz not null default now(),
  approved_at timestamptz
);

create type move_type as enum ('dunk', 'three', 'assist', 'block', 'steal', 'defense', 'clutch', 'full_recap', 'interview', 'other');

create table videos (
  id             uuid primary key default gen_random_uuid(),
  player_id      uuid not null references players(id) on delete cascade,
  youtube_id     text unique not null,
  channel_id     text not null,
  channel_title  text,
  title          text not null,
  published_at   timestamptz not null,
  thumbnail_url  text,
  game_id        uuid references games(id) on delete set null,
  season         text,
  move_types     move_type[] not null default '{}',
  approved       boolean not null default false,  -- editor confirms game link + tags
  created_at     timestamptz not null default now()
);
create index videos_player_published on videos (player_id, published_at desc);

create table articles (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  url           text unique not null,
  source        text not null,                   -- 'ynet', 'ESPN', ...
  lang          text not null,                   -- 'he' / 'en'
  country       text not null,                   -- 'IL' / 'US'
  title         text not null,
  summary_he    text,                            -- written by us, never copied
  topic         text,                            -- game / trade / injury / national_team / personal
  published_at  timestamptz not null,
  game_id       uuid references games(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index articles_player_published on articles (player_id, published_at desc);

create table contracts (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  team_en     text not null,
  signed_on   date,
  season      text not null,
  salary_usd  bigint,
  kind        text,                              -- rookie / extension / ...
  source_url  text not null
);

create table timeline_events (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  happened_on date not null,
  title_he    text not null,
  body_he     text,
  source_url  text
);

create table raw_payloads (
  id         bigserial primary key,
  provider   text not null,
  endpoint   text not null,
  payload    jsonb not null,
  fetched_at timestamptz not null default now()
);

create table job_runs (
  id          bigserial primary key,
  job         text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  ok          boolean,
  detail      jsonb
);

create table subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text unique,
  channels   text[] not null default '{email}',
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Public read, service-role write
alter table players enable row level security;
alter table games enable row level security;
alter table player_game_stats enable row level security;
alter table season_stats enable row level security;
alter table game_recaps enable row level security;
alter table videos enable row level security;
alter table articles enable row level security;
alter table contracts enable row level security;
alter table timeline_events enable row level security;
alter table raw_payloads enable row level security;
alter table job_runs enable row level security;
alter table subscribers enable row level security;

create policy read_players  on players           for select using (true);
create policy read_games    on games             for select using (true);
create policy read_pgs      on player_game_stats for select using (true);
create policy read_season   on season_stats      for select using (true);
create policy read_recaps   on game_recaps       for select using (status = 'approved');
create policy read_videos   on videos            for select using (approved);
create policy read_articles on articles          for select using (true);
create policy read_contract on contracts         for select using (true);
create policy read_timeline on timeline_events   for select using (true);

insert into players (slug, name_he, name_en, team_he, team_en)
values ('deni-avdija', 'דני אבדיה', 'Deni Avdija', 'פורטלנד טרייל בלייזרס', 'Portland Trail Blazers');
