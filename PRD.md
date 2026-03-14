# Product Requirements Document (PRD) Health & Weight Loss AI Tracker (Phase 1 MVP)

## 1. Overview
A React-based web application designed to help users track their nutritional intake and manage weight loss. Phase 1 focuses on a robust, deterministic MVP utilizing local storage, structured data management, and established anthropometric algorithms. Phase 2 (Future) will integrate the Gemini AI API for natural language food logging. 
Crucial Requirement The entire User Interface (UI) must be in Hebrew, with full RTL (Right-to-Left) layout support.

## 2. Tech Stack
 Framework React (via Vite) + TypeScript.
 Styling Tailwind CSS + shadcnui (configured for RTL).
 State Management Zustand (Slice pattern + Persist middleware with hydration boundaries).
 Forms & Validation react-hook-form + Zod.
 Charts Recharts (wrapped by shadcnui).
 Icons Lucide React.

## 3. Core Features & UI Flow (Hebrew Interface)

### 3.1. Onboarding Flow (Multi-step)
 Step 1 Biometrics Age, Gender, Height (cm), Weight (kg).
 Step 2 Activity Level Sedentary, Light, Moderate, Active, Very Active (translated to descriptive Hebrew).
 Step 3 Goals Goal selection (e.g., Weight Loss - 500 kcal deficit).
 Step 4 Output Displays calculated TDEE, Calorie limit, and exact Macro targets (Protein, Fat, Carbs) based on the Mifflin-St Jeor equation.

### 3.2. Dashboard
 Layout CSS Grid, responsive. Sidebar navigation (Home, Calendar, Settings).
 KPI Cards Total Calories, Protein, Carbs, and Fats compared to daily goals.
 Visual Progress Progress barsrings changing color (Green - Yellow - Red) as limits are approached.
 Recent Logs A list of today's logged meals with deleteedit options.

### 3.3. Meal Logging (Phase 1 Mock)
 A modal with a form to log a meal (Meal Name, Calories, Protein, Carbs, Fats, VitaminsMinerals).
 Action Submitting the form simulates an AI API call (async delay) and saves the data in the predefined strict JSON schema (preparing for Phase 2).

## 4. Architectural Rules & Algorithms (Reference Architecture_Research.md)

### 4.1. Nutritional Math
 BMR Use the Mifflin-St Jeor (MSJ) equation.
 TDEE BMR  Activity Multiplier.
 Macros
     Protein 1.8g per kg of body weight (Priority #1).
     Fats 25% of Total Target Calories.
     Carbs Remaining calories allocated to carbs.

### 4.2. Temporal Logic (Timezones)
 Day Rollover The current day shifts at 0300 AM local time, NOT 0000 midnight. 
 Storage Keys Use local ISO 8601 strings (e.g., 2026-03-14) evaluated after applying the 3 AM offset.

### 4.3. Data Storage (Zustand + Local Storage)
 Store Structure Slices pattern (`createUserSlice`, `createNutritionSlice`, `createUISlice`).
 Hydration A strict hydration boundary must be implemented in the root component to prevent UI flickering on initial load.
 Data Shape
     `userProfile` biometrics and computed targets.
     `dailyLogs` Dictionary grouped by `YYYY-MM-DD` keys. Each key contains an array of `meals` and a pre-computed `aggregations` object (totals for that day).
     Read operations for charts should only query `aggregations`, not deeply nested `meals`.