import { AnimatePresence, motion } from "framer-motion";
import { Dashboard } from "./features/dashboard/Dashboard";
import { OnboardingFlow } from "./features/onboarding/OnboardingFlow";
import { AuthScreen } from "./features/auth/AuthScreen";
import { useAuth } from "./components/AuthProvider";
import { useAppStore } from "./store";

function App() {
  const { user, loading: authLoading } = useAuth();
  const profile = useAppStore(state => state.profile);
  const isLoadingData = useAppStore(state => state.isLoadingData);

  if (authLoading || (user && isLoadingData)) {
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

  if (user) {
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
