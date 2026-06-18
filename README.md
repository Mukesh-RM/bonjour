# Bonjour

A real-time two-user messaging app built with Next.js 14, Supabase, and Supabase Realtime.

## Features

- Two hardcoded users: `user1` and `user2`
- Real-time bidirectional messaging via Supabase Realtime
- Message persistence in PostgreSQL
- Telegram-like UI with message bubbles, typing indicators, and online status
- Soft delete, message editing, and read receipts
- JWT authentication with httpOnly cookies
- Rate limiting and input validation
- Mobile responsive design

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TailwindCSS
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Auth:** Custom JWT stored in httpOnly cookies
- **Deployment:** Vercel (frontend), Supabase (database)

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com).

2. Open **SQL Editor** and run the contents of `supabase/schema.sql`.

3. Enable Realtime for the `messages` table:
   - Go to **Database → Replication**
   - Ensure `messages` is enabled under `supabase_realtime`

4. Copy your project credentials from **Settings → API**:
   - Project URL
   - `anon` public key
   - `service_role` secret key

## Local Development

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment file and fill in your values:

```bash
cp .env.local.example .env.local
```

3. Set these variables in `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `JWT_SECRET` | Random string, at least 32 characters |
| `ALLOWED_ORIGIN` | Your Vercel domain for CORS (use `http://localhost:3000` locally) |

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) and log in as `user1` or `user2`.

## Vercel Deployment

1. Push the repository to GitHub.

2. Import the project in [Vercel](https://vercel.com).

3. Add all environment variables from `.env.local.example` in **Project Settings → Environment Variables**.

4. Set `ALLOWED_ORIGIN` to your Vercel domain (e.g. `https://bonjour.vercel.app`).

5. Deploy. Vercel will automatically build and serve the Next.js app.

## API Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with username |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/messages` | Fetch message history |
| POST | `/api/messages` | Send a message |
| PUT | `/api/messages/[id]` | Edit a message |
| DELETE | `/api/messages/[id]` | Soft delete a message |
| GET | `/api/status` | Get other user's online status |
| POST | `/api/status` | Update own online status |
| GET | `/api/typing` | Check if other user is typing |
| POST | `/api/typing` | Broadcast typing state |

All routes except `/api/auth/login` require a valid JWT in the `bonjour_session` httpOnly cookie.

## Architecture

```
Browser (Next.js)
  ├── /login          → Username selection
  ├── /chat           → Chat interface
  ├── API Routes      → JWT-validated CRUD operations
  └── Supabase Client → Realtime subscriptions (messages + presence)

Supabase
  ├── PostgreSQL      → auth_users, messages tables
  └── Realtime        → WebSocket broadcasts on message changes
```

## Security Notes

- JWT is stored in an httpOnly cookie (not accessible via JavaScript)
- API routes validate JWT on every request via middleware
- Rate limiting prevents message spam (30 messages/minute)
- Service role key is only used server-side, never exposed to the client
- RLS policies allow read access for Realtime; writes go through authenticated API routes
