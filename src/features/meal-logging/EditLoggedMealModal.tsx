import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { type MealItem, useAppStore } from "../../store";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { ModalShell } from "../../components/ui/modal-shell";
import { parseMealDescription } from "../../utils/gemini";
import { ByokModal } from "../dashboard/components/ByokModal";

interface EditLoggedMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: MealItem | null;
  dayKey: string;
}

export function EditLoggedMealModal({ isOpen, onClose, meal, dayKey }: EditLoggedMealModalProps) {
  const updateMealLog = useAppStore((state) => state.updateMealLog);

  const [mealText, setMealText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isByokOpen, setIsByokOpen] = useState(false);
  const [pendingText, setPendingText] = useState<string | null>(null);

  useEffect(() => {
    if (meal && isOpen) {
      setMealText(meal.mealText || meal.meal_name);
    }
  }, [meal, isOpen]);

  const handleCalculateAndSave = async (textToProcess: string) => {
    if (!meal) return;
    if (!window.confirm('האם אתה בטוח?')) return;
    
    setIsSaving(true);
    try {
      const parsedData = await parseMealDescription(textToProcess);
      
      const updatedMeal: MealItem = {
        ...meal,
        meal_name: parsedData.meal_name,
        calories: parsedData.calories,
        macronutrients: {
          protein: parsedData.macronutrients.protein,
          carbs: parsedData.macronutrients.carbs,
          fat: parsedData.macronutrients.fat,
        },
        micronutrients: parsedData.micronutrients,
        mealText: textToProcess, // Keep the new text
      };

      const alerts = await updateMealLog(dayKey, meal.id, updatedMeal);
      
      toast.success("הארוחה עודכנה בהצלחה");
      alerts.forEach((alert) => {
        toast.warning(alert.title, {
          id: `${dayKey}-${alert.id}-edit`,
          description: alert.message,
          duration: 7000,
        });
      });
      onClose();
    } catch (error: any) {
      if (error.message === "BYOK_REQUIRED" || error.message === "API_KEY_INVALID" || error.message === "MISSING_API_KEY" || error.message === "INVALID_KEY_FROM_GOOGLE") {
        if (error.message === "API_KEY_INVALID") {
          toast.error("מפתח ה-API שסופק אינו תקין או פג תוקף. אנא הזן מפתח חדש.");
        } else if (error.message === "MISSING_API_KEY") {
          toast.error("אנא הזינו מפתח API בהגדרות");
        } else if (error.message === "INVALID_KEY_FROM_GOOGLE") {
          toast.error("מפתח ה-API אינו תקין. אנא עדכנו אותו בהגדרות.");
        }
        setPendingText(textToProcess);
        setIsByokOpen(true);
      } else {
        console.error(error);
        toast.error(error.message || "אירעה שגיאה בפענוח הארוחה. בדוק את מפתח ה-API ונסה שוב.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    const trimmedText = mealText.trim();
    if (!trimmedText) {
      toast.error("יש להזין תיאור ארוחה");
      return;
    }
    handleCalculateAndSave(trimmedText);
  };

  const handleByokSuccess = () => {
    if (pendingText) {
      handleCalculateAndSave(pendingText);
      setPendingText(null);
    }
  };

  if (!meal) return null;

  return (
    <>
      <ModalShell isOpen={isOpen} onClose={onClose} title="עריכת ארוחה" description="ערוך את תיאור הארוחה לחישוב מחדש של הערכים התזונתיים">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-log-text" className="text-[13px] font-black text-slate-500 uppercase tracking-widest px-1">
              תיאור הארוחה
            </Label>
            <textarea
              id="edit-log-text"
              value={mealText}
              onChange={(e) => setMealText(e.target.value)}
              onFocus={(e) => {
                const target = e.target;
                setTimeout(() => {
                  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 350);
              }}
              placeholder="מה אכלת?"
              className="w-full h-32 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-[16px] font-medium px-6 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300/50"
              dir="rtl"
            />
          </div>

          <motion.div
            layout
            className="p-5 rounded-3xl bg-gradient-to-br from-blue-50/80 to-violet-50/50 border border-blue-200/40"
          >
            <p className="text-[13px] font-bold text-blue-600 leading-relaxed">
              הערכים התזונתיים יחושבו מחדש על ידי AI ויחליפו את הערכים הקיימים בהיסטוריה.
            </p>
          </motion.div>

          <Button
            type="button"
            size="lg"
            className="w-full h-14 rounded-2xl text-[16px] gap-2"
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <span className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                מחשב מחדש...
              </span>
            ) : (
              <>
                <WandSparkles size={18} />
                שמור ועדכן ערכים
              </>
            )}
          </Button>
        </div>
      </ModalShell>

      <ByokModal
        isOpen={isByokOpen}
        onClose={() => setIsByokOpen(false)}
        onSuccess={handleByokSuccess}
      />
    </>
  );
}
