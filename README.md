# Health App (Cloud Migration)

Health App is a mobile-first nutrition tracking application built with React, Vite, TypeScript, and Supabase. It features a "Bring Your Own Key" (BYOK) Gemini AI architecture and a cloud-synced database.

## Highlights

- **Cloud Sync:** Powered by Supabase for Authentication and PostgreSQL storage.
- **BYOK Gemini AI:** Use your own Google Gemini API key, stored through the protected Supabase Vault RPC flow.
- **Gemini AI Logging:** All AI features use `gemini-3.5-flash-lite` with its default thinking configuration, then fall back on non-authentication failures to `gemini-3.8-flash` at `thinkingLevel: low`. Meal-text parsing uses Google's current Interactions API with structured JSON and may then try `gemini-3.5-flash`, followed by `gemini-3.1-flash-lite` only as a last resort. Transient `408`, `429`, and `5xx` responses receive one short retry on the regular content routes.
- **Clinical Nutrition:** Miffln-St Jeor formulas, protein heuristics, and safety-first micronutrient tracking.
- **RTL Hebrew UX:** Fully localized interface with Hebrew support across all screens.

## Tech Stack

- React 18 + Vite 5
- Supabase (Auth & Database)
- Zustand (State Management)
- Tailwind CSS + Framer Motion
- Google GenAI SDK (`@google/genai`)

## Supabase Setup

To run this project with the cloud backend:

1. Create a new project in [Supabase](https://supabase.com).
2. Run the SQL commands in `supabase-schema.sql` using the Supabase SQL Editor to set up the tables and RLS policies.
3. Copy your project URL and Anon Key into your `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A Supabase project

### Installation

```bash
npm install
```

### Run the app

```bash
npm run dev
```

### Gemini API Key (BYOK)

When you first try to log a meal using AI, the app will prompt you for your Gemini API key. You can get one at [Google AI Studio](https://aistudio.google.com/app/apikey). The key is stored through the app's protected Supabase Vault RPC flow and is never bundled into the frontend source.

## Repository Notes

- The 3 AM logical day rollover remains the source of truth for date grouping.
- Authentication is handled via Supabase Email/Password and Google OAuth.
- `.env` is fully ignored and should contain your Supabase credentials.

## Repository Status

The repository now includes:

- `.env` ignored in `.gitignore`
- `.env.example` with publish-safe placeholders
- Working ESLint flat config
- Updated UX architecture with modular React components
- **Vercel-ready Deployment**: Strict TypeScript checking with zero unused variable warnings, ensuring seamless CI/CD production builds.

## Deployment Checklist (Vercel & Supabase Auth)

To ensure Google OAuth and persistence work correctly in production:

1. **Supabase Dashboard**:
   - Go to **Authentication** -> **URL Configuration**.
   - Set **Site URL** to your Vercel deployment URL (e.g., `https://your-app.vercel.app`).
   - Add your Vercel URL with a wildcard to **Redirect URLs**: `https://your-app.vercel.app/**`.
2. **Google Cloud Console** (if using custom Google Provider):
   - Ensure the redirect URI in Google Cloud matches the one provided by Supabase (`https://<project-id>.supabase.co/auth/v1/callback`).
3. **Environment Variables**:
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel Project Settings.
4. **Runtime**:
   - Vercel uses Node.js 24.x, matching the version declared in `package.json` and validated by the production build.

