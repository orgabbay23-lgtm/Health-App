import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";

export function AuthCallback() {
  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session) {
        window.location.href = window.location.origin;
        return;
      }

      // FIX: Wait for onAuthStateChange to fire before blind-redirecting.
      // If no session arrives within 5s, redirect to let App handle state.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        if (session) {
          subscription.unsubscribe();
          window.location.href = window.location.origin;
        }
      });

      setTimeout(() => {
        if (!cancelled) {
          subscription.unsubscribe();
          window.location.href = window.location.origin;
        }
      }, 5000);
    };

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ minHeight: "calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))" }}
      dir="rtl"
    >
      {/* Mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="blob-animate blob-1" />
        <div className="blob-animate blob-2" />
        <div className="blob-animate blob-3" />
        <div className="blob-animate blob-4" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center"
      >
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-900 border-t-transparent mx-auto"></div>
        <h2 className="text-xl font-black text-slate-900">מתחבר...</h2>
        <p className="mt-2 text-slate-500 font-medium">אנא המתן בזמן שאנו מאמתים את החשבון שלך.</p>
      </motion.div>
    </div>
  );
}
