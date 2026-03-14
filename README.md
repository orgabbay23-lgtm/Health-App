# Health & Nutrition AI Tracker

A modern, comprehensive web application designed for weight loss and clinical-grade nutrition tracking. Built with React and Vite, it features Gemini 3.0 Flash AI for natural language meal parsing, clinical-grade nutrition algorithms (Mifflin-St Jeor), and a fully RTL (Hebrew) tailored User Interface.

## 🚀 Tech Stack

- **Framework:** [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **AI Integration:** Google Gemini API (Flash 3.0)

## ✨ Features

- **AI Food Logging:** Use natural language to describe meals (in Hebrew) and leverage Gemini AI to instantly parse calories, macronutrients, and micronutrients.
- **Biometric-Driven Dietary Targets:** Automatically calculate energy and macro goals based on the clinical Mifflin-St Jeor algorithm.
- **Safety Toxicity Alerts (UL):** Monitor daily micronutrient intakes against Tolerable Upper Intake Levels to prevent toxic levels of vitamins/minerals.
- **Advanced Navigation & Views:** Navigate intuitively between Daily, Weekly, and Monthly calendar views.
- **RTL & Localized:** Built specifically for Hebrew speakers with complete RTL UI layout.
- **Saved Favorites:** Easily save and re-log your favorite or frequent meals.

## 📦 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A valid Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd health-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a local environment file by copying the example:
   ```bash
   cp .env.example .env
   ```
   Open the newly created `.env` file and insert your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   
Your application will be live at `http://localhost:5173`. 
