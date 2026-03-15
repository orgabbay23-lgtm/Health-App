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
    * *Fallback Logic:* Must automatically gracefully degrade on `429 Too Many Requests` or quota limits.

## 3. Architecture & Data Flow (Supabase + Zustand)
* **Single Source of Truth:** Supabase is the backend truth. Zustand is the local state.
* **The iOS Race Condition Bug (SOLVED):** * **Rule:** NEVER write to Supabase during app initialization. 
    * **Rule:** The app MUST use a `LoadingGate` (e.g., `appReady` state). Do NOT render the router or allow any DB writes until `supabase.auth.getSession()` and `fetchUserProfile()` have definitively resolved (either with data or confirmed null).
* **Form Inputs (Edit Profile):** Always use local React state (`useState`) to handle draft values for inputs to prevent UI freezing. Only sync to Zustand/Supabase upon explicit "Save" action.

## 4. Authentication & Security (Supabase Vault & BYOK)
* **API Key Management (Bring Your Own Key):** Keys are securely stored in Supabase Vault.
* **Supabase Vault Rules (CRITICAL):**
    * NEVER use direct `INSERT` or `UPDATE` on `vault.secrets`. It will bypass or break `pgsodium` encryption triggers.
    * Always use `vault.create_secret()` and `vault.update_secret()` for writes in the RPC.
    * Always `SELECT` from the `vault.decrypted_secrets` view to read the raw string. Do NOT read from `vault.secrets` directly (it returns the encrypted binary blob).
* **Frontend Security Rules:**
    * The frontend MUST send the raw API key (unencrypted) to the backend RPC. Do not use client-side encryption (`btoa`, etc.). Supabase handles encryption at-rest natively.
    * **Sanitization:** Before saving OR using the Gemini API Key, the frontend must aggressively sanitize it to prevent HTTP Header errors: 
      `const cleanKey = String(key).replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();`

## 5. UI/UX Principles (Hyper-Minimalism)
* **No Clutter:** Remove verbose explanatory text. Use intuitive Lucide icons and short, punchy Hebrew labels.
* **Desktop View:** MUST be constrained (e.g., `max-w-md` or `max-w-4xl`). Do NOT let the UI stretch infinitely across wide screens. Center the main containers.
* **Mobile View:** Optimize for touch. Use bottom navigation. Ensure input fields don't cause layout breaking on iOS Safari keyboards.
* **Personalization:** The user must be addressed by their actual name (`user_metadata.full_name` or profile name), never a generic "משתמש".

## 6. Build & Deployment Standards (Vercel)
* **Zero TypeScript Errors:** Vercel strictly enforces build checks. Do NOT leave unused imports, variables, or hanging syntax issues.
* **Env Variables:** Do NOT rely on `.env` variables for the Gemini API key. The app must strictly rely on the Vault BYOK logic.

---
**Current Phase / Next Steps (Last Updated: Supabase Vault Migration Complete)**
- ✅ UI Race Conditions & Profile Edit bugs fixed.
- ✅ Gemini API Key sanitization and Vault At-Rest Encryption fully operational.
