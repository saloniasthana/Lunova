# Lunova — Your little universe of focus

Lunova is a cozy personal productivity workspace. It brings together tasks, a Pomodoro focus studio, a daily planner, habits, a calendar, ambient sound, progress insights, a focus garden and a small companion, all in one calm, pastel interface.

## Features

| Area | What works |
| --- | --- |
| **Auth** | Email/password sign-up and login (bcrypt hashes, JWT sessions via Auth.js). Optional Google sign-in. Protected routes. Every API call checks that the data belongs to the signed-in user. |
| **Home** | Time-of-day greeting, quote of the day, today's stats (tasks, focus time, streak, habits), today's tasks with quick add, focus widget, habits, a weekly focus chart, a workspace preview and the companion. |
| **My Tasks** | Create, edit, delete, duplicate and complete tasks, with subtasks, notes, tags, priority, category, project, due date/time and an estimate. Views: All, Today, Upcoming, Overdue, Priority, Completed. Search, filters, sorting, drag-and-drop reordering, custom categories. Quick add understands `!high #study tomorrow`. |
| **Focus Studio** | The timer runs from timestamps, so it stays accurate when you switch tabs and survives a page refresh. Start, pause, resume, reset, restart, skip and +5 min. Focus, short break and long break modes, auto long break, custom durations (1–180 min). Sessions are linked to tasks. Also: completion dialog, chime, browser notifications, full-screen mode, 7 focus rooms and session history. |
| **Music & Sounds** | Floating player (play/pause/next/previous/shuffle/repeat/volume) that stays with you across pages. Lo-fi, piano and sleepy tracks are generated live in the browser. 9-channel ambient mixer (rain, thunder, wind, birds, fireplace, café, ocean, white noise, brown noise) with presets and saved mixes. You can also play local files from your device; they are never uploaded. |
| **Daily Planner** | Timeline with time blocks you can drag to move and resize. Overlaps are blocked on both client and server. Blocks can be linked to tasks. Unscheduled tasks get a "Schedule" button. **Smart planner** (deterministic: priority → deadline → estimate, fitted into your working hours) with a preview you accept before anything is saved. |
| **Habits** | Daily, weekdays, weekends or chosen days. Weekly targets, reminders, pause/resume, starter habits. Current and longest streak, 30-day completion rate, weekly progress and a heatmap. |
| **Calendar** | Month, week and day views showing events, task deadlines, time blocks, focus sessions and habit reminders. Create, edit and delete events, or drag them to another day. Add tasks from any date. |
| **My Progress** | Charts built from real stored data only: focus time, tasks completed, sessions, focus by category, weekly consistency and time per task. Filters for today, this week, this month, 30 days or a custom range. Every chart has a table view. |
| **Focus Garden** | Points are calculated from real activity: 1 per completed focus minute, 5 per task, 5 per habit check-in. The server checks the balance before any unlock. 15 plants and decorations to unlock, a garden you can rearrange by dragging, and items you can hide or show. |
| **Customize** | 7 themes (light by default, plus an optional Night Sky), accent colour, background tone, 4 fonts, 14 original illustrated wallpapers, companion (cat, bunny, bear or cloud, with accessories and sizes), card and sidebar style, and a choice of dashboard widgets. |
| **Settings** | Profile, appearance, timer, music defaults, notifications (with permission handling and a test button), JSON data export, clear completed tasks, reset workspace, erase data, delete account. Every destructive action asks for confirmation. |
| **Extras** | Onboarding flow, keyboard shortcuts (`N`, `Space`, `M`, `G` then `H`/`T`/`F`/`P`/`C`, `?`), loading, empty and error states, reduced-motion support, mobile bottom navigation. |

## Tech stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · shadcn-style components on Radix UI · Lucide · Framer Motion · Recharts · dnd-kit · React Hook Form + Zod · Zustand · Auth.js v5 · Prisma 6 · PostgreSQL 16 · Web Audio API

## Getting started

**Requirements:** Node.js 20 or newer, and Docker (or any PostgreSQL 14+ database).

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Configure environment
cp .env.example .env
npx auth secret            # writes AUTH_SECRET into .env.local, or paste one into .env

# 3. Start PostgreSQL (port 5433) and create the tables
npm run db:up
npm run db:migrate

# 4. Run the app
npm run dev                # http://localhost:3000
```

Create an account on `/signup` and the onboarding flow starts.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. The default matches `docker-compose.yml`. |
| `AUTH_SECRET` | Yes | Encrypts session tokens. Generate with `npx auth secret` or `openssl rand -base64 32`. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | No | Turns on "Continue with Google". Create OAuth credentials in Google Cloud Console with the redirect URI `http://localhost:3000/api/auth/callback/google` (use your domain in production). Without them, the button shows as disabled with a short note. |

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run db:up` / `db:down` | Start / stop the Postgres container |
| `npm run db:migrate` | Create and apply migrations (development) |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Project structure

```
prisma/schema.prisma        Data model (users, tasks, sessions, habits, events, blocks, settings, garden…)
src/proxy.ts                Route protection (Next 16 "proxy", formerly middleware)
src/app/(auth)/             Login & signup
src/app/(app)/              Authenticated pages: dashboard, tasks, planner, focus, music, habits,
                            calendar, progress, garden, workspace, settings
src/app/api/                REST endpoints. Each one authenticates, validates with Zod and checks ownership.
src/components/             UI, grouped by feature (ui/ holds the shared design-system primitives)
src/stores/                 Zustand stores: data (server state, optimistic updates), timer, audio, prefs
src/hooks/                  Timer engine, reminders, clock
src/lib/                    Auth, DB, validation, dates, selectors, smart planner, garden rules, audio engine
src/server/                 Server-only helpers (serialisation, ownership, user setup)
```

### How the important parts work

- **Data flow:** after login the client loads the whole workspace once (`GET /api/bootstrap`). Changes are applied optimistically and saved through the REST API. If a save fails, the change is rolled back and a toast explains what happened. PostgreSQL is the source of truth. `localStorage` only holds non-sensitive device preferences (theme snapshot, timer state, audio and layout preferences).
- **Timer:** the end time is stored as a timestamp (`endsAt`), and the time left is always calculated as `endsAt − now`. One engine, mounted once, detects when a session ends, including after a refresh or while the tab is hidden. Sessions are recorded with their actual duration. A session stopped early is recorded as incomplete if it ran for at least a minute.
- **Audio:** everything built in is synthesised with the Web Audio API (filtered noise, scheduled synth voices), so there are no licensing issues and no fake play buttons. To add licensed audio files, see `public/audio/README.md` and `src/lib/audio/file-tracks.ts`.
- **Dates:** due dates, habit completions and time blocks are stored as local calendar dates (`YYYY-MM-DD`), so streaks don't shift across time zones. A habit can only be completed once per day, enforced by a unique constraint.

## Deployment

1. Create a managed PostgreSQL database (Neon, Supabase, RDS…) and set `DATABASE_URL`.
2. Set `AUTH_SECRET` (and the Google variables if you want Google sign-in) in your host's environment.
3. Build with `npm run build`, and run `npm run db:deploy` once per release to apply migrations.
4. On **Vercel**, import the repo, add the environment variables, and set the build command to `prisma migrate deploy && next build`.

## Known limitations

- **Password reset** needs an email provider, which isn't configured. The login page says so honestly instead of showing a fake form.
- **Reminders and notifications** fire while Lunova is open in a tab. Background push would need a service worker and a push service.
- **Rate limiting** is in-memory (login and sign-up). Use Redis or Upstash if you run more than one server instance.
- **Smart planner** is deterministic. AI suggestions aren't included.
- **Local music files** play only during the current tab session; they are never uploaded.
