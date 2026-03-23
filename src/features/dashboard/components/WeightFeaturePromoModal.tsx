import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Save, Bell, ArrowLeft } from "lucide-react";
import { useAppStore } from "../../../store";

export function WeightFeaturePromoModal() {
  const addWeightLog = useAppStore((state) => state.addWeightLog);
  const weightLogs = useAppStore((state) => state.weightLogs);
  const setActiveScreen = useAppStore((state) => state.setActiveScreen);
  
  const [isOpen, setIsOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const hasSeenPromo = localStorage.getItem("has_seen_weight_promo");
    if (!hasSeenPromo) {
      const timeout = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timeout);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("has_seen_weight_promo", "true");
    setIsOpen(false);
  };

  const handleSave = async () => {
    if (isSaving) return;
    const weight = parseFloat(newWeight);
    if (!isNaN(weight) && weight > 0) {
      setIsSaving(true);
      try {
        await addWeightLog(weight);
        handleClose();
        setActiveScreen("weight");
      } catch (error) {
        setIsSaving(false);
      }
    }
  };

  const handleRemindTomorrow = () => {
    localStorage.setItem("weight_reminder_last", Date.now().toString());
    handleClose();
  };

  const handleUpdateLater = () => {
    localStorage.setItem("weight_reminder_last", Date.now().toString());
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center z-[250] p-5 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md pointer-events-auto"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: 0,
            transition: { type: "spring", damping: 25, stiffness: 350 }
          }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-[360px] relative z-[251] text-right pointer-events-auto overflow-hidden"
          dir="rtl"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full -mr-12 -mt-12 opacity-50" />
          
          <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-5 text-white shadow-lg shadow-sky-100">
              <Sparkles size={32} className="animate-pulse" />
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-2 text-center leading-tight">
              חדש! מעקב משקל וגרף התקדמות 🚀
            </h2>
            
            <p className="text-slate-500 mb-6 text-center text-sm leading-relaxed px-2">
              שדרגנו את האפליקציה! מעכשיו תוכלו לעקוב אחרי הירידה במשקל עם גרף חכם שמראה לכם בדיוק את ההתקדמות שלכם.
            </p>

            {weightLogs[0] && (
              <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 mb-5 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">משקל אחרון:</span>
                <span className="font-black text-slate-900">{weightLogs[0].weight} ק״ג</span>
              </div>
            )}

            <div className="w-full mb-6">
              <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest text-center">משקל נוכחי (ק״ג)</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="0.0"
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-400 focus:bg-white rounded-2xl p-4 text-center text-3xl font-black text-slate-900 transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={handleSave}
                disabled={!newWeight || isSaving}
                className="w-full bg-slate-950 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-30"
              >
                {isSaving ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    שמור וצפה בגרף!
                  </>
                )}
              </button>
              
              <button
                onClick={handleRemindTomorrow}
                className="w-full bg-slate-100 text-slate-700 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-sm"
              >
                <Bell size={16} />
                הזכר לי מחר
              </button>
              
              <button
                onClick={handleUpdateLater}
                className="w-full text-slate-400 font-bold py-2 text-xs flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
              >
                אסייר קודם, אעדכן אחר כך
                <ArrowLeft size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
