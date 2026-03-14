import { type ReactNode, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppStore } from "../../store";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ModalShell } from "../../components/ui/modal-shell";
import { Select } from "../../components/ui/select";

const profileSchema = z.object({
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

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
    <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
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

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const userProfile = useAppStore((state) => state.userProfile);
  const updateProfileDetails = useAppStore(
    (state) => state.updateProfileDetails,
  );

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      age: userProfile?.age,
      gender: userProfile?.gender,
      height: userProfile?.height,
      weight: userProfile?.weight,
      activityLevel: userProfile?.activityLevel,
      goalDeficit: userProfile?.goalDeficit,
      isSmoker: userProfile?.isSmoker ?? false,
    },
  });

  useEffect(() => {
    if (!userProfile || !isOpen) {
      return;
    }

    reset({
      age: userProfile.age,
      gender: userProfile.gender,
      height: userProfile.height,
      weight: userProfile.weight,
      activityLevel: userProfile.activityLevel,
      goalDeficit: userProfile.goalDeficit,
      isSmoker: userProfile.isSmoker,
    });
  }, [isOpen, reset, userProfile]);

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileDetails(data);
    onClose();
  };

  if (!userProfile) {
    return null;
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="עריכת פרופיל"
      description="כל שינוי יעדכן מחדש את כל היעדים הקליניים והמלצות המיקרונוטריינטים"
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="גיל" error={errors.age?.message}>
            <Input
              id="age"
              type="number"
              {...register("age", { valueAsNumber: true })}
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
              className="rounded-2xl border-slate-200 bg-white"
            />
          </Field>

          <Field label="משקל (ק״ג)" error={errors.weight?.message}>
            <Input
              id="weight"
              type="number"
              {...register("weight", { valueAsNumber: true })}
              className="rounded-2xl border-slate-200 bg-white"
            />
          </Field>

          <Field label="רמת פעילות">
            <Select
              id="activityLevel"
              className="rounded-2xl border-slate-200 bg-white text-right"
              {...register("activityLevel")}
            >
              <option value="sedentary">יושבני, כמעט ללא פעילות</option>
              <option value="light">פעילות קלה, 1-3 פעמים בשבוע</option>
              <option value="moderate">פעילות בינונית, 3-5 פעמים בשבוע</option>
              <option value="active">פעיל מאוד, 6-7 פעמים בשבוע</option>
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
              <option value="300">ירידה קלה, גרעון של 300 קק"ל</option>
              <option value="500">ירידה מתונה, גרעון של 500 קק"ל</option>
              <option value="800">ירידה מהירה, גרעון של 800 קק"ל</option>
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
              helperText="הבחירה הזו משפיעה על יעד ויטמין C."
            />
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" className="rounded-full px-5">
            שמור שינויים
          </Button>
        </div>
      </form>
    </ModalShell>
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
    <div className="space-y-2 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
      <Label>{label}</Label>
      {children}
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </div>
  );
}
