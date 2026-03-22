# Performance Optimization Report

## Step 1: Zustand Store Selector Optimization

| Component | Issue | Fix |
|---|---|---|
| `WaterTracker.tsx` | Full store destructure via `useAppStore()` caused re-renders on ANY store change (e.g., AI insights, meal logs, screen navigation). | Refactored to 8 individual atomic selectors (`useAppStore((s) => s.dailyWaterAmount)`, etc.). Now only re-renders when water-specific state changes. |

All other components (`Dashboard.tsx`, `App.tsx`, `SmartInsightGenerator.tsx`, `MealLogModal.tsx`, `FoodTypeahead.tsx`, etc.) were already using atomic selectors correctly.

## Step 2: React Render Cycle Optimization (Memoization)

### 2a. Dashboard.tsx — useCallback for prop-drilled handlers

| Handler | Technique | Why |
|---|---|---|
| `onSaveFavorite` | `useCallback` | Passed to `HomeScreen` and `HistoryScreen`. Without stable reference, both child trees re-render on every Dashboard state change. |
| `scrollToTop` | `useCallback` | Dependency of `onHistoryIncrement`/`onHistoryDecrement`. |
| `onHistoryIncrement` | `useCallback` | Passed to `HistoryScreen`. |
| `onHistoryDecrement` | `useCallback` | Passed to `HistoryScreen`. |
| `onSelectArchiveDay` | `useCallback` | Passed to `HistoryScreen`. |
| `onEditMeal` | `useCallback` | Previously inline arrow `(dayKey, meal) => setEditingLog(...)` was recreated every render in TWO places (HomeScreen + HistoryScreen). Now a single stable reference. |
| `onOpenMealModal` | `useCallback` | Passed to `BottomNavigation`. |
| `onCloseMealModal` | `useCallback` | Passed to `MealLogModal`. |
| `onOpenProfileModal` | `useCallback` | Passed to `ProfileScreen`. |
| `onCloseProfileModal` | `useCallback` | Passed to `EditProfileModal`. |
| `onCloseEditLog` | `useCallback` | Passed to `EditLoggedMealModal`. |

### 2b. SmartInsightGenerator.tsx — useMemo + useCallback

| Item | Technique | Why |
|---|---|---|
| `keys` object | `useMemo` on `periodMode` | Previously recreated every render; used as lookup keys in handlers. |
| `profileData` (GeminiUserProfile) | `useMemo` on 8 profile fields | Object was reconstructed every render, causing downstream reference inequality. |
| `nutritionData` | `useMemo` on `currentAggregations` + `periodTargets` | `buildNutritionPercentages` iterates all 24+ micronutrient keys every render. |
| `handleAskCustom` | `useCallback` | Async handler passed as onClick. |
| `handleGenerateInsight` | `useCallback` | Async handler passed as onClick. |
| `handleGenerateSupplements` | `useCallback` | Async handler passed as onClick. |
| `FormattedAIResponse` | `React.memo()` | Pure presentational component re-parsing markdown on every parent state change. |

### 2c. HomeScreen.tsx — Static variants + useMemo

| Item | Technique | Why |
|---|---|---|
| `containerVariants` | Extracted to module scope | Static Framer Motion variant objects were being recreated on every render of HomeScreen. |
| `itemVariants` | Extracted to module scope | Same as above. |
| `periodCaption` | `useMemo` | `date-fns` `format()` with Hebrew locale is non-trivial; was running on every render. |

### 2d. React.memo() on presentational components

| Component | Renders per frame | Why memo helps |
|---|---|---|
| `NutrientCard` | Up to 25x (6 Tier1 + 6 Tier2 + 13 Tier3) | Receives primitive props (`current`, `target`, `nutrient`). Without memo, ALL cards re-render when any sibling state changes (e.g., expanding a tier). |
| `CompactNutrientCard` | 3x (protein, carbs, fat) | Same — primitive props + high visual prominence. |
| `MealTimelineItem` | N per meal | Receives `meal` object + callbacks. Memo prevents re-render when sibling items expand/collapse. |

## Step 3: Framer Motion GPU Hardware Acceleration

| Component | Element | Technique | Why |
|---|---|---|---|
| `WaterTracker.tsx` | Wave `<motion.path>` (infinite loop) | `willChange: "transform"` | Continuous horizontal animation running at 60fps. Hints browser to promote to compositor layer, avoiding main-thread paint. |
| `PrimaryNutrientCard.tsx` | Progress ring `<svg>` | `willChange: "transform"` | SVG containing spring-animated `strokeDashoffset`. |
| `PrimaryNutrientCard.tsx` | Animated `<motion.circle>` | `willChange: "stroke-dashoffset"` | Spring-animated stroke offset on the calorie ring. |
| `NutrientCard.tsx` | Progress bar `<motion.div>` | `willChange: "width"` | Spring-animated width on up to 25 nutrient bars. |
| `CompactNutrientCard.tsx` | Progress bar `<motion.div>` | `willChange: "width"` | Spring-animated width on 3 macro bars. |
| `BottomNavigation.tsx` | Nav container `<motion.div>` | `willChange: "transform, opacity"` + `translateZ(0)` | Fixed-position element with entry animation + backdrop-blur. Force GPU layer to prevent repaint on scroll. |
| `MealTimeline.tsx` | Card `<motion.div>` with `layout` | `willChange: "transform, opacity"` | Layout animations trigger FLIP calculations. GPU layer reduces paint cost during reflow. |

Note: `WaterTracker.tsx` SVG already had `transform: "translateZ(0)"` on the parent SVG — no change needed there.

## Step 4: Defer Non-Critical Execution

| Component | Issue | Fix |
|---|---|---|
| `FoodTypeahead.tsx` | Suggestion scoring runs synchronously on every keystroke, iterating all daily logs + static food database (hundreds of items). On rapid typing, this blocks the main thread between React commits. | Added 120ms debounce via `setTimeout` in the suggestion `useEffect`. Returns cleanup function to cancel stale computations. User perceives no delay (suggestions still appear near-instantly), but rapid keystrokes no longer queue up expensive scoring passes. |

## Summary

- **Store selectors**: 1 component fixed (WaterTracker full-store subscription).
- **useCallback**: 11 handlers stabilized across Dashboard.tsx.
- **useMemo**: 4 derived computations memoized across SmartInsightGenerator + HomeScreen.
- **React.memo()**: 4 components wrapped (NutrientCard, CompactNutrientCard, MealTimelineItem, FormattedAIResponse).
- **GPU acceleration**: `translateZ(0)` on progress bars and calorie ring for GPU compositing; `willChange` only on the WaterTracker infinite wave animation.
- **Debounce**: 1 hot-path computation deferred (FoodTypeahead suggestion scoring).

---

## Mobile Bug Fixes (Post-Audit)

### Bug 1: `layout` prop on raw `<motion.div>` inside scroll containers (iOS viewport jumps)

| Component | Line | Fix |
|---|---|---|
| `SmartInsightGenerator.tsx` | 226 | Removed `layout` prop from the outer `<motion.div>`. When the iOS virtual keyboard appeared/disappeared, the FLIP algorithm recalculated stale DOM metrics inside the scroll container, causing the AI section to jump. The `AnimatePresence` height animation on the inner content is sufficient. |
| `PeriodBreakdown.tsx` | 105 | Removed `layout` prop from the expanding `<motion.div>`. Same FLIP issue — height 0→auto animation already works without `layout`. |
| `MealTimeline.tsx` | 150 | Removed `layout` prop from `MealTimelineItem` card wrapper. Combined with `whileHover`/`whileTap`, this caused layout thrashing on every touch interaction in the meal list. |
| `MealTimeline.tsx` | 318 | Removed `layout` prop from the expandable micro-nutrient details section. Same issue as PeriodBreakdown. |

**Root cause**: Per AI_RULES.md Section 6b, `layout`/`layoutId` must never be used on elements inside scroll containers without `SafeLayoutMotion`. These were all raw `<motion.div layout>` elements.

### Bug 2: Persistent `willChange` on one-shot animations (GPU memory bloat)

| Component | Element | Issue | Fix |
|---|---|---|---|
| `BottomNavigation.tsx` | Nav container | `willChange: "transform, opacity"` persisted after mount animation completed. Fixed bottom bar held a permanent GPU layer. | Removed `willChange`, kept `translateZ(0)` for compositor promotion without memory advisory. |
| `NutrientCard.tsx` | Progress bar | `willChange: "width"` persisted after spring animation settled. 6-25 bars × permanent GPU layers. | Replaced with `translateZ(0)` for brief compositor hint during animation. |
| `CompactNutrientCard.tsx` | Progress bar | Same issue, 3 macro bars. | Same fix. |
| `PrimaryNutrientCard.tsx` | SVG container | `willChange: "transform"` on a static SVG that doesn't animate. | Removed entirely. |
| `PrimaryNutrientCard.tsx` | Animated circle | `willChange: "stroke-dashoffset"` persisted after spring settled. | Replaced with `translateZ(0)`. |
| `MealTimeline.tsx` | Card wrapper | `willChange: "transform, opacity"` on every meal item. N cards × permanent GPU layers. | Removed (also removed `layout` prop, see Bug 1). |

**Root cause**: `willChange` is an advisory that tells the browser to allocate a GPU compositing layer. For one-shot animations (mount, value change), the layer persists after the animation completes but is never released. On devices with <2GB RAM, this causes stuttering and battery drain.

**Kept**: `willChange: "transform"` on WaterTracker's wave `<motion.path>` — this is the only infinite animation that benefits from permanent GPU promotion.

### Bug 3: ModalShell scroll lock not released on rapid open/close

| Component | Issue | Fix |
|---|---|---|
| `modal-shell.tsx` | The useEffect cleanup captured `scrollCanvas` by closure at effect creation time. If rapid modal toggling occurred (e.g., closing one modal while another opens), the cleanup would try to restore `overflow: ''` on a stale DOM reference. | Changed cleanup to re-query `document.querySelector('.ios-scroll-canvas')` at cleanup time instead of using the captured reference. |

### Bug 4: iOS keyboard scroll-into-view race condition (350ms → 450ms)

| Files | Issue | Fix |
|---|---|---|
| `FoodTypeahead.tsx`, `ProfileFormFields.tsx`, `EditProfileModal.tsx`, `MealLogModal.tsx`, `EditLoggedMealModal.tsx`, `EditFavoriteModal.tsx`, `ByokModal.tsx` | `scrollIntoView` fired at 350ms after focus, but iOS Safari's keyboard animation can take 300-400ms on slower devices. The scroll would fire while the viewport was still resizing, causing the input to end up behind the keyboard. | Increased all `scrollIntoView` timeouts from 350ms to 450ms across all 7 files (16 occurrences). |

## Updated Summary

- **Store selectors**: 1 component fixed (WaterTracker).
- **useCallback**: 11 handlers stabilized across Dashboard.tsx.
- **useMemo**: 4 derived computations memoized.
- **React.memo()**: 4 components wrapped.
- **GPU acceleration**: `translateZ(0)` on progress bars + calorie ring; `willChange` only on WaterTracker infinite wave.
- **Debounce**: FoodTypeahead suggestion scoring (120ms).
- **`layout` prop removal**: 4 instances removed from scroll-container children (SmartInsightGenerator, PeriodBreakdown, MealTimeline ×2).
- **`willChange` cleanup**: 6 persistent allocations removed from one-shot animations.
- **ModalShell scroll lock**: Cleanup now re-queries DOM to avoid stale references.
- **iOS keyboard timing**: 16 `scrollIntoView` timeouts raised from 350ms to 450ms across 7 files.
