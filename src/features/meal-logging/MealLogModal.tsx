import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Heart, Plus, Trash2, WandSparkles } from "lucide-react";
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
      if (error.message === "BYOK_REQUIRED" || error.message === "API_KEY_INVALID") {
        if (error.message === "API_KEY_INVALID") {
          toast.error("מפתח ה-API שסופק אינו תקין או פג תוקף. אנא הזן מפתח חדש.");
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <WandSparkles className="h-4 w-4" />
              בינה מלאכותית
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              ידני
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              מועדפים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="mt-4 space-y-4">
            <form onSubmit={handleAiSubmit(onAiSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">מה אכלת?</Label>
                <Input
                  id="description"
                  placeholder="למשל: סלט חלילה עם טחינה וביצה קשה"
                  {...registerAi("description")}
                />
                {aiErrors.description && (
                  <p className="text-sm text-red-500">
                    {aiErrors.description.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "מנתח..." : "הוסף ארוחה"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="manual" className="mt-4 space-y-4">
            <form
              onSubmit={handleManualSubmit(onManualSubmit)}
              className="space-y-4"
            >
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>מאכל</Label>
                      <Input
                        placeholder="שם המאכל"
                        {...registerManual(`ingredients.${index}.foodName`)}
                      />
                    </div>
                    <div className="w-20 space-y-2">
                      <Label>כמות</Label>
                      <Input
                        type="number"
                        {...registerManual(`ingredients.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="w-28 space-y-2">
                      <Label>יחידה</Label>
                      <Select
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
                        className="mb-0.5 text-red-500 hover:text-red-600"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => append({ foodName: "", quantity: 1, unit: "גרם" })}
              >
                <Plus className="ml-2 h-4 w-4" />
                הוסף מאכל
              </Button>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "מעבד..." : "שמור ארוחה"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {savedMeals.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic">
                  אין ארוחות שמורות עדיין
                </div>
              ) : (
                savedMeals.map((saved) => (
                  <div
                    key={saved.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onAddSavedMeal(saved.id)}
                    >
                      <p className="font-medium text-slate-800">
                        {saved.meal.meal_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {saved.meal.calories} קלוריות | {saved.meal.macronutrients.protein}ג חלבון
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => removeSavedMeal(saved.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
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
