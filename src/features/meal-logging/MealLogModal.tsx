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
    formState: { errors: manualErrors },
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
      const alerts = addMealLog(targetDayKey, {
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
    } catch (error) {
      console.error(error);
      toast.error("אירעה שגיאה בפענוח הארוחה. בדוק את מפתח ה-API ונסה שוב.");
    } finally {
      setIsSubmitting(false);
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

  const onAddSavedMeal = (savedMealId: string) => {
    const alerts = addSavedMealToDay(targetDayKey, savedMealId);

    toast.success("הארוחה מהמועדפים נוספה ליום הנבחר");
    alerts.forEach((alert) => {
      toast.warning(alert.title, {
        id: `${targetDayKey}-${alert.id}`,
        description: alert.message,
        duration: 7000,
      });
    });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="הוספת ארוחה"
      description={`הפעולה תירשם ליום ${targetDayKey}`}
      className="max-w-3xl"
    >
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="mb-6 grid h-auto w-full grid-cols-3 rounded-[22px] bg-slate-100 p-1">
          <TabsTrigger value="manual" className="rounded-[18px] py-3">
            הזנה ידנית
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-[18px] py-3">
            פיענוח AI
          </TabsTrigger>
          <TabsTrigger value="favorites" className="rounded-[18px] py-3">
            מועדפים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <form
            onSubmit={handleManualSubmit(onManualSubmit)}
            className="space-y-4"
          >
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="relative space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5"
              >
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-3 top-3 rounded-full text-rose-500 hover:bg-rose-50"
                    onClick={() => remove(index)}
                  >
                    הסר
                  </Button>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor={`ingredients.${index}.foodName`}>
                    שם המאכל
                  </Label>
                  <Input
                    id={`ingredients.${index}.foodName`}
                    {...registerManual(`ingredients.${index}.foodName`)}
                    placeholder="למשל: חזה עוף, אורז לבן או טופו"
                    className="rounded-2xl border-slate-200 bg-white"
                  />
                  {manualErrors.ingredients?.[index]?.foodName ? (
                    <span className="text-sm text-destructive">
                      {manualErrors.ingredients[index]?.foodName?.message}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`ingredients.${index}.quantity`}>
                      כמות
                    </Label>
                    <Input
                      id={`ingredients.${index}.quantity`}
                      type="number"
                      step="0.1"
                      {...registerManual(`ingredients.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                      placeholder="1"
                      className="rounded-2xl border-slate-200 bg-white"
                    />
                    {manualErrors.ingredients?.[index]?.quantity ? (
                      <span className="text-sm text-destructive">
                        {manualErrors.ingredients[index]?.quantity?.message}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`ingredients.${index}.unit`}>
                      יחידת מידה
                    </Label>
                    <Select
                      id={`ingredients.${index}.unit`}
                      className="rounded-2xl border-slate-200 bg-white text-right"
                      {...registerManual(`ingredients.${index}.unit`)}
                    >
                      <option value="גרם">גרם</option>
                      <option value="יחידות">יחידות</option>
                      <option value="כוסות">כוסות</option>
                      <option value="כפות">כפות</option>
                    </Select>
                    {manualErrors.ingredients?.[index]?.unit ? (
                      <span className="text-sm text-destructive">
                        {manualErrors.ingredients[index]?.unit?.message}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-[20px] border-dashed"
              onClick={() => append({ foodName: "", quantity: 1, unit: "גרם" })}
            >
              <Plus size={16} className="ms-2" />
              הוסף מרכיב
            </Button>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full px-5"
              >
                {isSubmitting ? "מוסיף..." : "הוסף ארוחה"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="ai">
          <form onSubmit={handleAiSubmit(onAiSubmit)} className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                  <WandSparkles size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">תיאור חופשי</h3>
                  <p className="text-sm text-slate-500">
                    תאר מה אכלת והמערכת תשתמש ב-Gemini כדי להפיק JSON תקין
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">מה אכלת?</Label>
                <textarea
                  id="description"
                  dir="rtl"
                  {...registerAi("description")}
                  placeholder="למשל: 100 גרם חזה עוף עם 50 גרם אורז וכף שמן זית"
                  className="min-h-[140px] w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-right text-sm shadow-sm outline-none transition focus:border-sky-300"
                />
                {aiErrors.description ? (
                  <span className="text-sm text-destructive">
                    {aiErrors.description.message}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full px-5"
              >
                {isSubmitting ? "מפענח..." : "הוסף ארוחה"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="favorites">
          <div className="space-y-4">
            {savedMeals.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                  <Heart size={22} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  אין עדיין מועדפים
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  שמור ארוחות מהיומן היומי כדי שתוכל להוסיף אותן שוב בלחיצה אחת.
                </p>
              </div>
            ) : (
              savedMeals.map((savedMeal) => (
                <div
                  key={savedMeal.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-2xl bg-rose-50 p-2 text-rose-500">
                        <Heart size={16} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {savedMeal.meal.meal_name}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500">
                      {Math.round(savedMeal.meal.calories)} קק"ל | חלבון{" "}
                      {Math.round(savedMeal.meal.macronutrients.protein)} ג' |
                      פחמימות {Math.round(savedMeal.meal.macronutrients.carbs)}{" "}
                      ג' | שומן {Math.round(savedMeal.meal.macronutrients.fat)}{" "}
                      ג'
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50"
                      onClick={() => removeSavedMeal(savedMeal.id)}
                    >
                      <Trash2 size={16} className="ms-2" />
                      הסר
                    </Button>
                    <Button
                      type="button"
                      className="rounded-full px-5"
                      onClick={() => onAddSavedMeal(savedMeal.id)}
                    >
                      <Heart size={16} className="ms-2" />
                      הוסף ליום הזה
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ModalShell>
  );
}
