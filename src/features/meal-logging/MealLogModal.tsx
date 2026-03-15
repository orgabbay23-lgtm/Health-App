import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2, Plus, Heart, WandSparkles } from "lucide-react";
import { cn } from "../../utils/utils";
import { toast } from "sonner";
import { useActiveSavedMeals, useAppStore } from "../../store";
import { getLogicalDayKey } from "../../utils/nutrition-utils";
import { parseMealDescription } from "../../utils/gemini";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ModalShell } from "../../components/ui/modal-shell";
import { Select } from "../../components/ui/select";
import { ByokModal } from "../dashboard/components/ByokModal";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";

const aiSchema = z.object({
  description: z.string().min(2, "תיאור הארוחה חייב להכיל לפחות 2 תווים"),
});

const manualSchema = z.object({
  ingredients: z
    .array(
      z.object({
        foodName: z.string().min(2, "שם המאכל חייב להכיל לפחות 2 תווים"),
        quantity: z
          .number({ invalid_type_error: "אנא הזן כמות תקינה" })
          .positive("הכמות חייבת להיות גדולה מ-0"),
        unit: z.enum(["גרם", "יחידות", "כוסות", "כפות"]),
      }),
    )
    .min(1, "יש להוסיף לפחות מרכיב אחד"),
});

type AiFormValues = z.infer<typeof aiSchema>;
type ManualFormValues = z.infer<typeof manualSchema>;

interface MealLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDayKey?: string;
}

export function MealLogModal({
  isOpen,
  onClose,
  targetDayKey = getLogicalDayKey(),
}: MealLogModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isByokOpen, setIsByokOpen] = useState(false);
  const [pendingDescription, setPendingDescription] = useState<string | null>(null);
  
  const addMealLog = useAppStore((state) => state.addMealLog);
  const savedMeals = useActiveSavedMeals();
  const addSavedMealToDay = useAppStore((state) => state.addSavedMealToDay);
  const removeSavedMeal = useAppStore((state) => state.removeSavedMeal);

  const {
    register: registerAi,
    handleSubmit: handleAiSubmit,
    reset: resetAi,
    formState: { errors: aiErrors },
  } = useForm<AiFormValues>({
    resolver: zodResolver(aiSchema),
  });

  const {
    control: manualControl,
    register: registerManual,
    handleSubmit: handleManualSubmit,
    reset: resetManual,
  } = useForm<ManualFormValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      ingredients: [{ foodName: "", quantity: 1, unit: "גרם" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: manualControl,
    name: "ingredients",
  });

  const processMealSubmission = async (description: string) => {
    setIsSubmitting(true);

    try {
      const parsedData = await parseMealDescription(description);
      const alerts = await addMealLog(targetDayKey, {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        meal_name: parsedData.meal_name,
        calories: parsedData.calories,
        macronutrients: {
          protein: parsedData.macronutrients.protein,
          carbs: parsedData.macronutrients.carbs,
          fat: parsedData.macronutrients.fat,
        },
        micronutrients: parsedData.micronutrients,
        confidence_score: 1,
        sourceType: "food",
      });

      toast.success("הארוחה נוספה בהצלחה");
      alerts.forEach((alert) => {
        toast.warning(alert.title, {
          id: `${targetDayKey}-${alert.id}`,
          description: alert.message,
          duration: 7000,
        });
      });

      resetAi();
      resetManual();
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
        setPendingDescription(description);
        setIsByokOpen(true);
      } else {
        console.error(error);
        toast.error(error.message || "אירעה שגיאה בפענוח הארוחה. בדוק את מפתח ה-API ונסה שוב.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleByokSuccess = () => {
    if (pendingDescription) {
      processMealSubmission(pendingDescription);
      setPendingDescription(null);
    }
  };

  const onAiSubmit = (data: AiFormValues) => {
    processMealSubmission(data.description);
  };

  const onManualSubmit = (data: ManualFormValues) => {
    const description = data.ingredients
      .map(
        (ingredient) =>
          `${ingredient.quantity} ${ingredient.unit} של ${ingredient.foodName}`,
      )
      .join(" עם ");

    processMealSubmission(description);
  };

  const onAddSavedMeal = async (savedMealId: string) => {
    const alerts = await addSavedMealToDay(targetDayKey, savedMealId);

    toast.success("הארוחה מהמועדפים נוספה ליום הנבחר");
    alerts.forEach((alert) => {
      toast.warning(alert.title, {
        id: `${targetDayKey}-${alert.id}`,
        description: alert.message,
        duration: 7000,
      });
    });
    onClose();
  };

  return (
    <>
      <ModalShell isOpen={isOpen} onClose={onClose} title="הוספת ארוחה">
        <Tabs defaultValue="ai" dir="rtl" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14">
            <TabsTrigger value="ai" className="gap-2">
              <WandSparkles size={16} />
              חכם
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Plus size={16} />
              ידני
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Heart size={16} />
              מועדפים
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="ai" className="mt-8">
              <motion.form 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleAiSubmit(onAiSubmit)} 
                className="space-y-6"
              >
                <div className={cn("space-y-3 transition-all duration-500", isSubmitting ? "opacity-50 blur-sm" : "")}>
                  <Label htmlFor="description" className="text-[13px] font-black text-slate-500 uppercase tracking-widest px-1">ספר לי מה אכלת...</Label>
                  <div className="relative group">
                    <Input
                      id="description"
                      placeholder="למשל: סלט חלילה עם טחינה וביצה קשה"
                      className="h-16 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-lg font-medium px-6"
                      {...registerAi("description")}
                      disabled={isSubmitting}
                    />
                    <div className="absolute inset-0 rounded-2xl border border-slate-900/5 pointer-events-none group-focus-within:border-slate-950/20 transition-colors" />
                  </div>
                  {aiErrors.description && (
                    <p className="text-[13px] font-bold text-rose-500 px-1">
                      {aiErrors.description.message}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full h-16 rounded-2xl text-lg" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-3">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      מנתח...
                    </span>
                  ) : (
                    "הוסף ארוחה"
                  )}
                </Button>
              </motion.form>
            </TabsContent>

            <TabsContent value="manual" className="mt-8">
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleManualSubmit(onManualSubmit)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <motion.div 
                      key={field.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-end gap-3 p-4 rounded-3xl bg-slate-50/50 border border-slate-100"
                    >
                      <div className="flex-1 space-y-2">
                        <Label className="text-[13px] font-black text-slate-500 uppercase tracking-widest">מאכל</Label>
                        <Input
                          placeholder="שם המאכל"
                          className="bg-white border-none shadow-sm rounded-xl"
                          {...registerManual(`ingredients.${index}.foodName`)}
                        />
                      </div>
                      <div className="w-20 space-y-2">
                        <Label className="text-[13px] font-black text-slate-500 uppercase tracking-widest">כמות</Label>
                        <Input
                          type="number"
                          className="bg-white border-none shadow-sm rounded-xl"
                          {...registerManual(`ingredients.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="w-28 space-y-2">
                        <Label className="text-[13px] font-black text-slate-500 uppercase tracking-widest">יחידה</Label>
                        <Select
                          className="bg-white border-none shadow-sm rounded-xl h-10"
                          {...registerManual(`ingredients.${index}.unit`)}
                        >
                          <option value="גרם">גרם</option>
                          <option value="יחידות">יחידות</option>
                          <option value="כוסות">כוסות</option>
                          <option value="כפות">כפות</option>
                        </Select>
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-slate-300 hover:text-rose-500 rounded-xl"
                          onClick={() => remove(index)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-12 rounded-xl border-dashed border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white"
                  onClick={() => append({ foodName: "", quantity: 1, unit: "גרם" })}
                >
                  <Plus className="ms-2 h-4 w-4" />
                  הוסף מרכיב נוסף
                </Button>

                <Button type="submit" size="lg" className="w-full h-16 rounded-2xl text-lg" disabled={isSubmitting}>
                  {isSubmitting ? "מעבד..." : "שמור ארוחה"}
                </Button>
              </motion.form>
            </TabsContent>

            <TabsContent value="saved" className="mt-8">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3 max-h-[450px] overflow-y-auto pr-1"
              >
                {savedMeals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      <Heart className="text-slate-200" size={32} />
                    </div>
                    <p className="text-sm font-bold text-slate-400">אין ארוחות שמורות עדיין</p>
                  </div>
                ) : (
                  savedMeals.map((saved, index) => (
                    <motion.div
                      key={saved.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="group flex items-center justify-between p-4 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
                      onClick={() => onAddSavedMeal(saved.id)}
                    >
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Heart size={20} fill="currentColor" />
                        </div>
                        <div>
                          <p className="font-black text-slate-950">
                            {saved.meal.meal_name}
                          </p>
                          <p className="text-[13px] font-bold text-slate-500">
                            {saved.meal.calories} קלוריות · {saved.meal.macronutrients.protein}ג' חלבון
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedMeal(saved.id);
                        }}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </ModalShell>

      <ByokModal
        isOpen={isByokOpen}
        onClose={() => setIsByokOpen(false)}
        onSuccess={handleByokSuccess}
      />
    </>
  );
}
