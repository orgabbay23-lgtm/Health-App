import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "./store";
import { OnboardingFlow } from "./features/onboarding/OnboardingFlow";
import { Dashboard } from "./features/dashboard/Dashboard";

function App() {
  const hasHydrated = useAppStore((state) => state._hasHydrated);
  const userProfile = useAppStore((state) => state.userProfile);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_25%),linear-gradient(180deg,_#f8fbff_0%,_#edf4fb_52%,_#f8fafc_100%)]">
        <motion.div
          initial={{ opacity: 0.3, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 0.8,
          }}
          className="rounded-full border border-white/70 bg-white/90 px-6 py-4 text-base font-semibold text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
        >
          טוען נתונים...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="font-sans text-foreground" dir="rtl">
      <AnimatePresence mode="wait">
        <motion.div
          key={userProfile ? "dashboard" : "onboarding"}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          {userProfile ? <Dashboard /> : <OnboardingFlow />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;
