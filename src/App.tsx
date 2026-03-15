import { AnimatePresence, motion } from "framer-motion";
import { Dashboard } from "./features/dashboard/Dashboard";
import { OnboardingFlow } from "./features/onboarding/OnboardingFlow";
import { AuthScreen } from "./features/auth/AuthScreen";
import { AuthCallback } from "./features/auth/AuthCallback";
import { useAuth } from "./components/AuthProvider";
import { useAppStore } from "./store";

function App() {
  const { user, loading: authLoading } = useAuth();
  const profile = useAppStore(state => state.profile);
  const isLoadingData = useAppStore(state => state.isLoadingData);
  const isCallback = window.location.pathname === "/auth/callback";

  if (isCallback) {
    return <AuthCallback />;
  }

  if (authLoading || (user && isLoadingData)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 relative overflow-hidden" dir="rtl">
        {/* Sophisticated background for loading */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-200/30 blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/30 blur-[120px]" 
          />
        </div>

        <div className="relative flex flex-col items-center gap-12">
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
