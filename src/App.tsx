import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dashboard } from "./features/dashboard/Dashboard";
import { OnboardingFlow } from "./features/onboarding/OnboardingFlow";
import { AuthScreen } from "./features/auth/AuthScreen";
import { AuthCallback } from "./features/auth/AuthCallback";
import { useAppStore } from "./store";
import { supabase } from "./lib/supabase";

function App() {
  const [appReady, setAppReady] = useState(false);
  const profile = useAppStore(state => state.profile);
  const fetchUserData = useAppStore(state => state.fetchUserData);
  const userId = useAppStore(state => state.userId);
  const isCallback = window.location.pathname === "/auth/callback";

  useEffect(() => {
    async function initApp() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      } catch (error) {
        console.error("App initialization failed", error);
      } finally {
        setAppReady(true);
      }
    }

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (useAppStore.getState().userId !== session.user.id) {
          await fetchUserData(session.user.id);
        }
      } else {
        useAppStore.getState().clearUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  if (isCallback) {
    return <AuthCallback />;
  }

  if (!appReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(250,245,235,0.95),_rgba(255,255,255,0.96)_42%,_rgba(237,246,255,0.95)_80%)]">
        <motion.div
          initial={{ opacity: 0.4, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.9 }}
          className="rounded-full border border-white/70 bg-white/90 px-6 py-4 text-base font-semibold text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
        >
          מתחבר...
        </motion.div>
      </div>
    );
  }

  let screen = <AuthScreen />;
  let key = "auth";

  if (userId) {
    if (profile) {
      screen = <Dashboard />;
      key = "dashboard";
    } else {
      screen = <OnboardingFlow />;
      key = "onboarding";
    }
  }

  return (
    <div className="font-sans text-foreground" dir="rtl">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
        >
          {screen}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;
