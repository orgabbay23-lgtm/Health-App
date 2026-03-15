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
* * **Focus & Stability (CRITICAL):** * Never use window.focus or visibilitychange listeners to trigger global loading states or full-page refreshes.
    * If data fetching is needed on focus (e.g., token refreshes), it MUST be silent (isSilent: true) to avoid unmounting the UI or resetting local component state.
    * Maintain a 'still' UI; the app should feel like a single continuous session regardless of tab switching or backgrounding.
* **Content Visibility & Clipping (CRITICAL):*** * Never use `overflow: hidden` on parent containers that house dynamic expanding content like "Smart Tips". 
    * Use `z-index` properly to ensure floating tips appear above all other dashboard elements.
    * Expanding elements must use `height: auto` and `transition: height` to ensure Hebrew text is never clipped or hidden behind other cards.
* **Absolute Overlays (Portals):** * All floating UI elements like "Smart Tips", Popovers, or Modals MUST be rendered using a React Portal to the document body.
    * Use a reserved high Z-index range (e.g., `z-[100]`) for these elements to prevent overlap with "System Messages" or dashboard cards.
    * Ensure overlays have a semi-transparent backdrop or a distinct shadow to separate them from the background.

## 4. Security (Supabase Vault)
* **BYOK Logic:** Gemini API keys are stored in Supabase Vault.
* **Rules:** NEVER use direct `INSERT/UPDATE` on `vault.secrets`. Always use the `set_user_api_key` and `get_user_api_key` RPCs.
* **Sanitization:** All keys are sanitized (trimmed, quotes removed) before storage or use.

## 5. Self-Documentation & Evolution
* **Autonomous Rule Updates:** At the end of every task execution, the Agent MUST review the changes made and update this `AI_RULES.md` file.
* **Update Logic:** * Add new technical discoveries, fixed bugs, or structural constraints.
    * Modify existing rules if architectural decisions have evolved.
    * **STRICT RULE:** Never delete existing rules or historical context. Only append or refine.

---
**Current Phase / Next Steps (Last Updated: March 2026)**
- ✅ UI/UX Overhaul: Premium Glassmorphism & Native feel established.
- ✅ Supabase Vault & BYOK: Fully operational and secure.
- 🔄 **CURRENT PHASE:** Infusing vibrant, purposeful color into the UI to make it "alive" while maintaining a premium feel. Focusing on nutrient color-coding and dynamic visual feedback.
## 6. Native PWA & Mobile UX
* **Theme Sync:** `index.html` must include `meta name="theme-color"` matching the primary background (`#f8fafc`) and `apple-mobile-web-app-status-bar-style: black-translucent`.
* **Safe Area Insets:** Use `pt-safe-top` and `pb-safe-bottom` (defined in `tailwind.config.js`) for layout containers and floating bars (like Bottom Navigation) to prevent overlap with device hardware (notches/home indicators).
* **Scroll Hygiene:** Apply `overscroll-behavior: none` to `html` and `body` to disable browser pull-to-refresh/rubber-banding, ensuring a "one continuous surface" feel.

## 7. Bug Fix History & Lessons Learned
* **2026-03-15: Smart Tips Visibility Fix**
    * **Issue:** "Smart Tips" were being clipped by `overflow: hidden` on parent cards or overlapped by other dashboard layers despite high Z-index.
    * **Fix:** Refactored `TipPopover` to use **React Portals** (`createPortal`), rendering it directly under `document.body`.
    * **Standard:** All floating/popover elements must use Portals and a fixed Z-index (default `z-[100]`) to bypass parent stacking contexts and overflow constraints.
* **2026-03-15: Mobile PWA Unification Fix**
    * **Issue:** Unrelated system colors (status bar/browser chrome) were visible, and the bottom navigation overlapped the iOS home indicator.
    * **Fix:** Synced `theme-color`, added `black-translucent` status bar, applied `overscroll-behavior: none`, and integrated `pt-safe-top`/`pb-safe-bottom` in the layout.
    * **Standard:** Follow the "Native PWA & Mobile UX" rules for all future UI additions.

* **2026-03-15: Focus-induced Refresh Fix**
    * **Issue:** App triggered a full loading spinner/unmount when window focus changed (Visibility Change), especially on mobile.
    * **Fix:** Refactored fetchUserData to support isSilent parameter. Updated AuthProvider to use silent fetching for TOKEN_REFRESHED events. Refined fetchUserData to be silent by default if profile data already exists.
    * **Standard:** Never trigger global loading states for background sync or focus-based updates. Use "silent" data fetching to maintain UI stability and prevent component unmounting/state resets.




* **2026-03-15: Permanent Flicker & Refresh Resolution (Zustand Persistence)**
    * **Issue:** Intermittent UI refreshes/flickers despite previous focus fix. Caused by race conditions between getSession and onAuthStateChange, lack of store persistence, and non-silent data fetching logic.
    * **Fix:** 
        1. Implemented **Zustand Persistence** (persist middleware) to maintain profile and dailyLogs across reloads/unmounts.
        2. Added **Concurrency Throttling** (_lastFetchTime) in the store to block redundant fetches within 2 seconds.
        3. Refined **Silent Fetching**: Data fetch is now silent by default if profile already exists in the store.
        4. Optimized **Loading Gate**: Updated App.tsx to only show the spinner if data is missing (!profile).
        5. Fixed useActiveSavedMeals bug where it was returning profile instead of savedMeals.
    * **Standard:** Use Zustand persistence for all core user data. All data syncing must be silent if local state is already hydrated. Prevent concurrent fetch race conditions at the store level.
