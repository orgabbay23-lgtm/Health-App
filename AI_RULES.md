# 🧠 AI Agent Project Context & Constraints

**Target Audience:** Any AI Assistant/Agent working on this codebase.
**CRITICAL INSTRUCTION:** Read this entire document BEFORE executing any code changes. You must NEVER violate the core principles and fixed bugs listed below.

## 1. Project Overview & Stack
* **Purpose:** A highly minimalist, premium SaaS-like clinical nutrition and calorie/protein tracker.
* **Tech Stack:** React, TypeScript, Vite, Zustand (State Management), Tailwind CSS, shadcn/ui, Lucide-React.
* **Backend & DB:** Supabase (PostgreSQL, Auth, RLS, Vault).
* **Deployment:** Vercel.
* **Language & UI:** STRICTLY Hebrew, RTL (`dir="rtl"`, `text-right`).

## 2. Core Clinical & Business Logic (DO NOT BREAK)
* **Timezone & Rollover:** The daily log resets strictly at **3:00 AM**, NOT midnight. This logic must remain intact.
* **Nutrition Formulas:** Uses specific clinical algorithms (e.g., MSJ for BMR, specific UL targets for vitamins/minerals). Do not alter the mathematical formulas.
* **AI Integration:** * Primary Model: `gemini-3-flash-preview`
    * Fallback Model: `gemini-2.5-flash`
    * *Fallback Logic:* Must automatically gracefully degrade to 2.5-flash on `429 Too Many Requests` or quota limits.

## 3. Architecture & Data Flow (Supabase + Zustand)
* **Single Source of Truth:** Supabase is the backend truth. Zustand is the local state.
* **The iOS Race Condition Bug (SOLVED):** * **Rule:** NEVER write to Supabase during app initialization. 
    * **Rule:** The app MUST use a `LoadingGate` (e.g., `appReady` state). Do NOT render the router or allow any DB writes until `supabase.auth.getSession()` and `fetchUserProfile()` have definitively resolved (either with data or confirmed null).
    * *Why:* Preventing iOS Safari from loading an empty state faster than the network and overwriting existing cloud data.

## 4. Authentication & Security (Supabase)
* **Login Methods:** Email/Password and Google OAuth.
* **Google OAuth:** Redirect URLs are explicitly set for Vercel. Ensure dynamic `window.location.origin` is used for redirects.
* **API Key Management (BYOK - Bring Your Own Key):**
    * Keys are transitioning to be stored securely in **Supabase Vault**.
    * User signup REQUIRES a mandatory "Terms of Use" checkbox consenting to secure server-side API key storage.
    * Never expose API keys in client-side logs or standard DB columns.

## 5. UI/UX Principles (Hyper-Minimalism)
* **No Clutter:** Remove verbose explanatory text. Use intuitive Lucide icons and short, punchy Hebrew labels.
* **Desktop View:** MUST be constrained (e.g., `max-w-md` or `max-w-4xl`). Do NOT let the UI stretch infinitely across wide screens. Center the main containers.
* **Mobile View:** Optimize for touch. Use bottom navigation. Ensure input fields don't cause layout breaking on iOS Safari keyboards.
* **Personalization:** The user must be addressed by their actual name (`user_metadata.full_name` or profile name), never a generic "משתמש".

## 6. Build & Deployment Standards (Vercel)
* **Zero TypeScript Errors:** Vercel strictly enforces build checks. Do NOT leave unused imports (e.g., `TS6133`), variables, or hanging syntax issues (`TS1128`).
* **Env Variables:** Handled securely via `import.meta.env`. `.env` is fully ignored.

---
**Current Phase / Next Steps (Last Updated: Feature Revert & Vault Migration)**
1. Fixing "Edit Profile" DB write issues.
2. Personalizing the app with dynamic user names everywhere.
3. Migrating API Key storage to Supabase Vault via custom SQL RPCs.