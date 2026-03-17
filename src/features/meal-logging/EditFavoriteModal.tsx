import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, CalendarPlus, Zap } from "lucide-react";
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
  onZeroCostLog?: (meal: SavedMeal) => void;
}

export function EditFavoriteModal({ isOpen, onClose, savedMeal, onCalculateAndLog, onZeroCostLog }: EditFavoriteModalProps) {
  const updateFavoriteTemplate = useAppStore((state) => state.updateFavoriteTemplate);

  const [name, setName] = useState("");
  const [mealText, setMealText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (savedMeal && isOpen) {
      setName(savedMeal.meal.meal_name);
      // Deep fallback chain to ensure we find the original prompt
      setMealText(savedMeal.mealText || savedMeal.meal.mealText || savedMeal.meal.meal_name);
    }
  }, [savedMeal, isOpen]);

  const originalText = savedMeal?.mealText || savedMeal?.meal.meal_name || "";
  const originalName = savedMeal?.meal.meal_name || "";
  const hasTextChanged = mealText.trim() !== originalText.trim() || name.trim() !== originalName.trim();

  const handleUpdateAndLog = async () => {
    if (!savedMeal || !onCalculateAndLog) return;
    const trimmedName = name.trim();
    const trimmedText = mealText.trim();

    if (!trimmedName || !trimmedText) {
      toast.error("יש להזין שם ותיאור");
      return;
    }

    setIsSaving(true);
    const success = await updateFavoriteTemplate(savedMeal.id, trimmedName, trimmedText);
    setIsSaving(false);

    if (success) {
      onCalculateAndLog(trimmedText);
    }
  };

  const handleUpdateOnly = async () => {
    if (!savedMeal) return;
    const trimmedName = name.trim();
    const trimmedText = mealText.trim();

    if (!trimmedName || !trimmedText) {
      toast.error("יש להזין שם ותיאור");
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
    <ModalShell isOpen={isOpen} onClose={onClose} title="הוספת ארוחה מועדפת" description="אשר או ערוך את הארוחה לפני ההוספה">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fav-name" className="text-[13px] font-black text-slate-500 uppercase tracking-widest px-1">
            שם התבנית
          </Label>
          <Input
            id="fav-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => {
              const target = e.target;
              setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 350);
            }}
            className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-[16px] font-medium px-6 text-[16px]"
            placeholder="שם התבנית"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fav-text" className="text-[13px] font-black text-slate-500 uppercase tracking-widest px-1">
            תיאור הארוחה (טקסט חופשי)
          </Label>
          <textarea
            id="fav-text"
            value={mealText}
            onChange={(e) => setMealText(e.target.value)}
            onFocus={(e) => {
              const target = e.target;
              setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 350);
            }}
            placeholder="למשל: 2 פרוסות לחם מלא, 2 ביצים קשות, חצי אבוקדו, עגבנייה"
            className="w-full h-32 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-[16px] font-medium px-6 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300/50"
            dir="rtl"
          />
        </div>

        <AnimatePresence mode="wait">
          {!hasTextChanged ? (
            <motion.div
              key="zero-cost"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <motion.div
                className="p-4 rounded-3xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200/50"
              >
                <p className="text-[13px] font-bold text-emerald-700 flex items-center gap-2">
                  <Zap size={16} />
                  ללא שינוי בטקסט - הוספה מיידית ללא חישוב AI
                </p>
              </motion.div>
              <Button
                type="button"
                size="lg"
                className="w-full h-14 rounded-2xl text-lg bg-emerald-500 hover:bg-emerald-600"
                onClick={() => {
                  if (onZeroCostLog) onZeroCostLog(savedMeal);
                  onClose();
                }}
              >
                <span className="flex items-center gap-2">
                  <Zap size={18} fill="currentColor" />
                  הוסף להיום
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full h-14 rounded-2xl text-lg"
                onClick={handleUpdateOnly}
              >
                <span className="flex items-center gap-2">
                  <Save size={18} />
                  שמור שינויים לתבנית בלבד
                </span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="branching"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <motion.div
                className="p-4 rounded-3xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-200/50"
              >
                <p className="text-[13px] font-bold text-amber-700 leading-relaxed">
                  הטקסט שונה! חישוב מחדש (AI) יידרש בעת ההוספה. בחר כיצד להמשיך:
                </p>
              </motion.div>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full h-14 rounded-2xl text-[16px] border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={() => {
                  const trimmedText = mealText.trim();
                  if (!trimmedText) return toast.error("יש להזין תיאור ארוחה");
                  if (onCalculateAndLog) onCalculateAndLog(trimmedText);
                }}
              >
                <span className="flex items-center gap-2">
                  <CalendarPlus size={18} />
                  הוסף להיום בלבד (חד פעמי)
                </span>
              </Button>
              <Button
                type="button"
                size="lg"
                className="w-full h-14 rounded-2xl text-[16px]"
                disabled={isSaving}
                onClick={handleUpdateAndLog}
              >
                {isSaving ? "שומר..." : (
                  <span className="flex items-center gap-2">
                    <Save size={18} />
                    עדכן מועדף והוסף להיום
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-full h-14 rounded-2xl text-[16px] text-slate-500"
                onClick={handleUpdateOnly}
              >
                שמור שינויים לתבנית בלבד (ללא הוספה)
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalShell>
  );
}
