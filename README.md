# Layra

Layra is a no-code AI visual creation web app. Describe what you want in plain text, and Layra generates a ready-to-use graphic design — Instagram posts, LinkedIn banners, YouTube thumbnails, promotional flyers, and more.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4, Radix UI |
| Canvas | Fabric.js v7 |
| State | Zustand v5 |
| Validation | Zod v4 |
| AI | Claude API (`@anthropic-ai/sdk`) |
| Persistence | Supabase (optional) |
| Vectorization | imagetracerjs (local) · Vectorizer.ai (AI) |

## Features

- **AI generation** — describe a design in natural language, Claude generates a structured JSON layout that is applied directly to the Fabric.js canvas
- **Canvas editor** — drag, resize, and edit text, shapes, and images; undo/redo; keyboard shortcuts (Ctrl+Z / Ctrl+Y / Delete)
- **Layer panel** — reorder, show/hide, and lock individual elements
- **Properties panel** — live-edit font, colour, opacity, and position
- **Brand kit** — save colours, fonts, and logo; optionally lock them so the AI always respects them
- **5 starter templates** — Instagram gradient, LinkedIn pro, Minimal dark, Promo flash, YouTube thumbnail
- **Vectorizer** — convert raster images to SVG locally (free, via imagetracerjs) or with AI precision (Vectorizer.ai, 15 credits)
- **Export** — PNG and JPEG download
- **Credits system** — free: 500 credits · pro: 3 000 · team: unlimited; enforced both client-side and server-side

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Main editor page
│   └── api/
│       ├── claude/           # POST /api/claude — AI layout generation
│       └── vectorize/        # POST /api/vectorize — Vectorizer.ai proxy
├── components/
│   ├── ai/                   # GenerationOverlay, PromptBar
│   ├── brand/                # BrandKitPanel
│   ├── canvas/               # CanvasEditor, Toolbar, LayerPanel, PropertiesPanel
│   ├── editor/               # EditorShell, ExportModal
│   ├── templates/            # TemplatesPanel
│   └── vectorize/            # VectorizerModal
├── hooks/
│   ├── useAI.ts              # Orchestrates prompt → generation → canvas load
│   ├── useCanvas.ts          # Fabric.js lifecycle, add/delete/export helpers
│   ├── useHistory.ts         # Undo/redo over ClaudeLayout snapshots
│   └── useDesignPersistence.ts # Supabase CRUD for saved designs
├── store/
│   ├── canvasStore.ts        # Format, layers, generation state, history
│   ├── brandStore.ts         # Brand kits
│   ├── creditsStore.ts       # Credit balance and CREDIT_COSTS map
│   └── themeStore.ts         # Dark/light mode
├── utils/
│   ├── jsonToCanvas.ts       # ClaudeLayout → Fabric objects
│   ├── canvasToJson.ts       # Fabric objects → CanvasElement[] (for reprompt)
│   └── zodSchemas.ts         # Zod schemas shared between client and API route
├── lib/
│   ├── serverCredits.ts      # Server-side credit validation and spend (Supabase or in-memory)
│   ├── session.ts            # Anonymous session ID (localStorage)
│   └── supabase.ts           # Supabase client singleton
└── api/
    └── claude.ts             # Client wrapper for /api/claude
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in at least the Anthropic key:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | Your Anthropic API key |
| `ANTHROPIC_MODEL` | No | Model override (default: `claude-sonnet-4-6`) |
| `LAYRA_API_SECRET` | No | Shared secret to protect `/api/claude` from external calls |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Enables design persistence and server-side credits |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `VECTORIZER_API_ID` | No | Vectorizer.ai API ID (AI vectorization mode) |
| `VECTORIZER_API_SECRET` | No | Vectorizer.ai API secret |
| `REPLICATE_API_TOKEN` | No | Future: image generation |
| `RUNWAY_API_KEY` | No | Future: video generation |

### 3. Set up Supabase (optional)

If you want design persistence and server-side credit enforcement, create the two tables below in your Supabase project:

```sql
-- Credit counters per anonymous session
CREATE TABLE session_credits (
  session_id  text PRIMARY KEY,
  credits     integer NOT NULL DEFAULT 500,
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE session_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON session_credits FOR ALL USING (true) WITH CHECK (true);

-- Saved designs
CREATE TABLE designs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  text NOT NULL,
  name        text NOT NULL DEFAULT 'Sans titre',
  layout      jsonb NOT NULL,
  format      jsonb NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON designs FOR ALL USING (true) WITH CHECK (true);
```

Without Supabase, the app works fully — credits are tracked in Node.js process memory (reset on server restart) and designs are not persisted.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How the AI pipeline works

1. User types a prompt in the **Prompt Bar** and clicks Generate
2. `useAI` calls `generateLayout()` in `src/api/claude.ts`, which posts to `/api/claude`
3. The API route validates credits server-side, then calls the Claude API with a structured system prompt
4. Claude returns a JSON layout (background + elements array with positions, styles, z-indices)
5. The response is validated with Zod (`ClaudeLayoutSchema`)
6. `jsonToCanvas()` translates the layout into Fabric.js objects and renders them on the canvas
7. Credits are deducted server-side after a successful generation
8. The layout is saved to Supabase asynchronously (fire-and-forget)

For **reprompt** (modifying an existing design), `canvasToJson()` serialises the current canvas state and includes it in the Claude request so the model can make targeted modifications.

## Roadmap

- [ ] Supabase Auth (replace anonymous sessions)
- [ ] Replicate image generation integration
- [ ] Runway video generation integration
- [ ] Remotion animation export
- [ ] 20 templates
- [ ] Onboarding flow
- [ ] Billing and credit enforcement (Stripe)
