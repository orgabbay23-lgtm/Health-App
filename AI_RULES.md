# 🧠 AI Agent Project Context & Constraints



**Target Audience:** Any AI Assistant/Agent working on this codebase.

**CRITICAL INSTRUCTION:** Read this entire document BEFORE executing any code changes. You must NEVER violate the core principles and fixed bugs listed below.



## 1. Project Overview & Stack

* **Purpose:** A highly minimalist, premium SaaS-like clinical nutrition and calorie/protein tracker.

* **Tech Stack:** React, TypeScript, Vite, Zustand (State Management), Tailwind CSS, shadcn/ui, Lucide-React, Framer Motion.

* **Backend & DB:** Supabase (PostgreSQL, Auth, RLS, Vault).

* **Deployment:** Vercel.

* **Language & UI:** STRICTLY Hebrew, RTL (`dir="rtl"`, `text-right`).



## 2. Core Clinical & Business Logic (DO NOT BREAK)

* **Timezone & Rollover:** The daily log resets strictly at **3:00 AM**, NOT midnight. This logic must remain intact.

* **Nutrition Formulas:** Uses specific clinical algorithms (e.g., MSJ for BMR, specific UL targets for vitamins/minerals). Do not alter the mathematical formulas. If UL limits are exceeded, a localized Hebrew warning must trigger.

* **AI Integration:** * Primary Model: `gemini-3-flash-preview`

* Fallback Model: `gemini-2.5-flash`

* *Fallback Logic:* Must automatically gracefully degrade on `429 Too Many Requests` or quota limits.



## 3. Architecture & Data Flow (Supabase + Zustand)

* **Single Source of Truth:** Supabase is the backend truth. Zustand is the local state.

* **Data Structure (CRITICAL):** The `dailyLogs` must remain a dictionary indexed by `"YYYY-MM-DD"` (calculated after the 3 AM offset) to support daily/weekly/monthly history views. Do not alter this schema. Maintain the `savedMeals` (Favorites) functionality.

* **The iOS Race Condition Bug (SOLVED):** * **Rule:** NEVER write to Supabase during app initialization.

* **Rule:** The app MUST use a `LoadingGate` (e.g., `appReady` state). Do NOT render the router or allow any DB writes until `supabase.auth.getSession()` and `fetchUserProfile()` have definitively resolved.

* **Form Inputs (Edit Profile):** Always use local React state (`useState`) to handle draft values for inputs to prevent UI freezing. Only sync to Zustand/Supabase upon explicit "Save" action.



## 4. Authentication & Security (Supabase Vault & BYOK)

* **API Key Management (Bring Your Own Key):** Keys are securely stored in Supabase Vault.

* **Supabase Vault Rules (CRITICAL):**

* NEVER use direct `INSERT` or `UPDATE` on `vault.secrets`. It will bypass or break `pgsodium` encryption triggers.

* Always use `vault.create_secret()` and `vault.update_secret()` for writes in the RPC.

* Always `SELECT` from the `vault.decrypted_secrets` view to read the raw string. Do NOT read from `vault.secrets` directly.

* **Frontend Security Rules:**

* The frontend MUST send the raw API key (unencrypted) to the backend RPC. Do not use client-side encryption.

* **Sanitization:** Before saving OR using the Gemini API Key, aggressively sanitize it: `String(key).replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();`



## 5. UI/UX Principles (Premium, Mobile-First, Hyper-Minimalism)

* **Zero Clutter (Show, Don't Tell):** Absolutely NO verbose explanatory text, "how it works" paragraphs, or developer logic explanations. Clean, intuitive UI only.

* **Premium Mobile-First Feel:** Must feel like a top-tier native iOS/Android app. Smooth animations (`framer-motion`), fast, zero glitches. Use a fixed Bottom Navigation Bar.

* **Modal & Bottom Sheet Safety (BUG PREVENTION):** Never use fixed heights (`h-[...]`) or `overflow: hidden` on text-heavy containers (like the Nutritional Tips). Always use `h-auto`, `max-h-[85vh]`, `overflow-y-auto`, and `pb-safe` to prevent Hebrew text clipping.

* **Strict Visual Hierarchy:** 1. **Primary (Hero):** Total Calories. Must be the largest, most prominent visual element on the Home screen.

2. **Secondary:** Macronutrients (Proteins, Fats, Carbs) directly below calories.

3. **Tertiary:** Micronutrients (Vitamins/Minerals) hidden in elegant expandable sections or horizontal scrolls.

* **Platform Divergence:**

* **Mobile:** Home screen is a Glanceable Dashboard (No long scrolls). Full meal timeline lives exclusively in the "Diary" tab.

* **Desktop:** MUST be constrained (e.g., `max-w-md` or `max-w-2xl`). Center the main containers. Do not stretch to fill desktop screens.

* **Personalization:** Address the user by their actual name (`user_metadata.full_name` or profile name), never a generic "משתמש".



## 6. Build & Deployment Standards (Vercel)

* **Zero TypeScript Errors:** Vercel strictly enforces build checks. Do NOT leave unused imports, variables, or hanging syntax issues.

* **Env Variables:** Do NOT rely on `.env` variables for the Gemini API key. Use the Vault BYOK logic.



---

**Current Phase / Next Steps (Last Updated: Pre-UI/UX Overhaul)**

- ✅ UI Race Conditions, Profile Edit bugs, and Vault Encryption fully operational.

- 🔄 **CURRENT PHASE:** Executing a massive end-to-end UI/UX overhaul. Focusing on a premium mobile-first native feel, strict visual hierarchy (Calories -> Macros -> Micros), smooth animations, and ruthless decluttering of text.