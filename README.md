# Health App

Health App is a mobile-first nutrition tracking application built with React, Vite, TypeScript, and Zustand. It combines a strict Gemini meal-parsing pipeline with clinical nutrition formulas, personalized Hebrew RTL UX, and multi-user local persistence.

## Highlights

- Multi-user architecture for up to 5 separate users, each with an isolated profile, daily logs, and saved meals.
- Gemini AI food logging with strict JSON parsing and preserved schema validation.
- Clinical nutrition targets based on Mifflin-St Jeor, protein heuristics, micronutrient targets, and safety thresholds.
- Personalized nutritional tips in Hebrew for calories, macros, vitamins, and minerals.
- 3 AM logical day rollover and date navigation across daily, weekly, and monthly views.
- Favorites workflow for re-logging saved meals from the add-meal modal.
- Framer Motion transitions and micro-interactions across onboarding, dashboard navigation, and progress states.
- Fully RTL interface tuned for Hebrew usage, including tooltips, navigation, and modal flows.

## Tech Stack

- React 18
- Vite 5
- TypeScript
- Zustand with persistence
- Tailwind CSS
- Radix UI primitives / shadcn-style components
- Framer Motion
- Google Generative AI SDK
- React Hook Form + Zod

## Core Product Areas

### 1. Multi-user experience

- Netflix-style welcome screen with user selection.
- Add-user flow with per-user color identity.
- Profile editing for both user identity and clinical profile data.

### 2. AI logging and favorites

- Natural-language meal parsing through Gemini.
- Manual ingredient entry fallback.
- Save any logged meal as a favorite and re-log it from the `מועדפים` tab.

### 3. Clinical nutrition logic

- Daily calorie and macro targets generated from clinical formulas.
- Micronutrient targets and upper-limit safety alerts.
- Personalized tooltip guidance derived from user age, gender, smoking status, and deficit goal.

### 4. Mobile-first dashboard

- Bottom navigation for Home, Calendar, Add Meal, and Profile.
- Progressive disclosure with calories and protein emphasized first.
- Full micronutrient detail hidden inside an accordion labeled `ערכים תזונתיים מלאים`.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A valid Gemini API key

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your key:

```bash
cp .env.example .env
```

```env
VITE_GEMINI_API_KEY=your_google_ai_studio_api_key_here
```

`.env` is ignored by git and should never be committed.

### Run the app

```bash
npm run dev
```

### Quality checks

```bash
npm run lint
npm run build
```

## Project Notes

- The Gemini integration, response schemas, and API error handling are intentionally preserved.
- The 3 AM day-rollover logic remains the source of truth for all date grouping.
- Persisted legacy single-user data migrates automatically into the new multi-user store on first load.

## Repository Status

The repository now includes:

- `.env` ignored in `.gitignore`
- `.env.example` with publish-safe placeholders
- Working ESLint flat config
- Updated UX architecture with modular React components
- **Vercel-ready Deployment**: Strict TypeScript checking with zero unused variable warnings, ensuring seamless CI/CD production builds.
