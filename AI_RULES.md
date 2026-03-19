# ג‚×ֲ  AI Agent Project Context & Constraints

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
* **AI Routing:** All models use `thinkingLevel: "high"`. Meal parsing and vision optimistically attempt `gemini-3-flash-preview`. If ANY error occurs, they seamlessly fallback to `gemini-3.1-flash-lite-preview`. Insights exclusively use the Lite model. Database quota counting is REMOVED.
* **Timeframe Target Accumulation:** Weekly and Monthly periods use a rolling window backward from yesterday (excluding the current day). Weekly = Last 7 days, Monthly = Last 30 days. Targets ONLY accumulate for "Active Days". An active day is defined as any past day within the rolling timeframe that contains at least one logged meal (`dailyLogs[dayKey]?.meals?.length > 0`). Empty past days are completely excluded from both the averages and the target multiplier to prevent artificial target inflation. This applies to calories, macros, all 24 micronutrients, progress bar percentages, and AI insight generation.

## 3. UI/UX Architecture ($1B Startup Aesthetic)
* **Data Visualization:** Progress rings and macro cards display dynamic, animated percentage indicators. Percentages exceeding 100% gracefully transition to warning colors to alert the user without breaking the aesthetic.
* **Visual Identity:** Glassmorphism (backdrop-blur), soft layered shadows, and mesh gradients.
* **Color Rule (3-Stage Color Status Quo):** ALL bars start Blue (<50%). Between 50%-100%: Limit Nutrients turn Orange, Goal/UL Nutrients turn Turquoise. Above 100%: Limit Nutrients turn Red, Goal/UL Nutrients turn Green. UL Nutrients ONLY turn Red if exceeding their extreme UL threshold.
* **Hierarchy:** 1. Calories (Massive Ring) -> 2. Macros (Clean Grid) -> 3. Micros (Expandable).
* **Navigation:** Floating Bottom Navigation Bar with "Safe Area" support for mobile.
* **Motion:** Staggered entry animations and haptic-like scale effects (`whileTap`) on all buttons.       
* **Desktop:** Strictly constrained to `max-w-2xl` and centered.
* **Ultra-Minimalist Header (Home Screen):** * The Dashboard header must be extremely slim.
    * NO greetings, names, avatars, or large Date Navigator cards on the Home screen.
    * The only persistent element at the top should be the Today/Week/Month toggle.
    * The "Date Navigator" and biometric details should be moved to a secondary "Profile" or "Diary" view or accessible via a small, subtle icon only.
* * **Focus & Stability (CRITICAL):** * Never use window.focus or
visibilitychange listeners to trigger global loading states or full-page refreshes.
    * If data fetching is needed on focus (e.g., token refreshes), it MUST be silent (isSilent: true) to avoid unmounting the UI or resetting local component state.
    * Maintain a 'still' UI; the app should feel like a single continuous session regardless of tab switching or backgrounding.
* **Content Visibility & Clipping (CRITICAL):*** * Never use `overflow: hidden` on parent containers that house dynamic expanding content like "Smart Tips".
    * Use `z-index` properly to ensure floating tips appear above all other dashboard elements.
    * Expanding elements must use `height: auto` and `transition: height` to ensure Hebrew text is never clipped or hidden behind other cards.
* **Absolute Overlays (Portals):** * All floating UI elements like "Smart Tips", Popovers, or Modals MUST be rendered using a React Portal to the document body.
    * Use a reserved high Z-index range (e.g., `z-[100]`) for these elements to prevent overlap with "System Messages" or dashboard cards.
    * Ensure overlays have a semi-transparent backdrop or a distinct shadow to separate them from the background.

* **Lottie Micro-interactions:** App utilizes lottie-react. The 'Orange Cat Peeping' animation is rendered absolutely behind the main calorie ring with a negative z-index. It is configured with loop={false} to play once on load and freeze permanently on the final frame.

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
- ׳’ג€¦ UI/UX Overhaul: Premium Glassmorphism & Native feel established.
- ׳’ג€¦ Supabase Vault & BYOK: Fully operational and secure.
- ׳’ג€¦ UI Color Infusion: Nutrient color-coding and dynamic visual feedback complete.
- ׳’ג€¦ Clinical data expansion ׳’ג‚¬ג€ 24 micronutrients (including Omega 3 EPA+DHA), 3-tier hierarchy, accessibility font scale, updated Gemini prompt.
- ׳³ֲ ׳’ג‚¬׳’ג‚¬ **CURRENT PHASE:** Contextual AI Insights & UX Refinement ׳³ג€™׳’ג€ֲ¬׳’ג‚¬ Smart nutritional recommendations and seamless feedback loops (auto-navigation + scroll).
## 6. Native PWA & Mobile UX
* **Theme Sync:** `index.html` must include `meta name="theme-color"` matching the primary background (`#f8fafc`) and `apple-mobile-web-app-status-bar-style: black-translucent`.
* **Safe Area Insets:** Use `pt-safe-top` and `pb-safe-bottom` (defined in `tailwind.config.js`) for layout containers and floating bars (like Bottom Navigation) to prevent overlap with device hardware (notches/home indicators).
* **Scroll Hygiene:** Apply `overscroll-behavior: none` to `html` and `body` to disable browser pull-to-refresh/rubber-banding, ensuring a "one continuous surface" feel.

## 6b. Mobile UX Input Standards (Hardened ׳’ג‚¬ג€ March 2026)
* **iOS Zoom Prevention (CRITICAL):** All interactive form elements (`<input>`, `<textarea>`, `<select>`) must use `text-[16px]` (hardcoded arbitrary Tailwind value). Do NOT use `text-base` ׳’ג‚¬ג€ it resolves to `1rem` which depends on root font-size and can be overridden by parent containers. iOS Safari forcefully zooms the viewport when any input with computed font-size below 16px receives focus.
* **No Framer `layout` on Modals (CRITICAL):** Never use `layout` or `layoutId` props on modal/dialog containers. When the iOS virtual keyboard appears/disappears, `dvh` units change the element's bounding box, causing Framer Motion's FLIP algorithm to trigger a layout animation ׳’ג‚¬ג€ this is the root cause of the "viewport wildly jumping" bug. Entry/exit animations (`initial`/`animate`/`exit`) are sufficient.
* **Viewport Meta ׳’ג‚¬ג€ `interactive-widget`:** The viewport meta tag must include `interactive-widget=resizes-content` to instruct Safari to resize the layout viewport (not shift the visual viewport) when the virtual keyboard appears.
* **Focus Scroll Stabilization:** All text inputs inside modals should call `element.scrollIntoView({ behavior: 'smooth', block: 'center' })` via a `setTimeout` (~350ms) in their `onFocus` handler to ensure the input stays visible after the keyboard finishes expanding.
* **Portal Dropdown Blur Prevention (CRITICAL):** Portal-based dropdowns (autocomplete, popovers) must use `onPointerDown` with `e.preventDefault()` on the dropdown container ׳’ג‚¬ג€ NOT `onMouseDown`. On iOS, `mousedown` fires AFTER `touchstart`-induced blur, so it's too late to prevent the input from losing focus. `pointerdown` fires before blur on all platforms. Additionally, NEVER call `inputRef.focus()` after selecting from a dropdown ׳’ג‚¬ג€ on desktop blur is already prevented, on iOS it causes a keyboard dismiss׳’ג€ ג€™reappear cycle that violently jumps the viewport.
* **Multi-Line for Long Text:** Use multi-line `<textarea>` with `whitespace-pre-wrap break-words` for any text entry that may contain long descriptions (e.g., meal descriptions, ingredient lists). Single-line `<input>` truncates long Hebrew strings and forces horizontal scrolling, which is unusable on mobile.       
* **Viewport-Aware Modals:** Modal containers must use `dvh` units (`max-h-[85dvh]`) instead of `vh` to naturally shrink when the iOS virtual keyboard appears. Add `overscroll-contain` to prevent scroll bleed-through.
* **Centered Modal Positioning (CRITICAL):** All modals (including MealLogModal) MUST be strictly centered on the screen on all devices using `flex items-center justify-center` on the overlay and a scale animation (`scale: 0.93` ג†’ `1`). Do NOT use bottom-sheet/drawer positioning (`items-end`, `mt-auto`, `rounded-b-none`, `y: "100%"` animations). Modal panels use `w-[95vw] max-h-[85dvh] rounded-[2rem] sm:max-w-md md:max-w-2xl`.
* **Inline Dropdowns in Modals (CRITICAL ג€” replaces Portal approach):** Autocomplete/typeahead dropdowns inside modals MUST be rendered **inline** (in the normal document flow below the input), NOT via React Portal with `position: fixed`. `position: fixed` + `getBoundingClientRect()` coordinates are unreliable on iOS Safari when the virtual keyboard reshapes the viewport ג€” the dropdown ends up at stale coordinates and covers the input. Inline rendering guarantees the dropdown is always physically below the input regardless of keyboard state. Use `max-h-[200px] overflow-y-auto` and auto-scroll with `scrollIntoView({ block: 'nearest' })` when suggestions appear. The modal's `overflow-y-auto` content area handles scrolling naturally.

## 7. Bug Fix History & Lessons Learned
* **2026-03-17: Active Days Target Accumulation (Clinical Math Fix)**
    * **Issue:** Weekly/Monthly period targets were multiplied by total days elapsed in the period (`periodDetails.dayKeys.length`). If a user didn't log meals on Sunday and Monday, Tuesday's weekly view showed a 3-day calorie budget (e.g., 6000 kcal) despite only having data for one day ג€” artificially inflating targets and skewing progress bars and AI insights.
    * **Fix:** Replaced the naive `dayKeys.length` multiplier with an `activeDaysCount` that only counts: (1) Today (always counted ג€” user needs a target for the current day), and (2) past days that have at least one logged meal. Minimum multiplier is 1. Applied in `Dashboard.tsx` `periodTargets` memo. Since `periodTargets` is passed as a prop to all consumers (progress bars, AI insight generator), the fix propagates automatically.
    * **Standard:** See updated "Timeframe Target Accumulation" rule in Section 2.

* **2026-03-17: Autocomplete Dropdown ג€” Portal to Inline Migration (Final Fix)**
    * **Issue:** On iOS Safari with the virtual keyboard open, the autocomplete dropdown covered the text input. Multiple attempts to fix via `position: fixed` coordinate math (stale `getBoundingClientRect`, `visualViewport` listeners, `renderTick` re-renders, timing delays) all failed because iOS Safari's viewport reshaping during keyboard animation makes `getBoundingClientRect()` return coordinates that are unreliable for `position: fixed` elements portaled outside the modal.
    * **Fix:** Removed React Portal entirely. The dropdown is now rendered **inline** in the normal document flow below the input (inside the `containerRef` wrapper). Eliminated all coordinate state (`coords`), event listeners (`scroll`, `resize`, `visualViewport`), `useLayoutEffect`, `renderTick`, and `scheduleRerender`. The dropdown uses `mt-2 max-h-[200px] overflow-y-auto relative z-[50]` and auto-scrolls into view via `scrollIntoView({ block: 'nearest' })` when suggestions appear. The modal's `overflow-y-auto` content area handles scrolling naturally.
    * **Standard:** See updated "Inline Dropdowns in Modals" rule in Section 6b.

* **2026-03-16: RTL Autocomplete Dropdown Clipping Fix**
    * **Issue:** Autocomplete dropdown was clipped on the right side of the screen on mobile in RTL mode.
    * **Fix:** Refactored `FoodTypeahead` to use `fixed` positioning with responsive alignment (centered on mobile, anchored to right edge on desktop) and `max-w-[95vw]` viewport constraint.
    * **Standard:** See \"RTL-Aware Dropdowns\" in Section 6b.

* **2026-03-16: iOS Viewport Jump & Input Truncation Fix (Pass 1)**
    * **Issue:** (1) iOS Safari zoomed/glitched the viewport when typing in meal inputs because font-size was below 16px (`text-sm`). (2) Single-line `<input>` truncated long autocomplete selections, forcing horizontal scrolling.
    * **Fix (Partial):** Changed `Input` component base class from `text-sm` to `text-base` (16px). Refactored `FoodTypeahead` to support `multiLine` prop rendering a `<textarea>` with `whitespace-pre-wrap break-words`. Updated `ModalShell` to use `dvh` units and `overscroll-contain` for iOS keyboard resilience.     

* **2026-03-16: iOS Keyboard Viewport Glitch ׳’ג‚¬ג€ Root Cause Resolution (Pass 2)**
    * **Issue:** Viewport still wildly shifted/jumped when the iOS virtual keyboard appeared despite the `text-base` fix. Five distinct root causes identified:
    * **Root Cause 1 (PRIMARY):** `ModalShell`'s `SafeLayoutMotion` had a `layout` prop. When the keyboard changed `dvh`, Framer Motion's FLIP algorithm detected a bounding box change and triggered a layout animation on the modal container ׳’ג‚¬ג€ causing visible jumping/shifting.
    * **Root Cause 2:** `text-base` resolves to `1rem`, not guaranteed `16px`. Parent font-size overrides could make it compute to <16px.
    * **Root Cause 3:** `EditFavoriteModal` textarea used `text-[15px]` ׳’ג‚¬ג€ 1px below the 16px iOS threshold.
    * **Root Cause 4:** `Select` component still used `text-sm` (14px), triggering zoom on unit dropdowns.
    * **Root Cause 5:** Missing `interactive-widget=resizes-content` in viewport meta ׳’ג‚¬ג€ Safari shifted the visual viewport instead of resizing layout.
    * **Fix:**
        1. Removed `layout` prop from `ModalShell`'s `SafeLayoutMotion`.
        2. Hardcoded `text-[16px]` (arbitrary Tailwind value) on `Input`, `Select`, `FoodTypeahead` textarea, `EditFavoriteModal` textarea, and all `MealLogModal` inline inputs.
        3. Added `interactive-widget=resizes-content` to the viewport meta tag in `index.html`.
        4. Added `scrollIntoView({ behavior: 'smooth', block: 'center' })` on focus with 350ms delay in `FoodTypeahead` to stabilize input position after keyboard expansion.
    * **Standard:** See "Mobile UX Input Standards" (Section 6b).

* **2026-03-16: iOS Autocomplete Selection Viewport Jump (Pass 3)**
    * **Issue:** Viewport still jumped when selecting an autocomplete suggestion from the portal dropdown ׳’ג‚¬ג€ but NOT when typing. Isolated to the selection interaction.
    * **Root Cause:** Two-part failure: (1) The `<ul>` dropdown used `onMouseDown` with `preventDefault` to prevent input blur ׳’ג‚¬ג€ but on iOS, blur happens during `touchstart`, BEFORE the synthetic `mousedown` fires. So blur prevention never applied on touch devices. (2) After selection, `setTimeout(() => inputRef.current?.focus(), 0)` re-focused the input, triggering a keyboard dismiss׳’ג€ ג€™reappear cycle (two competing viewport shifts).
    * **Fix:** (1) Changed `onMouseDown` to `onPointerDown` on the dropdown `<ul>` ׳’ג‚¬ג€ `pointerdown` fires before blur on all platforms including iOS touch. (2) Removed the `setTimeout(() => focus(), 0)` from `selectSuggestion` ׳’ג‚¬ג€ on desktop blur is already prevented so it's redundant; on iOS it caused the jump.    
    * **Standard:** See "Portal Dropdown Blur Prevention" rule in Section 6b.

* **2026-03-17: Autocomplete Dropdown RTL Clipping ג€” Root Cause Resolution**
    * **Issue:** Autocomplete dropdown was severely squished and clipped on the RIGHT side on iOS Safari in RTL mode, making suggestions unreadable.
    * **Root Cause:** Three interacting failures in `FoodTypeahead.tsx` dropdown positioning: (1) `right` CSS property is RTL-sensitive ג€” Safari treated it as a logical property in the RTL document context, miscalculating the anchor point. (2) `transform: translateX(-50%)` created a new stacking/compositing context that interfered with `position: fixed` inside iOS Safari scroll containers. (3) `window.innerWidth < 640` branching was non-reactive (evaluated once at render time), breaking on device rotation and viewport changes.
    * **Fix:** Replaced the entire dual-branch positioning system with **physical-coordinate anchoring**: compute `left` and `width` exclusively from `getBoundingClientRect()` values, right-align with input via `idealLeft = rect.left + rect.width - dropdownWidth`, clamp to viewport edges with 8px padding. Added explicit `dir="rtl"` on the portaled `<ul>`. Zero use of `right`, `transform`, or viewport-width conditionals.
    * **Standard:** See updated "RTL-Aware Dropdowns" rule in Section 6b.

* **2026-03-17: Modal Centering Fix**
    * **Issue:** MealLogModal opened as a bottom-sheet on mobile (`items-end`, `mt-auto`, `rounded-t-[3rem]`), not centered.
    * **Fix:** Refactored `ModalShell` to use `items-center` on all screen sizes, removed bottom-sheet classes (`mt-auto`, `rounded-b-none`, `pb-safe`), changed animation from slide-up (`y: "100%"`) to centered scale (`scale: 0.93ג†’1`), unified `max-h-[85dvh]` for all breakpoints. Removed mobile drag indicator handle.
    * **Standard:** See "Centered Modal Positioning" and "Dropdown Portals in Modals" rules in Section 6b.

* **2026-03-16: Autocomplete Dropdown Width Truncation Fix**
    * **Issue:** In Manual Entry mode, the autocomplete suggestion dropdown was clipped on the left side, truncating long Hebrew food strings.
    * **Fix:** Set `minWidth` to input width with a floor of 280px, `maxWidth` to `calc(100vw - 2rem)`, and replaced `truncate` class on suggestion items with `whitespace-normal break-words` so long Hebrew text wraps instead of being clipped.
    * **Standard:** Autocomplete/popover dropdowns must never truncate content. Use `whitespace-normal` and responsive min/max width constraints to ensure full legibility on mobile.

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
    * **Fix:** Refactored
fetchUserData to support isSilent parameter. Updated AuthProvider to use silent fetching for TOKEN_REFRESHED events. Refined
fetchUserData to be silent by default if profile data already exists.
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

## 10. Gemini Prompt & 24 Micronutrient Schema (Updated March 2026)

* **System Instruction:**
    * `gemini.ts` sends an explicit system prompt listing all 24 micronutrient keys by name and their expected units.
    * The prompt demands USDA/clinical-grade accuracy and instructs Gemini to return 0 for absent nutrients (never omit a key).
* **Schema & Validation:**
    * `mealResponseSchema` (Google Generative AI Schema) and `mealResponseParser` (Zod) both require all 26 fields in `micronutrients` (fiber, sodium + 24 clinical micronutrients).
    * New keys: `iodine`, `zinc`, `folicAcid`, `vitaminK`, `selenium`, `vitaminB6`, `vitaminB3`, `vitaminB1`, `vitaminB2`, `vitaminB5`, `biotin`, `copper`, `manganese`, `chromium`, `omega3`.
* **RDA Targets:**
    * All 15 new micronutrient RDA functions are in `nutrition-utils.ts`, age/gender-stratified per NIH DRI tables.
    * `calculateMicros()` returns all 26 fields (fiber + sodium + 24 micros).

## 11. 3-Tier Micronutrient Hierarchy (Updated March 2026)

* **Tier 1 (Default ׳’ג‚¬ג€ always visible):** Vitamin D, B12, Iron, Magnesium, Iodine.
* **Tier 2 (Expand ׳’ג‚¬ג€ "׳³ג€׳³ֲ¨׳³ג€”׳³ג€˜" button):** Zinc, Vitamin C, Vitamin A, Folic Acid, Calcium, Omega 3 (EPA+DHA).
* **Tier 3 (More ׳’ג‚¬ג€ "׳³ֲ¢׳³ֲ¨׳³ג€÷׳³ג„¢׳³ ׳³ֲ ׳³ג€¢׳³ֲ¡׳³ג‚×׳³ג„¢׳³" button):** Potassium, Vitamin K, Vitamin E, Selenium, B6, B3, B1, B2, B5, Biotin, Copper, Manganese, Chromium.
* **Implementation:** `NutrientGrid.tsx` uses `useState` for tier expansion and `framer-motion` `AnimatePresence` + staggered variants for smooth entry. A "׳³ֲ¦׳³׳³ֲ¦׳³" collapse button appears when expanded.
* **Rule:** Fiber is displayed in Tier 1 (always visible) as a clinically significant dietary nutrient. Sodium is tracked internally but NOT displayed in the micronutrient grid (infrastructure nutrient managed via safety alerts).

## 12. Accessibility & Typography Standard (Updated March 2026)

* **Minimum Font Size:** All label/secondary text must be ׳’ג€°ֲ¥ 13px (`text-[13px]`). No `text-xs` (12px) or below in data-bearing UI.
* **Contrast Boost:** All secondary labels upgraded from `text-slate-400` to `text-slate-500` or `text-slate-600` for high contrast against Glassmorphism backgrounds.
* **Scope:** Applies to NutrientCard, CompactNutrientCard, PrimaryNutrientCard, MealTimeline, DateNavigator, ProfileScreen, HistoryArchive, MealLogModal, OnboardingFlow, ByokModal.

## 13. Clinical Constants (RDA Targets - March 2026)
The following 15 micronutrient RDA values are strictly enforced based on clinical truth tables for adults (>13y):
- **Iodine (׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½):** 150mcg (Male/Female)
- **Zinc (׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½):** 11mg (Male) | 8mg (Female)
- **Folic Acid (׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½ ׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½):** 400mcg (Male/Female)
- **Vitamin K:** 120mcg (Male) | 90mcg (Female)
- **Selenium (׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½):** 55mcg (Male/Female)
- **Vitamin B6:** 1.3mg (Male/Female)
- **Vitamin B3 (Niacin):** 16mg (Male) | 14mg (Female)
- **Vitamin B1 (Thiamine):** 1.2mg (Male) | 1.1mg (Female)
- **Vitamin B2 (Riboflavin):** 1.3mg (Male) | 1.1mg (Female)
- **Vitamin B5:** 5mg (Male/Female)
- **Biotin (B7):** 30mcg (Male/Female)
- **Copper (׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½):** 900mcg (0.9mg) (Male/Female)
- **Manganese (׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½):** 2.3mg (Male) | 1.8mg (Female)
- **Chromium (׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½׳ֲ¿ֲ½):** 35mcg (Male) | 25mcg (Female)
- **Omega 3 (EPA+DHA):** 250mg (Male/Female)

## 14. Dynamic AI Templates & Zero-Cost Architecture (Updated)

* **Paradigm: "Zero-Cost Favorites & Timeline Memory":**
    * Executing an unmodified Favorite bypasses the AI completely, cloning cached values.
    * If a favorite's text is tweaked before logging, the user is explicitly prompted to either save the edit as a one-time log or update the Favorite template permanently.
    * All logged meals now retain their originating `mealText` to support timeline editing and recalculation.
    * **Creating a Favorite** (`createFavoriteTemplate`) saves the name + text to the store/Supabase.

## 15. Smart Autocomplete Architecture (Updated March 2026)
* **Food Database:** The project contains a local static database of 1000 common Israeli food items (src/utils/food-suggestions.ts) to enable rapid offline-first autocompletion without network roundtrips.        
* **Search Priority:** The Typeahead component (FoodTypeahead.tsx) prioritizes historical user meals (dailyLogs) before searching the static 1000-item database, ensuring personal favorites bubble to the top.     
* **UI/UX:** The suggestion dropdown utilizes
ramer-motion for smooth entry/exit, adheres to Glassmorphism principles g-white/80 backdrop-blur-xl), uses ms-2 and       ext-right for RTL correctness, and features a minimum font size of 14px (       ext-sm) for accessibility.
* **Stability:** The dropdown is rendered within the normal layout but utilizes bsolute z-[100] to avoid clipping, complying with absolute overlays without triggering viewport shifts on iOS.

## 16. Advanced Typeahead & Localized Food Database (Finalized March 2026)
* **Database Scale:** The system now utilizes a strictly unique, number-free, 10,000-item localized Hebrew food database (src/utils/food-suggestions.ts). It covers raw produce, brands (Tnuva, Strauss, Osem), home cooking, and street food.
* **Architecture (Portal-Based):** Suggestions are rendered via React Portal to the document body with z-[9999]. This bypasses modal clipping and layout constraints, essential for mobile reliability.
* **Positioning:** The suggestion list ALWAYS opens downwards (Google-style). It uses absolute positioning relative to the document scroll to remain 'glued' to the input even when the mobile keyboard shifts the viewport.
* **Multi-Select (Smart Tab):** In the 'Smart' meal logging tab, the typeahead supports comma-separated entries. It detects the current segment (after the last comma) to provide suggestions without overwriting previous text.
* **Mobile Optimization:** Uses `onClick` for item selection (fires only on tap, not on scroll-drag) and `onMouseDown` with `preventDefault` on the `<ul>` container to prevent input blur on desktop. The list enforces `touch-pan-y` so the browser handles vertical scroll gestures natively, `overscroll-contain` to isolate scroll, `select-none` on items to prevent text selection during drag, and `max-h-[40vh]` to prevent off-screen clipping when the virtual keyboard is open. Implements `-webkit-overflow-scrolling: touch` for smooth inertial scrolling.
* **Search Heuristics:** Prioritizes 'Starts-with' matches over 'Contains' matches and user history over the static database.
* **Data Integrity & Realism:** Food database items must always include specific fat percentages, preparation methods, and sugar content identifiers.
* **Grammar & Brand Logic:** All Hebrew items MUST maintain perfect gender matching (e.g., ׳³ֲ¢׳³ג€™׳³ג€˜׳³ֲ ׳³ג„¢׳³ג€ ׳³ֻ׳³ֲ¨׳³ג„¢׳³ג€). Brands must only be used where they realistically offer unique nutritional profiles (no "Alpro Cottage"). Avoid programmatic Cartesian products; curate items for clinical realism.

## 17. Contextual AI Insights (Smart Insight Generator ׳’ג‚¬ג€ March 2026)

* **Architecture:**
    * `generateNutritionalInsight(timeframe, nutritionData, userProfile)` in `gemini.ts` sends aggregated nutrition percentages to Gemini with a dedicated Hebrew clinical nutritionist system prompt.
    * Uses `gemini-3.1-flash-lite-preview` with the established 429׳’ג€ ג€™`gemini-2.5-flash` fallback mechanism.     
    * The system prompt enforces: Hebrew language, warm/professional tone, bullet-point format, "׳³ֲ ׳³ֲ§׳³ג€¢׳³ג€׳³ג€¢׳³ֳ— ׳³׳³ֲ©׳³ג„¢׳³׳³ג€¢׳³ֲ¨" (strengths) + "׳³ֲ ׳³ֲ§׳³ג€¢׳³ג€׳³ג€¢׳³ֳ— ׳³׳³ֲ©׳³ג„¢׳³ג‚×׳³ג€¢׳³ֲ¨" (improvements with 2-3 specific Israeli food suggestions).

* **State Management (Zustand):**
    * `aiInsights: Record<string, { insight: string; followUpQuestion?: string; followUpAnswer?: string }>` stores structured insight data per period.
    * Keys are period identifiers (e.g., `insight_day_2026-03-16`, `insight_week_2026-03-10`, `insight_month_2026-03`).
    * Actions: `saveInsight(key, text)` creates/overwrites with a fresh `{ insight }` object (clears any previous follow-up). `saveInsightFollowUp(key, question, answer)` appends follow-up Q&A to an existing record. `clearInsight(key)` removes the entire entry.
    * Persisted via the existing Zustand `persist` middleware alongside other user data.

* **UI Components:**
    * `SmartInsightGenerator.tsx`: Renders contextual button ׳’ג‚¬ג€ "׳³ג€׳³׳³׳³ֲ¦׳³ג€ ׳³׳³ג„¢׳³ֲ©׳³ג„¢׳³ֳ— ׳³ֲ¢׳³ AI ׳’ֲ¨" (no existing insight) or "׳³ג€׳³ֲ¦׳³ג€™ ׳³ג€׳³׳³׳³ֲ¦׳³ג€ ׳³׳³ג€”׳³ֲ¨׳³ג€¢׳³ֲ ׳³ג€" + refresh icon (existing insight). Shimmer loading state during generation.
    * `InsightModal.tsx`: Portal-based Glassmorphism modal (z-[100]) with two sections:
        1. Main insight display with `stripMarkdown()` safety.
        2. Single-turn follow-up Q&A: input field ("׳³ג„¢׳³ֲ© ׳³׳³ ׳³ֲ©׳³׳³׳³ג€ ׳³ֲ¢׳³ ׳³ג€׳³ג€׳³׳³׳³ֲ¦׳³ג€?") + Send button when no follow-up exists; user-question bubble (violet) + AI-answer bubble (white glass) when answered. Loading state (Loader2 spinner) during fetch.
    * Follow-up is powered by `answerInsightFollowUp()` in `gemini.ts` ׳’ג‚¬ג€ a separate Gemini call with its own concise system prompt.
    * Regenerating the insight (refresh button) resets the follow-up Q&A, allowing a fresh question.      

* **Integration:**
    * **Time-Awareness:** Daily insights (	imeframe === 'day') inject the current Israel time into the prompt so the AI accurately judges caloric/nutrient progress relative to the time of day.
    * Placed in `HomeScreen.tsx` between the micronutrient accordion and the meals/period-breakdown card, visible across all period modes (daily/weekly/monthly).
    * Calculates percentage-based nutrition data (current vs. targets for calories, macros, and all 24 micronutrients) before sending to Gemini.

* **Rules:**
    * Insight keys must be deterministic per viewed period so re-generating overwrites the previous insight for that exact period.
    * The modal must use React Portal to `document.body` with `z-[100]` per the Absolute Overlays standard.
    * The Insight system prompt MUST receive the full user profile including `goalDeficit`. If `goalDeficit > 0`, Gemini must treat the user as targeting weight loss and never congratulate exceeding calorie targets.
    * Both the insight and follow-up system prompts instruct Gemini to use emojis natively (׳ ג€™ֳ—, ׳ ֲ¥ג€˜, ׳ ג€ֲ¥, ׳’ֲ¨) for a vibrant tone, while strictly forbidding markdown formatting (`**`, `*`, `#`, backticks). `InsightModal` applies a `stripMarkdown()` safety parser on both insight and follow-up answer text.
    * Fiber (׳³ֲ¡׳³ג„¢׳³ג€˜׳³ג„¢׳³ ׳³ֳ—׳³ג€“׳³ג€¢׳³ֲ ׳³ֳ—׳³ג„¢׳³ג„¢׳³) is a first-class tracked nutrient with its own RDA (38g M / 25g F), displayed in Tier 1, and included in the AI insight analysis.
    * The follow-up feature is strictly single-turn: one question per insight. Regenerating the insight clears the previous follow-up and re-enables the input.

## 18. API Cost Protection ׳’ג‚¬ג€ Gemini Confirmation Gates (March 2026)

* **Rule:** ALL user actions that trigger a Gemini API call MUST be preceded by a `window.confirm('׳³ג€׳³׳³ ׳³׳³ֳ—׳³׳” ׳³ג€˜׳³ֻ׳³ג€¢׳³ג€”?')` confirmation dialog. If the user declines, the action is silently aborted.
* **Covered Actions:**
    1. Submitting a manual text meal log (AI "׳³ג€”׳³ג€÷׳³" tab and Manual tab in `MealLogModal`).
    2. Submitting an image for analysis (camera capture in `MealLogModal`, and confirming the image review text).
    3. Clicking "׳³ג€׳³ג€¢׳³ֲ¡׳³ֲ£ ׳³׳³ג€׳³ג„¢׳³ג€¢׳³" on a Favorite template (in `MealLogModal` saved tab).
    4. Clicking "׳³ג€”׳³ֲ©׳³ג€˜ ׳³ג€¢׳³ג€׳³ג€¢׳³ֲ¡׳³ֲ£ ׳³׳³ג€׳³ג„¢׳³ג€¢׳³ (׳³ג€”׳³ג€-׳³ג‚×׳³ֲ¢׳³׳³ג„¢)" in `EditFavoriteModal`.
    5. Generating or refreshing an AI Insight ("׳³ג€׳³׳³׳³ֲ¦׳³ג€ ׳³׳³ג„¢׳³ֲ©׳³ג„¢׳³ֳ— ׳³ֲ¢׳³ AI" in `SmartInsightGenerator`).   
* **Implementation:** Native `window.confirm()` is used for zero-dependency simplicity. No explanatory text beyond "׳³ג€׳³׳³ ׳³׳³ֳ—׳³׳” ׳³ג€˜׳³ֻ׳³ג€¢׳³ג€”?" ׳’ג‚¬ג€ the dialog must be minimal.
* **Standard:** Any future feature that introduces a new Gemini API call MUST include this confirmation gate. No exceptions.

## 19. Multimodal Vision-to-Text Meal Logging (March 2026)

* **Pipeline Overview:**
    * Users can photograph meals via a camera button in the AI (Smart) tab of `MealLogModal`.
    * Images are converted to Base64 via `fileToBase64()` in `gemini.ts` (using `FileReader.readAsDataURL`, stripping the data URL prefix).
    * The Base64 image + MIME type are sent to `analyzeMealImage()` which calls Gemini's multimodal API (`gemini-3.1-flash-lite-preview` with `gemini-2.5-flash` fallback on 429) with an `inlineData` part and a strict Hebrew-only prompt.
    * Gemini returns a raw comma-separated Hebrew string describing identified foods with estimated quantities.
    * The user reviews and edits this string in an intermediary `ImageReviewPhase` (editable textarea) within the modal.
    * On confirmation ("׳³ג€׳³׳³ֲ©׳³ ׳³׳³ג€”׳³ג„¢׳³ֲ©׳³ג€¢׳³ג€˜"), the text is fed into the existing `parseMealDescription()` text-calculation pipeline ׳’ג‚¬ג€ identical to manual text entry.

* **Architecture:**
    * `gemini.ts`: Exports `fileToBase64(file: File) => Promise<string>` and `analyzeMealImage(base64Image, mimeType) => Promise<string>`.
    * `MealLogModal.tsx`: Two hidden file inputs ג€” (1) Camera: `<input type="file" accept="image/*" capture="environment" />` and (2) Gallery: `<input type="file" accept="image/*" />` (NO `capture` attribute). Both are triggered by adjacent circular Glassmorphism icon buttons (Camera icon + Image icon). Both share the same `isAnalyzingImage` loading state and `handleImageCapture` processing pipeline. Three visual states: normal form, `isAnalyzingImage` shimmer, and `imageReviewText` edit phase.
    * The vision prompt is intentionally separate from `SYSTEM_INSTRUCTION` ׳’ג‚¬ג€ it produces raw Hebrew text, not structured JSON.

* **Error Handling:**
    * API key errors (`API_KEY_INVALID`, `MISSING_API_KEY`) trigger the BYOK modal, consistent with the text flow.
    * 429 quota errors fall back to `gemini-2.5-flash` per the standard fallback mechanism.

* **Rule:** The Vision pipeline MUST remain a two-step process: (1) image ׳’ג€ ג€™ raw text, (2) raw text ׳’ג€ ג€™ structured JSON via `parseMealDescription`. Never bypass the user review step or send images directly to the structured JSON endpoint.

## 20. UX & Routing
* **Auto-Navigation & Feedback:** Upon successfully logging any meal, the app MUST automatically navigate the user back to the Home tab and smoothly scroll to the top to provide immediate visual feedback on their daily progress.

## 21. AI Architecture ג€” Optimistic Execution with Fallback (Updated March 2026)

* **Global Thinking Config:**
    * `GLOBAL_THINKING_CONFIG = { thinkingConfig: { thinkingLevel: "high" } }` is applied to ALL models (both PRIMARY and FALLBACK).
* **Model Routing (Simplified):**
    * `PRIMARY_MODEL` = `gemini-3-flash-preview` ג€” Optimistic first attempt for meal parsing and vision.
    * `FALLBACK_MODEL` = `gemini-3.1-flash-lite-preview` ג€” Automatic fallback on ANY primary error, and exclusive model for Insights.
    * **Database quota counting is REMOVED.** No `getDailyAiUsageCount`, `incrementDailyAiUsage`, or `DAILY_AI_LIMIT`.
* **Meal Pipelines (Optimistic ג€” `parseMealDescription`, `analyzeMealImage`):**
    1. ALWAYS attempt `PRIMARY_MODEL` first with `GLOBAL_THINKING_CONFIG`.
    2. If ANY error occurs (429, 500, timeout, etc.), log a warning and IMMEDIATELY execute with `FALLBACK_MODEL` (also with `GLOBAL_THINKING_CONFIG`).
    3. Auth errors (`API_KEY_INVALID`, `MISSING_API_KEY`) are re-thrown immediately without fallback.
* **Insight Pipelines (Exclusive FALLBACK ג€” `generateNutritionalInsight`, `answerInsightFollowUp`):**
    * Hardcoded to ONLY use `FALLBACK_MODEL` with `GLOBAL_THINKING_CONFIG`.
    * No primary/fallback routing for insights.
* **Thinking Response Handling:** `analyzeMealImage()` explicitly parses response candidates to extract only the final `.text` answer, skipping any `thought`-flagged parts that the thinking model may return. Other pipelines use `result.response.text()` which auto-extracts the final answer.
* **Dual Camera/Gallery Input:** `MealLogModal.tsx` provides two adjacent circular Glassmorphism icon buttons:
    1. **Camera** (Lucide `Camera` icon): Triggers `<input capture="environment">` ג€” opens device camera directly.
    2. **Gallery** (Lucide `Image` icon): Triggers `<input>` WITHOUT `capture` ג€” opens the photo picker/gallery.
    * Both inputs share the same `handleImageCapture` handler and `isAnalyzingImage` loading state.
* **Rule:** Any future meal-logging AI pipeline MUST use the optimistic primaryג†’fallback pattern. Any future insight/analytics AI pipeline MUST use `FALLBACK_MODEL` exclusively. All AI pipelines require the API Cost Protection confirmation gate (Section 18).

## 22. Clinical 3-Tier Nutrient Progress Color Logic (March 2026)

* **Architecture:** `getNutrientProgressColor(nutrientKey, value, target)` in `nutrition-utils.ts` returns a `NutrientColorTier` (`'blue' | 'green' | 'red'`). `getProgressAppearance()` in `progress-tone.ts` accepts an optional `nutrientKey` parameter and delegates to this helper.
* **3-Tier Rules:**
    * **ג‰₪100% of target ג†’ Blue** (default in-progress state for all nutrients).
    * **>100% ג€” Strict Limit Nutrients** (`calories`, `carbs`, `fat`, `sodium`) **ג†’ Red** immediately. These nutrients have negative health effects when exceeded.
    * **>100% ג€” UL-Tracked Nutrients** (`iron`, `calcium`, `vitaminA`, `zinc`, `vitaminD`, `selenium`, `iodine`, `copper`, `vitaminE`, `vitaminK`) **ג†’ Green** (safe excess) UNLESS the percentage exceeds their clinical Tolerable Upper Intake Level (UL) threshold (e.g., iron >250%, vitaminD >500%) **ג†’ Red** (toxicity risk).
    * **>100% ג€” Goal Nutrients** (`protein`, `fiber`, `vitaminC`, `magnesium`, `potassium`, `vitaminB12`, `folicAcid`, `omega3`, all other B vitamins, `manganese`, `chromium`) **ג†’ Green**. These are "more is generally better from food" nutrients with no strict UL concern from dietary sources.
* **UL Thresholds (as % of RDA):** `iron: 250`, `calcium: 250`, `vitaminA: 300`, `zinc: 350`, `vitaminD: 500`, `selenium: 700`, `iodine: 700`, `copper: 1000`, `vitaminE: 1000`, `vitaminK: 1000`.
* **Clinical Rationale:** Fat-soluble vitamins and heavy minerals should NOT turn red upon slightly exceeding 100% ג€” moderate excess is normal and healthy. Only clinical UL breach warrants a warning.
* **Rule:** Any new nutrient added to the tracker must be classified into one of the three tiers. Default to "goal nutrient" (green) unless clinical evidence supports a strict limit or UL threshold.

## 23. Premium UX & Animation Standards (March 2026)

* **Spring-First Motion:** All transitions MUST use `type: "spring"` with physics-based values (e.g., `stiffness: 400, damping: 25`) for a natural "iOS-like" feel. Strictly avoid `linear`/`ease` durations unless for simple fades or infinite rotations (spinners).
* **Interactive Haptics:** Every clickable element (Buttons, Cards, Tabs) MUST implement `whileTap={{ scale: 0.96, transition: { type: "spring", stiffness: 400, damping: 17 } }}` to provide tactile visual feedback. Primary action buttons use `whileHover={{ scale: 1.01 }}` for a "magnetic" hover feel.
* **Staggered Orchestration:** List items and grid elements must never pop in at once; always use `staggerChildren` on the parent variant and a spring-based Y-offset (`y: 20` -> `0`) on children. Recommended stagger interval: `0.05s`.
* **Shared Layout Tabs:** Tab indicators use Framer Motion `layoutId` or animated transforms to smoothly slide between active tabs, providing a premium "shared layout" effect.
* **Smart Number Animation:** Nutrient values that change dynamically use `AnimatePresence` with key-based vertical pop transitions (`y: 8` -> `0` on enter, `y: -8` on exit) to avoid number snapping.
* **Layout Continuity:** Always use the `layout` prop on containers that change size (like expanding cards or accordion sections) to prevent layout shifts and ensure the rest of the UI flows smoothly into place. Exception: Never use `layout`/`layoutId` on modal containers (see Section 6b).
* **Glass Shimmer Loading:** All loading/processing states use the `.glass-shimmer` CSS class for a premium gradient sweep animation during AI processing.
* **Zero-Jank Policy:** Animations must strictly use GPU-accelerated properties (`transform`, `opacity`) to maintain 60-120fps on all devices. Never animate `width`, `height`, `top`, or `left` directly — use `scale`, `translate`, and Framer Motion's `height: "auto"` pattern instead.

## 24. Retroactive Logging & 60-Day Retention Boundary (March 2026)

* **Meal Logging Date Source:** `MealLogModal.tsx` owns a dedicated `targetDate` state for retroactive logging. ALL submit paths (AI text, manual entry, image review confirmation, zero-cost favorite logging) MUST write to this selected date. Never call `getLogicalDayKey()` at submit time inside a handler if the modal already exposes a user-selected logging date.
* **Date Picker Window:** The modal's native `<input type="date" />` must stay bounded to the active retention window: max = current logical day, min = 60 logical days back. If the calendar/dashboard opens the modal on an out-of-window day, clamp the modal's `targetDate` back into the valid range before submit.
* **Retention Cleanup Scope (CRITICAL):** `cleanupOldLogs(logs)` in `src/store/index.ts` is allowed to inspect ONLY the `dailyLogs` record it receives. Iterate over `Object.keys(logs)` and each day's own `meals` only. The function MUST NOT read, derive from, or mutate `savedMeals`.
* **Favorite Preservation Boundary:** Retention cleanup removes a day only when `(current logical day - log day) > 60 days` AND that day's logged meals contain no `meal.isFavorite === true` marker. Favorite templates in `savedMeals` are always preserved forever; cleanup must never delete or rewrite them.
* **Favorite-to-Log Contract:** When cloning a saved favorite into `dailyLogs` (`addSavedMealToDay` / direct-add from favorites), the logged `MealItem` MUST be stamped with `isFavorite: true` so retention can preserve that historical log without consulting `savedMeals`.
* **Retroactive Logging Default:** Opening `MealLogModal` should reset `targetDate` to the current logical day by default, not inherit a previously browsed historical dashboard day. Retroactive logging is an explicit user action via the date control.
* **Date Picker Presentation:** The logging date control must stay visually lightweight: use a compact inline chip/pill above the tabs, with the native date input overlaid invisibly for picker behavior. Do NOT render a large standalone date card above the modal content.

