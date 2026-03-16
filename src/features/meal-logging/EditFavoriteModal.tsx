import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { type SavedMeal, useAppStore } from "../../store";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ModalShell } from "../../components/ui/modal-shell";

interface EditFavoriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMeal: SavedMeal | null;
  onCalculateAndLog?: (text: string) => void;
}

export function EditFavoriteModal({ isOpen, onClose, savedMeal, onCalculateAndLog }: EditFavoriteModalProps) {
  const updateFavoriteTemplate = useAppStore((state) => state.updateFavoriteTemplate);

  const [name, setName] = useState("");
  const [mealText, setMealText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (savedMeal && isOpen) {
      setName(savedMeal.meal.meal_name);
      setMealText(savedMeal.mealText || savedMeal.meal.meal_name);
    }
  }, [savedMeal, isOpen]);

  const handleSave = async () => {
    if (!savedMeal) return;
    const trimmedName = name.trim();
    const trimmedText = mealText.trim();

    if (!trimmedName) {
      toast.error("יש להזין שם לתבנית");
      return;
    }
    if (!trimmedText) {
      toast.error("יש להזין תיאור ארוחה");
      return;
    }

    setIsSaving(true);
    const success = await updateFavoriteTemplate(savedMeal.id, trimmedName, trimmedText);
    setIsSaving(false);

    if (success) {
      onClose();
    }
  };

  if (!savedMeal) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="עריכת תבנית מועדפת" description="ערוך את התבנית — הערכים התזונתיים יחושבו מחדש בכל שימוש">
      <div className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="fav-name" className="text-[13px] font-black text-slate-500 uppercase tracking-widest px-1">
            שם התבנית
          </Label>
          <Input
            id="fav-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-lg font-medium px-6"
            placeholder="שם התבנית"
          />
        </div>

        {/* Meal Text (Raw Prompt) */}
        <div className="space-y-2">
          <Label htmlFor="fav-text" className="text-[13px] font-black text-slate-500 uppercase tracking-widest px-1">
            תיאור הארוחה (טקסט חופשי)
          </Label>
          <textarea
            id="fav-text"
            value={mealText}
            onChange={(e) => setMealText(e.target.value)}
            placeholder="למשל: 2 פרוסות לחם מלא, 2 ביצים קשות, חצי אבוקדו, עגבנייה"
            className="w-full h-32 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-[15px] font-medium px-6 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300/50"
            dir="rtl"
          />
          <p className="text-[13px] font-bold text-slate-400 px-1">
            הטקסט הזה יישלח ל-AI לחישוב ערכים תזונתיים בכל פעם שתשתמש בתבנית
          </p>
        </div>

        {/* Info Card */}
        <motion.div
          layout
          className="p-5 rounded-3xl bg-gradient-to-br from-blue-50/80 to-violet-50/50 border border-blue-200/40"
        >
          <p className="text-[13px] font-bold text-blue-600 leading-relaxed">
            תבניות מועדפות שומרות את הטקסט בלבד. בכל שימוש, הערכים התזונתיים יחושבו מחדש על ידי AI לדיוק מרבי.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            size="lg"
            className="w-full h-14 rounded-2xl text-lg"
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
                שומר...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={18} />
                שמור שינויים לתבנית
              </span>
            )}
          </Button>
          {onCalculateAndLog && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full h-14 rounded-2xl text-lg border-violet-200 text-violet-700 hover:bg-violet-50"
              onClick={() => {
                const trimmedText = mealText.trim();
                if (!trimmedText) {
                  toast.error("יש להזין תיאור ארוחה");
                  return;
                }
                onCalculateAndLog(trimmedText);
              }}
            >
              <span className="flex items-center gap-2">
                <CalendarPlus size={18} />
                חשב והוסף להיום (חד-פעמי)
              </span>
            </Button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
