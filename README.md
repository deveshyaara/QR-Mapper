# QR Mapper

Map pre-printed badge QR codes to dynamic event ticket URLs. Staff scan a badge, then scan the attendee's QR ticket — the two are linked in the database. When the attendee later scans their own badge, they're instantly redirected to their ticket page.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** (PostgreSQL via REST API)
- **Tailwind CSS v4**
- **@yudiel/react-qr-scanner** (camera-based QR scanning)

## How It Works

```
┌────────────────┐     ┌──────────────┐     ┌──────────┐
│  Staff scans   │────▶│  Staff scans  │────▶│ Supabase │
│  badge QR      │     │  QR ticket    │     │  upsert  │
└────────────────┘     └──────────────┘     └──────────┘

┌────────────────┐     ┌──────────────┐     ┌──────────┐
│ Attendee scans │────▶│  Server-side  │────▶│ Redirect │
│  their badge   │     │  DB lookup    │     │ to ticket│
└────────────────┘     └──────────────┘     └──────────┘
```

## Routes

| Route | Type | Description |
|---|---|---|
| `/` | Static | Landing page with link to staff scanner |
| `/admin/scan` | Client | Two-step QR scanner for staff |
| `/badge/[id]` | API (GET) | Looks up badge → redirects to ticket URL |
| `/unlinked` | Static | Shown when a badge hasn't been linked yet |

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd qr-mapper
npm install
```

### 2. Configure Supabase

Copy the env template and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create the database table

Run this SQL in the [Supabase SQL Editor](https://supabase.com/dashboard):

```sql
CREATE TABLE IF NOT EXISTS badge_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_code TEXT UNIQUE NOT NULL,
  luma_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS for simplicity (enable + add policies for production)
ALTER TABLE badge_mappings DISABLE ROW LEVEL SECURITY;
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── admin/scan/page.tsx   ← Staff scanner (client component)
│   ├── badge/[id]/route.ts   ← Redirect handler (API route)
│   ├── unlinked/page.tsx     ← Fallback for unmapped badges
│   ├── page.tsx              ← Home / landing page
│   ├── layout.tsx            ← Root layout
│   └── globals.css           ← Global styles + animations
└── lib/
    └── supabase.ts           ← Supabase client + types
```

## Usage

1. Open `/admin/scan` on a staff phone
2. **Step 1** — scan the attendee's printed badge QR
3. **Step 2** — scan the attendee's QR ticket on their phone
4. ✅ Badge is linked — attendee can now scan their badge anytime to reach their ticket page

## License

MIT
