import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Save, Bell } from "lucide-react";
import { useAppStore } from "../../../store";

export function WeightReminderModal() {
  const weightLogs = useAppStore((state) => state.weightLogs);
  const addWeightLog = useAppStore((state) => state.addWeightLog);
  const profile = useAppStore((state) => state.profile);
  const setActiveScreen = useAppStore((state) => state.setActiveScreen);
  
  const [isOpen, setIsOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  useEffect(() => {
    const checkReminder = () => {
      // Check if reminded in the last 24h
      const lastReminded = localStorage.getItem("weight_reminder_last");
      if (lastReminded) {
        const lastDate = new Date(parseInt(lastReminded));
        const now = new Date();
        if (now.getTime() - lastDate.getTime() < 24 * 60 * 60 * 1000) {
          return;
        }
      }

      const lastLog = weightLogs[0];
      if (lastLog) {
        const lastDate = new Date(lastLog.logged_at);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 7) {
          setIsOpen(true);
        }
      } else if (profile?.weight) {
          setIsOpen(true);
      }
    };

    // Delay check slightly to allow initial hydration
    const timeout = setTimeout(checkReminder, 2000);
    return () => clearTimeout(timeout);
  }, [weightLogs, profile]);

  const handleSave = async () => {
    const weight = parseFloat(newWeight);
    if (!isNaN(weight) && weight > 0) {
      await addWeightLog(weight);
      setIsOpen(false);
      setActiveScreen("weight");
    }
  };

  const handleRemindTomorrow = () => {
    localStorage.setItem("weight_reminder_last", Date.now().toString());
    setIsOpen(false);
  };

  const handleUpdateLater = () => {
    // Reset the 7-day timer by setting a future date in local storage
    localStorage.setItem("weight_reminder_last", (Date.now() + 6 * 24 * 60 * 60 * 1000).toString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto"
          onClick={handleRemindTomorrow}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md relative z-[201] text-right pointer-events-auto"
          dir="rtl"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 mx-auto text-slate-950">
            <Scale size={32} />
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">זמן לעדכן משקל?</h2>
          <p className="text-slate-500 mb-6 text-center">ראינו שלא עדכנת את המשקל שלך כבר הרבה זמן. תרצה לעדכן עכשיו?</p>

          {weightLogs[0] && (
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex justify-between items-center">
              <span className="text-slate-500">משקל אחרון:</span>
              <span className="font-bold text-slate-900">{weightLogs[0].weight} ק״ג</span>
            </div>
          )}

          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2">משקל חדש (ק״ג)</label>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="0.0"
              className="w-full bg-slate-100 border-none rounded-2xl p-4 text-center text-2xl font-black focus:ring-2 focus:ring-slate-950 transition-all"
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSave}
              disabled={!newWeight}
              className="w-full bg-slate-950 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Save size={20} />
              שמור
            </button>
            <button
              onClick={handleRemindTomorrow}
              className="w-full bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Bell size={20} />
              הזכר לי מחר
            </button>
            <button
              onClick={handleUpdateLater}
              className="w-full text-slate-400 font-medium py-2 active:scale-[0.98] transition-all"
            >
              אעדכן אחר כך דרך הפרופיל
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
