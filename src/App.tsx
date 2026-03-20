import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dashboard } from "./features/dashboard/Dashboard";
import { OnboardingFlow } from "./features/onboarding/OnboardingFlow";
import { AuthScreen } from "./features/auth/AuthScreen";
import { AuthCallback } from "./features/auth/AuthCallback";
import { PasswordRecoveryScreen } from "./features/auth/PasswordRecoveryScreen";
import { useAuth } from "./components/AuthProvider";
import { useAppStore } from "./store";
import { cn } from "./utils/utils";

function App() {
  const { user, loading: authLoading } = useAuth();
  const profile = useAppStore(state => state.profile);
  const isLoadingData = useAppStore(state => state.isLoadingData);
  const isAppReady = useAppStore(state => state.isAppReady);
  const isRecoveringPassword = useAppStore(state => state.isRecoveringPassword);
  const hasHydrated = useAppStore(state => state._hasHydrated);
  const setAppReady = useAppStore(state => state.setAppReady);
  const isCallback = window.location.pathname === "/auth/callback";

  useEffect(() => {
    // If already ready, do nothing (one-way latch)
    if (isAppReady) return;

    if (!authLoading) {
      if (!user) {
        setAppReady(true);
      } else if (profile || !isLoadingData) {
        // If we have a user, wait for the profile to load or for the initial fetch to complete
        setAppReady(true);
      }
    }
  }, [authLoading, user, profile, isLoadingData, isAppReady, setAppReady]);

  // Get time of day for subtle tint
  const hour = new Date().getHours();
  const getTimeTint = () => {
    if (hour >= 5 && hour < 12) return "bg-orange-50/20"; // Morning
    if (hour >= 12 && hour < 18) return "bg-sky-50/20"; // Afternoon
    return "bg-indigo-950/5"; // Evening
  };

  if (isCallback) {
    return <AuthCallback />;
  }

  // Determine the primary screen to show
  let screen = <AuthScreen />;
  let key = "auth";

  if (isRecoveringPassword) {
    screen = <PasswordRecoveryScreen />;
    key = "recovery";
  } else if (user) {
    if (profile) {
      screen = <Dashboard />;
      key = "dashboard";
    } else {
      screen = <OnboardingFlow />;
      key = "onboarding";
    }
  }

  // Final Gate: Wait for Zustand hydration + app initialization.
  // Gating on _hasHydrated prevents FOUC from localStorage desync.
  if (!hasHydrated || !isAppReady) {
    return (
      <div className="ios-app-shell" dir="rtl">
        <div className="ios-scroll-canvas flex items-center justify-center relative overflow-hidden">
          {/* Animated Mesh Background for Loading */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="blob-animate blob-1" />
            <div className="blob-animate blob-2" />
            <div className="blob-animate blob-3" />
            <div className="blob-animate blob-4" />
          </div>

          <div className="relative flex flex-col items-center gap-12 z-10">
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="h-24 w-24 rounded-[2.5rem] bg-slate-950 flex items-center justify-center shadow-2xl border-[6px] border-white relative z-10"
              >
                 <motion.div
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="h-3 w-3 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                 />
              </motion.div>

              {/* Decorative rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-20px] rounded-[3rem] border border-slate-200/50 border-dashed"
              />
            </div>

            <div className="flex flex-col items-center gap-3">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm font-black text-slate-950 uppercase tracking-[0.3em]"
              >
                הבריאות שלך בטעינה
              </motion.span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-slate-400"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ios-app-shell" dir="rtl">
      <div className={cn("ios-scroll-canvas font-sans text-foreground relative", getTimeTint())}>
        {/* Animated Mesh Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="blob-animate blob-1" />
          <div className="blob-animate blob-2" />
          <div className="blob-animate blob-3" />
          <div className="blob-animate blob-4" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="relative z-10"
          >
            {screen}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
