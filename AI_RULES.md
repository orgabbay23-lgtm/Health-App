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
- ✅ UI Color Infusion: Nutrient color-coding and dynamic visual feedback complete.
- 🔄 **CURRENT PHASE:** Clinical data expansion — 23 micronutrients, 3-tier hierarchy, accessibility font scale, updated Gemini prompt.
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

* **2026-03-15: Final Focus & Refresh Resolution (Root Cause: State Destruction)**
    * **Issue:** App flickered or refreshed on focus because fetchUserData was re-initializing state (setting objects to empty/null) during background refreshes.       
    * **Fix:**
        1. Refined fetchUserData to **preserve** existing profile, dailyLogs, and savedMeals during updates. New data is merged/overwritten only when successfully fetched.
        2. Increased concurrency throttle to 5 seconds to better handle rapid focus/blur events on mobile.
        3. Ensured App.tsx logic only shows the Loading Spinner if the profile is physically missing (!profile), allowing silent background updates to happen without UI interruption.
    * **Standard:** Background data synchronization MUST be non-destructive to existing state. Never reset state to 'empty' while waiting for a network response if valid data is already present.

* **2026-03-15: Architectural Stability & Mount-Once LoadingGate**
    * **Issue:** Aggressive Supabase session refreshes on window focus were causing the app to re-trigger the loading gate, leading to UI "flickers" and state resets.
    * **Fix:**
        1.  **Mount-Once Lock:** Implemented `appInitialized` state in `App.tsx`. Once the initial boot sequence (Auth check + Profile fetch) completes, the app enters a "Ready" state that NEVER reverts to "Loading".
        2.  **Stable Supabase Auth:** Configured Supabase client with explicit `flowType: 'pkce'` and persistent session options.
        3.  **Explicit Silent Refresh:** Updated `AuthProvider` to force `isSilent: true` for `TOKEN_REFRESHED` events.
        4.  **State Preservation:** Fixed a bug in `fetchUserData` where `savedMeals` were being cleared during background syncs.
    * **Standard:** The UI must remain "locked-in" once initial boot completes. All background synchronization (focus-based or timer-based) must be silent and non-destructive. Use a persistent initialization flag to prevent loading spinners from appearing after the first successful render.

* **2026-03-15: iOS Focus-Refresh & One-Way Latch Fix**
    * **Issue:** iOS Safari/Web Clip aggressively freezes background tabs. On foregrounding, Supabase triggers `TOKEN_REFRESHED` which was causing a full UI remount and Loading Gate reset.
    * **Fix:**
        1.  **Strict One-Way Latch:** Moved `isAppReady` to the Zustand store. Once set to `true`, it is IMMUTABLE and cannot be reset except by an explicit `SIGNED_OUT` event.
        2.  **Aggressive Auth Filtering:** Updated `onAuthStateChange` to silently handle `TOKEN_REFRESHED` and `USER_UPDATED`. If a profile already exists in the store, background syncs are strictly non-blocking and skip all loading state toggles.
    * **Standard:** **iOS Background Visibility/Token Refresh Rule:** Auth listeners must silently ignore `TOKEN_REFRESHED` for UI blocking/state resets to prevent Safari remounts. Initialization states must be implemented as one-way latches in persistent storage.

## 8. iOS PWA Architecture (Immutable Shell & Visibility-Aware Motion)

* **Immutable CSS Shell (iOS Scroll Lock):**
    * The app uses a dual-layer layout: `.ios-app-shell` (a `position: fixed` container with safe-area-inset padding) wraps `.ios-scroll-canvas` (the sole scrollable element).
    * `html` and `body` are locked (`overflow: hidden`, `height: 100%`, `width: 100%`, `overscroll-behavior: none`). All vertical scrolling is delegated exclusively to `.ios-scroll-canvas`.
    * This architecture prevents Safari's dynamic viewport units (`dvh`) from triggering resize events during address bar transitions, keyboard invocation, or tab focus changes.
    * **Rule:** Never use `min-h-screen`, `h-screen`, or `100vh`/`100dvh` on root layout containers. Use the shell classes instead.

* **SafeLayoutMotion Component:**
    * All Framer Motion elements that use `layout` or `layoutId` props MUST use `<SafeLayoutMotion>` (from `src/components/SafeLayoutMotion.tsx`) instead of raw `<motion.div>`.
    * This wrapper strips `layout` and `layoutId` when `document.visibilityState` is `hidden`, preventing FLIP bounding-box calculations against corrupted DOM metrics during iOS Safari's freeze-thaw cycle.
    * The visibility state is tracked via `useIsVisible()` hook (`src/hooks/useVisibilityState.ts`) using `useSyncExternalStore` for tear-free concurrent rendering.

* **Zustand Hydration Gate:**
    * The store exposes `_hasHydrated` (set via `onRehydrateStorage` callback). `App.tsx` gates rendering on both `_hasHydrated` and `isAppReady` to prevent Flash of Unstyled Content (FOUC) from localStorage desync during concurrent renders.

* **PWA Manifest & Meta Tags:**
    * `manifest.json` enforces `"display": "standalone"` with `display_override` fallback chain.
    * Viewport meta uses `viewport-fit=cover`, `maximum-scale=1.0`, `user-scalable=no`.
    * Theme colors are media-query-split for light/dark scheme support.

## 9. QA & Performance Standards

* **Error Boundaries:**
    * A global `ErrorBoundary` component (`src/components/ErrorBoundary.tsx`) wraps the entire app in `main.tsx`.
    * On render failure, it displays a Hebrew fallback UI with a "clear cache and reload" button.
    * The boundary clears `localStorage` on reset to recover from corrupted persisted state.

* **RTL Margin Convention:**
    * **Rule:** Always use logical properties (`ms-2`, `me-2`, `ps-4`, `pe-4`) instead of physical ones (`ml-2`, `mr-2`, `pl-4`, `pr-4`) for margins and padding adjacent to text/icons.
    * This ensures correct spacing in RTL layout without manual `rtl:` prefixes.

* **Zustand Hydration Safeguards:**
    * `onRehydrateStorage` is wrapped in error handling. If deserialization fails (corrupted `app-storage`), the corrupted data is cleared and `_hasHydrated` is still set to `true` to prevent permanent loading screens.
    * `clearUserData()` uses `useAppStore.persist.clearStorage()` instead of raw `localStorage.removeItem()` to stay in sync with Zustand's persist middleware lifecycle.
    * The fetch throttle guard uses an independent time check (`now - _lastFetchTime < 5000`) without requiring `isLoadingData` to also be true, preventing race conditions.

* **Optimistic Update Rollback:**
    * All Supabase write operations (`addMealLog`, `removeMealLog`, `saveMealAsFavorite`, `removeSavedMeal`) snapshot state before optimistic updates. If the DB write returns an `error`, state is rolled back and a Hebrew toast notifies the user.
    * Background fetch merges server `savedMeals` with local optimistic entries (by ID) instead of wholesale overwriting.

* **Vault-Only API Key Policy:**
    * `getApiKey()` in `gemini.ts` does NOT fall back to `import.meta.env.VITE_GEMINI_API_KEY`. All API keys must go through Vault RPCs exclusively.
    * No API key content (even partial) is logged to the console.

* **Shadow Utility Standardization:**
    * All `shadow-soft-*` classes (`soft-sm`, `soft-lg`, `soft-xl`, `soft-2xl`) are defined in `tailwind.config.js` under `theme.extend.boxShadow`. The duplicate CSS definitions in `index.css` have been removed.

* **Modal Focus Trap:**
    * The `ModalShell` focus trap query selector covers all input types: `input:not([disabled])` (universal), not just specific `input[type="text"]` variants. This ensures Tab-trapping works for `number`, `password`, `email`, `date`, and all future input types.

## 10. Gemini Prompt & 23 Micronutrient Schema (Updated March 2026)

* **System Instruction:**
    * `gemini.ts` sends an explicit system prompt listing all 23 micronutrient keys by name and their expected units.
    * The prompt demands USDA/clinical-grade accuracy and instructs Gemini to return 0 for absent nutrients (never omit a key).
* **Schema & Validation:**
    * `mealResponseSchema` (Google Generative AI Schema) and `mealResponseParser` (Zod) both require all 25 fields in `micronutrients` (fiber, sodium + 23 clinical micronutrients).
    * New keys: `iodine`, `zinc`, `folicAcid`, `vitaminK`, `selenium`, `vitaminB6`, `vitaminB3`, `vitaminB1`, `vitaminB2`, `vitaminB5`, `biotin`, `copper`, `manganese`, `chromium`.
* **RDA Targets:**
    * All 14 new micronutrient RDA functions are in `nutrition-utils.ts`, age/gender-stratified per NIH DRI tables.
    * `calculateMicros()` returns all 25 fields (fiber + sodium + 23 micros).

## 11. 3-Tier Micronutrient Hierarchy (Updated March 2026)

* **Tier 1 (Default — always visible):** Vitamin D, B12, Iron, Magnesium, Iodine.
* **Tier 2 (Expand — "הרחב" button):** Zinc, Vitamin C, Vitamin A, Folic Acid, Calcium.
* **Tier 3 (More — "ערכים נוספים" button):** Potassium, Vitamin K, Vitamin E, Selenium, B6, B3, B1, B2, B5, Biotin, Copper, Manganese, Chromium.
* **Implementation:** `NutrientGrid.tsx` uses `useState` for tier expansion and `framer-motion` `AnimatePresence` + staggered variants for smooth entry. A "צמצם" collapse button appears when expanded.
* **Rule:** Fiber and Sodium are tracked internally but NOT displayed in the micronutrient grid (they are infrastructure nutrients managed via safety alerts).

## 12. Accessibility & Typography Standard (Updated March 2026)

* **Minimum Font Size:** All label/secondary text must be ≥ 13px (`text-[13px]`). No `text-xs` (12px) or below in data-bearing UI.
* **Contrast Boost:** All secondary labels upgraded from `text-slate-400` to `text-slate-500` or `text-slate-600` for high contrast against Glassmorphism backgrounds.
* **Scope:** Applies to NutrientCard, CompactNutrientCard, PrimaryNutrientCard, MealTimeline, DateNavigator, ProfileScreen, HistoryArchive, MealLogModal, OnboardingFlow, ByokModal.

## 13. Clinical Constants (RDA Targets - March 2026)
The following 14 micronutrient RDA values are strictly enforced based on clinical truth tables for adults (>13y):
- **Iodine (���):** 150mcg (Male/Female)
- **Zinc (���):** 11mg (Male) | 8mg (Female)
- **Folic Acid (����� �����):** 400mcg (Male/Female)
- **Vitamin K:** 120mcg (Male) | 90mcg (Female)
- **Selenium (������):** 55mcg (Male/Female)
- **Vitamin B6:** 1.3mg (Male/Female)
- **Vitamin B3 (Niacin):** 16mg (Male) | 14mg (Female)
- **Vitamin B1 (Thiamine):** 1.2mg (Male) | 1.1mg (Female)
- **Vitamin B2 (Riboflavin):** 1.3mg (Male) | 1.1mg (Female)
- **Vitamin B5:** 5mg (Male/Female)
- **Biotin (B7):** 30mcg (Male/Female)
- **Copper (�����):** 900mcg (0.9mg) (Male/Female)
- **Manganese (����):** 2.3mg (Male) | 1.8mg (Female)
- **Chromium (����):** 35mcg (Male) | 25mcg (Female)

## 14. Favorites Template Logic (Updated March 2026)

* **Template vs. Log Separation (CRITICAL):**
    * Saved Meals (Favorites) are **templates** stored in the `saved_meals` table. They are independent of historical meal logs in `daily_logs`.
    * When a user edits a Favorite via `updateSavedMeal`, **only the template** in `saved_meals` is updated. Historical `daily_logs` entries that were previously created from that template are NEVER retroactively modified.
    * `addSavedMealToDay` creates a **new copy** of the template's data (with a fresh `id` and `timestamp`) in the daily log. After creation, the logged meal has no live link back to the template.

* **`updateSavedMeal` Store Action:**
    * Accepts `savedMealId` and an object `{ meal_name, meal }`.
    * Performs optimistic update with rollback on Supabase failure.
    * Recalculates `signature` from the updated meal data.
    * Updates only `saved_meals` table (`name`, `ingredients`, `updated_at`). Does NOT touch `daily_logs`.

* **`EditFavoriteModal` Component:**
    * Located at `src/features/meal-logging/EditFavoriteModal.tsx`.
    * Allows renaming, editing ingredient list (add/remove/modify quantities), and shows real-time macro recalculation.
    * Follows Glassmorphism aesthetic, RTL logical properties (`ms-2`), minimum 13px font labels, and Immutable Shell constraints (no `h-screen`).
    * Accessed via pencil icon in the MealLogModal's "Saved" tab.

* **Rule:** Any future feature that modifies Favorites must respect the template/log boundary. Never write to `daily_logs` when updating a Favorite template, and never write to `saved_meals` when editing a historical log.

## 15. Smart Autocomplete Architecture (Updated March 2026)
* **Food Database:** The project contains a local static database of 1000 common Israeli food items (src/utils/food-suggestions.ts) to enable rapid offline-first autocompletion without network roundtrips.
* **Search Priority:** The Typeahead component (FoodTypeahead.tsx) prioritizes historical user meals (dailyLogs) before searching the static 1000-item database, ensuring personal favorites bubble to the top.
* **UI/UX:** The suggestion dropdown utilizes ramer-motion for smooth entry/exit, adheres to Glassmorphism principles (g-white/80 backdrop-blur-xl), uses ms-2 and 	ext-right for RTL correctness, and features a minimum font size of 14px (	ext-sm) for accessibility.
* **Stability:** The dropdown is rendered within the normal layout but utilizes bsolute z-[100] to avoid clipping, complying with absolute overlays without triggering viewport shifts on iOS.

## 16. Advanced Typeahead & Localized Food Database (Finalized March 2026)
* **Database Scale:** The system now utilizes a strictly unique, number-free, 10,000-item localized Hebrew food database (src/utils/food-suggestions.ts). It covers raw produce, brands (Tnuva, Strauss, Osem), home cooking, and street food.
* **Architecture (Portal-Based):** Suggestions are rendered via React Portal to the document body with z-[9999]. This bypasses modal clipping and layout constraints, essential for mobile reliability.
* **Positioning:** The suggestion list ALWAYS opens downwards (Google-style). It uses absolute positioning relative to the document scroll to remain 'glued' to the input even when the mobile keyboard shifts the viewport.
* **Multi-Select (Smart Tab):** In the 'Smart' meal logging tab, the typeahead supports comma-separated entries. It detects the current segment (after the last comma) to provide suggestions without overwriting previous text.
* **Mobile Optimization:** Uses onPointerDown to ensure selection precedes input blur on touch devices. Implements overscroll-contain and -webkit-overflow-scrolling: touch for smooth, isolated scrolling within the suggestion list.
* **Search Heuristics:** Prioritizes 'Starts-with' matches over 'Contains' matches and user history over the static database.
