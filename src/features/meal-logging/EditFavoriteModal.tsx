import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Plus, Save, Utensils } from "lucide-react";
import { toast } from "sonner";
import { type MealItem, type SavedMeal, useAppStore } from "../../store";
import { EMPTY_MICRONUTRIENTS, type MicronutrientTotals } from "../../utils/nutrition-utils";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ModalShell } from "../../components/ui/modal-shell";

interface Ingredient {
  localId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function mealToIngredients(meal: MealItem): Ingredient[] {
  return [
    {
      localId: crypto.randomUUID(),
      name: meal.meal_name,
      calories: meal.calories,
      protein: meal.macronutrients.protein,
      carbs: meal.macronutrients.carbs,
      fat: meal.macronutrients.fat,
    },
  ];
}

function aggregateIngredients(ingredients: Ingredient[]) {
  return ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories || 0),
      protein: acc.protein + (ing.protein || 0),
      carbs: acc.carbs + (ing.carbs || 0),
      fat: acc.fat + (ing.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function createEmptyIngredient(): Ingredient {
  return {
    localId: crypto.randomUUID(),
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };
}

interface EditFavoriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMeal: SavedMeal | null;
}

export function EditFavoriteModal({ isOpen, onClose, savedMeal }: EditFavoriteModalProps) {
  const updateSavedMeal = useAppStore((state) => state.updateSavedMeal);

  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (savedMeal && isOpen) {
      setName(savedMeal.meal.meal_name);
      setIngredients(mealToIngredients(savedMeal.meal));
    }
  }, [savedMeal, isOpen]);

  const totals = useMemo(() => aggregateIngredients(ingredients), [ingredients]);

  const updateIngredient = useCallback(
    (localId: string, field: keyof Omit<Ingredient, "localId">, value: string | number) => {
      setIngredients((prev) =>
        prev.map((ing) => (ing.localId === localId ? { ...ing, [field]: value } : ing)),
      );
    },
    [],
  );

  const removeIngredient = useCallback((localId: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.localId !== localId));
  }, []);

  const addIngredient = useCallback(() => {
    setIngredients((prev) => [...prev, createEmptyIngredient()]);
  }, []);

  const handleSave = async () => {
    if (!savedMeal) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("יש להזין שם לארוחה");
      return;
    }
    if (ingredients.length === 0) {
      toast.error("יש להוסיף לפחות מרכיב אחד");
      return;
    }

    setIsSaving(true);

    const micronutrients: MicronutrientTotals = savedMeal.meal.micronutrients
      ? { ...savedMeal.meal.micronutrients }
      : { ...EMPTY_MICRONUTRIENTS };

    const updatedMeal: MealItem = {
      ...savedMeal.meal,
      meal_name: trimmedName,
      calories: totals.calories,
      macronutrients: {
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
      },
      micronutrients,
    };

    const success = await updateSavedMeal(savedMeal.id, {
      meal_name: trimmedName,
      meal: updatedMeal,
    });

    setIsSaving(false);
    if (success) {
      onClose();
    }
  };

  if (!savedMeal) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="עריכת מועדף" description="ערוך את התבנית — לא ישפיע על ארוחות שכבר נרשמו">
      <div className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="fav-name" className="text-[13px] font-black text-slate-500 uppercase tracking-widest px-1">
            שם הארוחה
          </Label>
          <Input
            id="fav-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-lg font-medium px-6"
            placeholder="שם הארוחה"
          />
        </div>

        {/* Ingredients List */}
        <div className="space-y-2">
          <Label className="text-[13px] font-black text-slate-500 uppercase tracking-widest px-1">
            מרכיבים
          </Label>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {ingredients.map((ing, index) => (
                <motion.div
                  key={ing.localId}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="overflow-visible"
                >
                  <div className="p-4 rounded-3xl bg-slate-50/60 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                          <Utensils size={14} />
                        </div>
                        <span className="text-[13px] font-bold text-slate-400">
                          מרכיב {index + 1}
                        </span>
                      </div>
                      {ingredients.length > 1 && (
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl h-8 w-8"
                            onClick={() => removeIngredient(ing.localId)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </motion.div>
                      )}
                    </div>

                    <Input
                      value={ing.name}
                      onChange={(e) => updateIngredient(ing.localId, "name", e.target.value)}
                      placeholder="שם המרכיב"
                      className="bg-white border-none shadow-sm rounded-xl h-11 text-[14px] font-medium"
                    />

                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[13px] font-bold text-slate-400">קלוריות</Label>
                        <Input
                          type="number"
                          value={ing.calories || ""}
                          onChange={(e) => updateIngredient(ing.localId, "calories", Number(e.target.value) || 0)}
                          className="bg-white border-none shadow-sm rounded-xl h-10 text-center text-[14px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[13px] font-bold text-slate-400">חלבון</Label>
                        <Input
                          type="number"
                          value={ing.protein || ""}
                          onChange={(e) => updateIngredient(ing.localId, "protein", Number(e.target.value) || 0)}
                          className="bg-white border-none shadow-sm rounded-xl h-10 text-center text-[14px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[13px] font-bold text-slate-400">פחמימות</Label>
                        <Input
                          type="number"
                          value={ing.carbs || ""}
                          onChange={(e) => updateIngredient(ing.localId, "carbs", Number(e.target.value) || 0)}
                          className="bg-white border-none shadow-sm rounded-xl h-10 text-center text-[14px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[13px] font-bold text-slate-400">שומן</Label>
                        <Input
                          type="number"
                          value={ing.fat || ""}
                          onChange={(e) => updateIngredient(ing.localId, "fat", Number(e.target.value) || 0)}
                          className="bg-white border-none shadow-sm rounded-xl h-10 text-center text-[14px]"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-11 rounded-xl border-dashed border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white mt-2"
            onClick={addIngredient}
          >
            <Plus className="ms-2 h-4 w-4" />
            הוסף מרכיב
          </Button>
        </div>

        {/* Live Totals Summary */}
        <motion.div
          layout
          className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60"
        >
          <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-3">סה״כ תזונתי</p>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xl font-black text-slate-900">{Math.round(totals.calories)}</p>
              <p className="text-[13px] font-bold text-slate-400">קלוריות</p>
            </div>
            <div>
              <p className="text-xl font-black text-blue-600">{Math.round(totals.protein)}ג׳</p>
              <p className="text-[13px] font-bold text-slate-400">חלבון</p>
            </div>
            <div>
              <p className="text-xl font-black text-amber-600">{Math.round(totals.carbs)}ג׳</p>
              <p className="text-[13px] font-bold text-slate-400">פחמימות</p>
            </div>
            <div>
              <p className="text-xl font-black text-rose-600">{Math.round(totals.fat)}ג׳</p>
              <p className="text-[13px] font-bold text-slate-400">שומן</p>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
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
              שמור שינויים
            </span>
          )}
        </Button>
      </div>
    </ModalShell>
  );
}
