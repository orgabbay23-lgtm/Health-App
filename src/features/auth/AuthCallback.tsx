import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";

export function AuthCallback() {
  useEffect(() => {
    // Supabase handles the code exchange automatically on getSession/onAuthStateChange
    // but we want to make sure we redirect back to the home page once it's done.
    const handleCallback = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Session established, redirect to home
        window.location.href = window.location.origin;
      } else {
        // No session found, maybe still processing or failed
        // We'll wait a bit and redirect anyway to let the App component handle the state
        setTimeout(() => {
          window.location.href = window.location.origin;
        }, 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
        <h2 className="text-xl font-semibold text-slate-800">מתחבר...</h2>
        <p className="mt-2 text-slate-600">אנא המתן בזמן שאנו מאמתים את החשבון שלך.</p>
      </motion.div>
    </div>
  );
}
