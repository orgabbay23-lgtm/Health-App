# 🧠 AI Agent Project Context & Constraints

**Target Audience:** Any AI Assistant/Agent working on this codebase.
**CRITICAL INSTRUCTION:** Read this entire document BEFORE executing any code changes.

## 1. Project Overview & Stack
* **Purpose:** A minimalist, premium SaaS-like clinical nutrition tracker.
* **Tech Stack:** React, TypeScript, Vite, Zustand, Tailwind CSS, shadcn/ui, Lucide-React, Framer Motion.
* **Backend:** Supabase (Auth, RLS, Vault for API Keys).
* **Language:** STRICTLY Hebrew, RTL (`dir="rtl"`, `text-right`).

## 2. Core Clinical & Business Logic (FIXED - DO NOT ALTER)
* **3 AM Rollover:** Daily logs reset at 03:00 AM local time.
* **Nutritional Math:** Clinical formulas (MSJ for BMR, specific UL targets) are immutable.
* **AI Fallback:** Primary: `gemini-3-flash-preview`, Fallback: `gemini-2.5-flash` on 429 errors.

## 3. UI/UX Architecture ($1B Startup Aesthetic)
* **Visual Identity:** Glassmorphism (backdrop-blur), soft layered shadows, and mesh gradients.
* **Hierarchy:** 1. Calories (Massive Ring) -> 2. Macros (Clean Grid) -> 3. Micros (Expandable).
* **Navigation:** Floating Bottom Navigation Bar with "Safe Area" support for mobile.
* **Motion:** Staggered entry animations and haptic-like scale effects (`whileTap`) on all buttons.
* **Desktop:** Strictly constrained to `max-w-2xl` and centered.
* **Ultra-Minimalist Header (Home Screen):** * The Dashboard header must be extremely slim. 
    * NO greetings, names, avatars, or large Date Navigator cards on the Home screen.
    * The only persistent element at the top should be the Today/Week/Month toggle.
    * The "Date Navigator" and biometric details should be moved to a secondary "Profile" or "Diary" view or accessible via a small, subtle icon only.

## 4. Security (Supabase Vault)
* **BYOK Logic:** Gemini API keys are stored in Supabase Vault.
* **Rules:** NEVER use direct `INSERT/UPDATE` on `vault.secrets`. Always use the `set_user_api_key` and `get_user_api_key` RPCs.
* **Sanitization:** All keys are sanitized (trimmed, quotes removed) before storage or use.

---
**Current Phase / Next Steps (Last Updated: March 2026)**
- ✅ UI/UX Overhaul: Premium Glassmorphism & Native feel established.
- ✅ Supabase Vault & BYOK: Fully operational and secure.
- 🔄 **CURRENT PHASE:** Infusing vibrant, purposeful color into the UI to make it "alive" while maintaining a premium feel. Focusing on nutrient color-coding and dynamic visual feedback.