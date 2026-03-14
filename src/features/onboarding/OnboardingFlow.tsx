import { type ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useAppStore } from "../../store";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";

const onboardingSchema = z.object({
  age: z.number().min(15).max(120),
  gender: z.enum(["male", "female"]),
  height: z.number().min(100).max(250),
  weight: z.number().min(30).max(300),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  goalDeficit: z.number().min(0).max(1000),
  isSmoker: z.boolean(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

interface BooleanToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  helperText?: string;
}

function BooleanToggleField({
  label,
  value,
  onChange,
  helperText,
}: BooleanToggleFieldProps) {
  return (
    <div className="space-y-3 rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={value ? "default" : "outline"}
          className="rounded-full"
          onClick={() => onChange(true)}
        >
          כן
        </Button>
        <Button
          type="button"
          variant={value ? "outline" : "default"}
          className="rounded-full"
          onClick={() => onChange(false)}
        >
          לא
        </Button>
      </div>
      {helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const setUserProfile = useAppStore((state) => state.setUserProfile);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      gender: "male",
      activityLevel: "sedentary",
      goalDeficit: 500,
      isSmoker: false,
    },
  });

  const goToSecondStep = async () => {
    const isValid = await trigger(["age", "gender", "height", "weight"]);
    if (isValid) {
      setStep(2);
    }
  };

  const onSubmit = (data: OnboardingFormValues) => {
    setUserProfile(data);
  };

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#edf4fb_52%,_#f8fafc_100%)] px-4 py-8 text-right"
      dir="rtl"
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden rounded-[38px] border-white/65 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(240,249,255,0.92))] shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
            <CardContent className="space-y-8 p-8 md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-sky-700">
                <Sparkles size={14} />
                PERSONALIZED START
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">
                  מערכת תזונה שנבנית סביבך
                </h1>
                <p className="max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                  כמה פרטים ביומטריים קצרים, והאפליקציה תחשב עבורך יעדי קלוריות,
                  חלבון ומיקרונוטריינטים עם מגבלות בטיחות ושעון לוגי של 3AM.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FeaturePill label="Mifflin-St Jeor" />
                <FeaturePill label="Clinical floors" />
                <FeaturePill label="Micronutrient targets" />
                <FeaturePill label="RTL premium UI" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
        >
          <Card className="rounded-[38px] border-white/65 bg-white/92 shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
            <CardContent className="space-y-8 p-8 md:p-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                      STEP {step}/2
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      {step === 1 ? "פרטים בסיסיים" : "מטרות והרגלים"}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className={`h-2.5 w-14 rounded-full ${
                          item <= step ? "bg-slate-950" : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {step === 1 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="גיל" error={errors.age?.message}>
                      <Input
                        id="age"
                        type="number"
                        {...register("age", { valueAsNumber: true })}
                        placeholder="30"
                        className="rounded-2xl border-slate-200 bg-white"
                      />
                    </Field>

                    <Field label="מגדר">
                      <Select
                        id="gender"
                        className="rounded-2xl border-slate-200 bg-white text-right"
                        {...register("gender")}
                      >
                        <option value="male">זכר</option>
                        <option value="female">נקבה</option>
                      </Select>
                    </Field>

                    <Field label="גובה (ס״מ)" error={errors.height?.message}>
                      <Input
                        id="height"
                        type="number"
                        {...register("height", { valueAsNumber: true })}
                        placeholder="175"
                        className="rounded-2xl border-slate-200 bg-white"
                      />
                    </Field>

                    <Field label="משקל (ק״ג)" error={errors.weight?.message}>
                      <Input
                        id="weight"
                        type="number"
                        {...register("weight", { valueAsNumber: true })}
                        placeholder="70"
                        className="rounded-2xl border-slate-200 bg-white"
                      />
                    </Field>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="רמת פעילות">
                        <Select
                          id="activityLevel"
                          className="rounded-2xl border-slate-200 bg-white text-right"
                          {...register("activityLevel")}
                        >
                          <option value="sedentary">
                            יושבני, כמעט ללא פעילות
                          </option>
                          <option value="light">
                            פעילות קלה, 1-3 פעמים בשבוע
                          </option>
                          <option value="moderate">
                            פעילות בינונית, 3-5 פעמים בשבוע
                          </option>
                          <option value="active">
                            פעיל מאוד, 6-7 פעמים בשבוע
                          </option>
                          <option value="very_active">
                            פעילות אינטנסיבית או עבודה פיזית
                          </option>
                        </Select>
                      </Field>

                      <Field label="יעד גרעון קלורי">
                        <Select
                          id="goalDeficit"
                          className="rounded-2xl border-slate-200 bg-white text-right"
                          {...register("goalDeficit", { valueAsNumber: true })}
                        >
                          <option value="0">שמירה על המשקל</option>
                          <option value="300">
                            ירידה קלה, גרעון של 300 קק"ל
                          </option>
                          <option value="500">
                            ירידה מתונה, גרעון של 500 קק"ל
                          </option>
                          <option value="800">
                            ירידה מהירה, גרעון של 800 קק"ל
                          </option>
                        </Select>
                      </Field>
                    </div>

                    <Controller
                      control={control}
                      name="isSmoker"
                      render={({ field }) => (
                        <BooleanToggleField
                          label="מעשן"
                          value={field.value}
                          onChange={field.onChange}
                          helperText="הבחירה הזו משפיעה ישירות על יעד ויטמין C."
                        />
                      )}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {step === 2 ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={() => setStep(1)}
                    >
                      <ArrowRight size={16} className="ms-2" />
                      חזור
                    </Button>
                  ) : null}

                  {step === 1 ? (
                    <Button
                      type="button"
                      className="w-full rounded-full"
                      onClick={goToSecondStep}
                    >
                      <ArrowLeft size={16} className="ms-2" />
                      המשך
                    </Button>
                  ) : (
                    <Button type="submit" className="w-full rounded-full">
                      שמור והתחל
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function FeaturePill({ label }: { label: string }) {
  return (
    <div className="rounded-[22px] border border-white/75 bg-white/85 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
      {label}
    </div>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2 rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <Label>{label}</Label>
      {children}
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </div>
  );
}
