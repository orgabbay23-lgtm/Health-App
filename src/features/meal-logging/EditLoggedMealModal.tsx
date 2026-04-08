import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WandSparkles, List, Pencil, Trash2, ArrowRight, X, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { type MealItem, type MealIngredient, useAppStore } from "../../store";
import { MICRONUTRIENT_KEYS, EMPTY_MICRONUTRIENTS, type MicronutrientTotals } from "../../utils/nutrition-utils";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { ModalShell } from "../../components/ui/modal-shell";
import { parseMealDescription, parseEditedIngredients } from "../../utils/gemini";
import { formatNutritionValue } from "../../utils/nutrition-utils";
import { ByokModal } from "../dashboard/components/ByokModal";

type EditMode = "choice" | "ingredients" | "full";

interface EditLoggedMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: MealItem | null;
  dayKey: string;
}

export function EditLoggedMealModal({ isOpen, onClose, meal, dayKey }: EditLoggedMealModalProps) {
  const updateMealLog = useAppStore((state) => state.updateMealLog);

  const [mode, setMode] = useState<EditMode>("choice");
  const [mealText, setMealText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isByokOpen, setIsByokOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Ingredient editing state
  const [editingIndices, setEditingIndices] = useState<Record<number, string>>({});
  const [deletedIndices, setDeletedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (meal && isOpen) {
      setMealText(meal.mealText || meal.meal_name);
      setEditingIndices({});
      setDeletedIndices(new Set());
      // If meal has ingredients, show choice; otherwise go directly to full edit
      setMode(meal.ingredients && meal.ingredients.length > 0 ? "choice" : "full");
    }
  }, [meal, isOpen]);

  const handleClose = () => {
    setMode("choice");
    setEditingIndices({});
    setDeletedIndices(new Set());
    onClose();
  };

  // ── Full meal edit (existing behavior) ───────────────────────────
  const handleFullEditSave = async (textToProcess: string) => {
    if (!meal) return;
    if (!window.confirm("האם אתה בטוח?")) return;

    setIsSaving(true);
    try {
      const parsedData = await parseMealDescription(textToProcess);
      const updatedMeal: MealItem = {
        ...meal,
        meal_name: parsedData.meal_name,
        ingredients: parsedData.ingredients,
        calories: parsedData.calories,
        macronutrients: {
          protein: parsedData.macronutrients.protein,
          carbs: parsedData.macronutrients.carbs,
          fat: parsedData.macronutrients.fat,
        },
        micronutrients: parsedData.micronutrients,
        mealText: textToProcess,
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
      handleClose();
    } catch (error: any) {
      handleGeminiError(error, () => handleFullEditSave(textToProcess));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFullSave = () => {
    const trimmedText = mealText.trim();
    if (!trimmedText) {
      toast.error("יש להזין תיאור ארוחה");
      return;
    }
    handleFullEditSave(trimmedText);
  };

  // ── Ingredient-level editing ─────────────────────────────────────
  const startEditingIngredient = (index: number) => {
    if (!meal?.ingredients) return;
    setEditingIndices((prev) => ({
      ...prev,
      [index]: meal.ingredients![index].name,
    }));
  };

  const cancelEditingIngredient = (index: number) => {
    setEditingIndices((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const updateEditingText = (index: number, text: string) => {
    setEditingIndices((prev) => ({ ...prev, [index]: text }));
  };

  const toggleDeleteIngredient = (index: number) => {
    setDeletedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    // Remove from editing if being deleted
    setEditingIndices((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const hasIngredientChanges = () => {
    if (deletedIndices.size > 0) return true;
    if (!meal?.ingredients) return false;
    return Object.entries(editingIndices).some(
      ([idx, text]) => text.trim() !== meal.ingredients![Number(idx)].name,
    );
  };

  const handleIngredientsSave = async () => {
    if (!meal?.ingredients) return;

    const originalIngredients = meal.ingredients;
    const remainingIngredients = originalIngredients.filter((_, i) => !deletedIndices.has(i));

    // If all ingredients are deleted, delete the meal entirely
    if (remainingIngredients.length === 0) {
      toast.error("לא ניתן למחוק את כל המרכיבים. מחק את הארוחה כולה במקום.");
      return;
    }

    // Determine which ingredients were actually edited (text changed)
    const editedEntries = Object.entries(editingIndices)
      .filter(([idx, text]) => {
        const i = Number(idx);
        return !deletedIndices.has(i) && text.trim() !== originalIngredients[i].name;
      })
      .map(([idx, text]) => ({ index: Number(idx), newText: text.trim() }));

    // If only deletions (no text edits), handle locally without Gemini
    if (editedEntries.length === 0 && deletedIndices.size > 0) {
      await handleDeletionsOnly(originalIngredients);
      return;
    }

    // If there are text edits, send to Gemini
    if (editedEntries.length > 0) {
      await handleEditsWithGemini(originalIngredients, editedEntries);
    }
  };

  const handleDeletionsOnly = async (originalIngredients: MealIngredient[]) => {
    if (!meal) return;

    setIsSaving(true);
    try {
      let totalCalDelta = 0;
      let totalProteinDelta = 0;
      let totalCalFraction = 0;

      for (const idx of deletedIndices) {
        const ing = originalIngredients[idx];
        totalCalDelta += ing.calories;
        totalProteinDelta += ing.protein;
        totalCalFraction += meal.calories > 0 ? ing.calories / meal.calories : 0;
      }

      const remainingIngredients = originalIngredients.filter((_, i) => !deletedIndices.has(i));
      const keepFraction = Math.max(0, 1 - totalCalFraction);

      const updatedMicros = MICRONUTRIENT_KEYS.reduce((acc, key) => {
        acc[key] = Math.max(0, meal.micronutrients[key] * keepFraction);
        return acc;
      }, { ...EMPTY_MICRONUTRIENTS } as MicronutrientTotals);

      const updatedMeal: MealItem = {
        ...meal,
        ingredients: remainingIngredients,
        calories: Math.max(0, meal.calories - totalCalDelta),
        macronutrients: {
          protein: Math.max(0, meal.macronutrients.protein - totalProteinDelta),
          carbs: Math.max(0, meal.macronutrients.carbs * keepFraction),
          fat: Math.max(0, meal.macronutrients.fat * keepFraction),
        },
        micronutrients: updatedMicros,
      };

      const alerts = await updateMealLog(dayKey, meal.id, updatedMeal);
      toast.success("המרכיבים עודכנו בהצלחה");
      alerts.forEach((alert) => {
        toast.warning(alert.title, {
          id: `${dayKey}-${alert.id}-edit-ing`,
          description: alert.message,
          duration: 7000,
        });
      });
      handleClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditsWithGemini = async (
    originalIngredients: MealIngredient[],
    editedEntries: { index: number; newText: string }[],
  ) => {
    if (!meal) return;

    setIsSaving(true);
    try {
      const editRequests = editedEntries.map(e => {
        const oldIng = originalIngredients[e.index];
        return {
          oldName: oldIng.name,
          oldCalories: oldIng.calories,
          oldProtein: oldIng.protein,
          newText: e.newText
        };
      });
      let newIngredientsData = null;
      
      if (editRequests.length > 0) {
        newIngredientsData = await parseEditedIngredients(editRequests);
      }

      let deltaCalories = 0;
      let deltaProtein = 0;
      
      // Calculate deletions
      deletedIndices.forEach(idx => {
         const oldIng = originalIngredients[idx];
         deltaCalories -= oldIng.calories;
         deltaProtein -= oldIng.protein;
      });

      const finalIngredients = [];
      let editIndex = 0;
      
      for (let i = 0; i < originalIngredients.length; i++) {
        if (deletedIndices.has(i)) continue;
        
        const edit = editedEntries.find(e => e.index === i);
        if (edit && newIngredientsData) {
           const oldIng = originalIngredients[i];
           const newIng = newIngredientsData.ingredients[editIndex];
           if (newIng) {
             deltaCalories += (newIng.calories - oldIng.calories);
             deltaProtein += (newIng.protein - oldIng.protein);
             finalIngredients.push(newIng);
           }
           editIndex++;
        } else {
           finalIngredients.push(originalIngredients[i]);
        }
      }
      
      const description = finalIngredients.map(ing => ing.name).join(", ");

      const updatedMeal: MealItem = {
        ...meal,
        ingredients: finalIngredients,
        calories: Math.max(0, meal.calories + deltaCalories),
        macronutrients: {
          ...meal.macronutrients,
          protein: Math.max(0, meal.macronutrients.protein + deltaProtein),
        },
        mealText: description,
      };

      const alerts = await updateMealLog(dayKey, meal.id, updatedMeal);
      toast.success("המרכיבים עודכנו בהצלחה");
      alerts.forEach((alert) => {
        toast.warning(alert.title, {
          id: `${dayKey}-${alert.id}-edit-ing`,
          description: alert.message,
          duration: 7000,
        });
      });
      handleClose();
    } catch (error: any) {
      handleGeminiError(error, () =>
        handleEditsWithGemini(originalIngredients, editedEntries),
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Shared error handler ─────────────────────────────────────────
  const handleGeminiError = (error: any, retryFn: () => void) => {
    if (
      error.message === "BYOK_REQUIRED" ||
      error.message === "API_KEY_INVALID" ||
      error.message === "MISSING_API_KEY" ||
      error.message === "INVALID_KEY_FROM_GOOGLE"
    ) {
      if (error.message === "API_KEY_INVALID") {
        toast.error("מפתח ה-API שסופק אינו תקין או פג תוקף. אנא הזן מפתח חדש.");
      } else if (error.message === "MISSING_API_KEY") {
        toast.error("אנא הזינו מפתח API בהגדרות");
      } else if (error.message === "INVALID_KEY_FROM_GOOGLE") {
        toast.error("מפתח ה-API אינו תקין. אנא עדכנו אותו בהגדרות.");
      }
      setPendingAction(() => retryFn);
      setIsByokOpen(true);
    } else {
      console.error(error);
      toast.error(error.message || "אירעה שגיאה בפענוח הארוחה. בדוק את מפתח ה-API ונסה שוב.");
    }
  };

  const handleByokSuccess = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  if (!meal) return null;

  const ingredients = meal.ingredients ?? [];

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={handleClose}
        title={
          mode === "choice"
            ? "עריכת ארוחה"
            : mode === "ingredients"
              ? "עריכת מרכיבים"
              : "עריכת ארוחה"
        }
        description={
          mode === "choice"
            ? "בחר כיצד לערוך את הארוחה"
            : mode === "ingredients"
              ? "ערוך או מחק מרכיבים ספציפיים"
              : "ערוך את תיאור הארוחה לחישוב מחדש של הערכים התזונתיים"
        }
        position="top"
      >
        <AnimatePresence mode="wait">
          {/* ── Choice mode ─────────────────────────────────────── */}
          {mode === "choice" && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <button
                type="button"
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border border-indigo-200/40 hover:border-indigo-300/60 hover:shadow-md active:scale-[0.98] transition-all text-right"
                onClick={() => setMode("ingredients")}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <List size={22} className="text-indigo-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-[15px] font-black text-slate-900">ערוך מרכיבים ספציפיים</h3>
                  <p className="text-[12px] font-medium text-slate-500">שנה או מחק מרכיבים בודדים מהארוחה</p>
                </div>
                <ArrowRight size={18} className="text-slate-400 shrink-0 rotate-180" />
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-violet-50/80 to-purple-50/50 border border-violet-200/40 hover:border-violet-300/60 hover:shadow-md active:scale-[0.98] transition-all text-right"
                onClick={() => setMode("full")}
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Pencil size={22} className="text-violet-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-[15px] font-black text-slate-900">ערוך את כל הארוחה</h3>
                  <p className="text-[12px] font-medium text-slate-500">כתוב מחדש את הארוחה וחשב ערכים תזונתיים חדשים</p>
                </div>
                <ArrowRight size={18} className="text-slate-400 shrink-0 rotate-180" />
              </button>
            </motion.div>
          )}

          {/* ── Ingredients editing mode ────────────────────────── */}
          {mode === "ingredients" && (
            <motion.div
              key="ingredients"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <button
                type="button"
                className="flex items-center gap-2 text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors mb-2"
                onClick={() => {
                  setMode("choice");
                  setEditingIndices({});
                  setDeletedIndices(new Set());
                }}
              >
                <ArrowRight size={14} />
                <span>חזרה</span>
              </button>

              <div className="space-y-3">
                {ingredients.map((ing, idx) => {
                  const isDeleted = deletedIndices.has(idx);
                  const isEditing = idx in editingIndices;

                  return (
                    <motion.div
                      key={idx}
                      layout
                      className={`rounded-2xl border p-4 transition-all ${
                        isDeleted
                          ? "bg-rose-50/50 border-rose-200/60 opacity-60"
                          : isEditing
                            ? "bg-blue-50/50 border-blue-200/60"
                            : "bg-white/80 border-slate-100"
                      }`}
                    >
                      {isEditing && !isDeleted ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingIndices[idx]}
                            onChange={(e) => updateEditingText(idx, e.target.value)}
                            className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-[15px] font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                            dir="rtl"
                            rows={2}
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                              onClick={() => cancelEditingIngredient(idx)}
                            >
                              <X size={13} />
                              <span>ביטול</span>
                            </button>
                            <button
                              type="button"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                              onClick={() => {
                                // Keep the edit in editingIndices — it will be applied on save
                              }}
                              disabled
                            >
                              <Check size={13} />
                              <span>נשמר</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDeleted ? "bg-rose-400" : "bg-indigo-400"}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-bold ${isDeleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                              {ing.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[12px] font-bold">
                              <span className={isDeleted ? "text-slate-300" : "text-slate-500"}>
                                {formatNutritionValue(ing.calories)} קק"ל
                              </span>
                              <span className={`w-1 h-1 rounded-full ${isDeleted ? "bg-slate-200" : "bg-slate-300"}`} />
                              <span className={isDeleted ? "text-orange-300" : "text-orange-500"}>
                                {formatNutritionValue(ing.protein)} ג' חלבון
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isDeleted ? (
                              <button
                                type="button"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                onClick={() => toggleDeleteIngredient(idx)}
                              >
                                <Plus size={12} />
                                <span>שחזר</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="p-2 rounded-xl text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                  onClick={() => startEditingIngredient(idx)}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                  onClick={() => toggleDeleteIngredient(idx)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {hasIngredientChanges() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 pt-2"
                >
                  {Object.keys(editingIndices).length > 0 && !Array.from(deletedIndices).every((i) => i in editingIndices) && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-violet-50/50 border border-blue-200/40">
                      <p className="text-[12px] font-bold text-blue-600 leading-relaxed">
                        המרכיבים שנערכו יחושבו מחדש על ידי AI. שאר המרכיבים יישארו כפי שהם.
                      </p>
                    </div>
                  )}

                  <Button
                    type="button"
                    size="lg"
                    className="w-full h-14 rounded-2xl text-[16px] gap-2"
                    disabled={isSaving}
                    onClick={handleIngredientsSave}
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        מעדכן מרכיבים...
                      </span>
                    ) : (
                      <>
                        <WandSparkles size={18} />
                        שמור שינויים
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Full meal edit mode ─────────────────────────────── */}
          {mode === "full" && (
            <motion.div
              key="full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {ingredients.length > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-2 text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setMode("choice")}
                >
                  <ArrowRight size={14} />
                  <span>חזרה</span>
                </button>
              )}

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
                      target.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 450);
                  }}
                  placeholder="מה אכלת?"
                  className="w-full h-32 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-[16px] font-medium px-6 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                  dir="rtl"
                />
              </div>

              <motion.div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50/80 to-violet-50/50 border border-blue-200/40">
                <p className="text-[13px] font-bold text-blue-600 leading-relaxed">
                  הערכים התזונתיים יחושבו מחדש על ידי AI ויחליפו את הערכים הקיימים בהיסטוריה.
                </p>
              </motion.div>

              <Button
                type="button"
                size="lg"
                className="w-full h-14 rounded-2xl text-[16px] gap-2"
                disabled={isSaving}
                onClick={handleFullSave}
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
            </motion.div>
          )}
        </AnimatePresence>
      </ModalShell>

      <ByokModal
        isOpen={isByokOpen}
        onClose={() => setIsByokOpen(false)}
        onSuccess={handleByokSuccess}
      />
    </>
  );
}
