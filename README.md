# Health App (Cloud Migration)

Health App is a mobile-first nutrition tracking application built with React, Vite, TypeScript, and Supabase. It features a "Bring Your Own Key" (BYOK) Gemini AI architecture and a cloud-synced database.

## Highlights

- **Cloud Sync:** Powered by Supabase for Authentication and PostgreSQL storage.
- **BYOK Gemini AI:** Use your own Google Gemini API key, stored locally in your browser for maximum privacy.
- **Gemini AI Logging:** Robust meal-parsing pipeline with primary `gemini-3-flash-preview` and fallback `gemini-2.5-flash`.
- **Clinical Nutrition:** Miffln-St Jeor formulas, protein heuristics, and safety-first micronutrient tracking.
- **RTL Hebrew UX:** Fully localized interface with Hebrew support across all screens.

## Tech Stack

- React 18 + Vite 5
- Supabase (Auth & Database)
- Zustand (State Management)
- Tailwind CSS + Framer Motion
- Google Generative AI SDK

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

When you first try to log a meal using AI, the app will prompt you for your Gemini API key. You can get one for free at [Google AI Studio](https://aistudio.google.com/app/apikey). This key is saved in your browser's `localStorage` and never sent to our servers.

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
   - (Optional) `VITE_GEMINI_API_KEY` can be set as a fallback, but users are encouraged to use their own via the UI.

