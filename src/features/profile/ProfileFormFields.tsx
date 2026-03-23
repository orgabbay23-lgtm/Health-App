import type { ReactNode } from "react";
import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { cn } from "../../utils/utils";
import {
  activityLevelOptions,
  goalDeficitOptions,
  type ProfileFormValues,
} from "./profile-form-schema";

interface ProfileFormFieldsProps {
  register: UseFormRegister<ProfileFormValues>;
  control: Control<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  tone?: "soft" | "muted";
}

interface FieldShellProps {
  label: string;
  children: ReactNode;
  error?: string;
  tone: "soft" | "muted";
}

interface BooleanChoiceFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  helperText?: string;
  tone: "soft" | "muted";
}

export function ProfileFormFields({
  register,
  control,
  errors,
  tone = "soft",
}: ProfileFormFieldsProps) {
  return (
    <div className="space-y-5">
      <FieldShell label="שם מלא" error={errors.name?.message} tone={tone}>
        <Input
          id="name"
          type="text"
          onFocus={(e) => {
            const target = e.target;
            setTimeout(() => {
              target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 450);
          }}
          className="text-[16px]"
          {...register("name")}
        />
      </FieldShell>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FieldShell label="גיל" error={errors.age?.message} tone={tone}>
          <Input
            id="age"
            type="number"
            onFocus={(e) => {
              const target = e.target;
              setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 450);
            }}
            className="text-[16px]"
            {...register("age", { valueAsNumber: true })}
          />
        </FieldShell>

        <FieldShell label="מגדר" tone={tone}>
          <Select id="gender" className="text-right text-[16px]" {...register("gender")}>
            <option value="male">זכר</option>
            <option value="female">נקבה</option>
          </Select>
        </FieldShell>

        <FieldShell label='גובה (ס"מ)' error={errors.height?.message} tone={tone}>
          <Input
            id="height"
            type="number"
            step="any"
            inputMode="decimal"
            onFocus={(e) => {
              const target = e.target;
              setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 450);
            }}
            className="text-[16px]"
            {...register("height", { valueAsNumber: true })}
          />
        </FieldShell>

        <FieldShell label='משקל (ק"ג)' error={errors.weight?.message} tone={tone}>
          <Input
            id="weight"
            type="number"
            step="any"
            inputMode="decimal"
            onFocus={(e) => {
              const target = e.target;
              setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 450);
            }}
            className="text-[16px]"
            {...register("weight", { valueAsNumber: true })}
          />
        </FieldShell>

        <FieldShell label="רמת פעילות" tone={tone}>
          <Select
            id="activityLevel"
            className="text-right text-[16px]"
            {...register("activityLevel")}
          >
            {activityLevelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FieldShell>

        <FieldShell label="יעד גרעון קלורי" tone={tone}>
          <Select
            id="goalDeficit"
            className="text-right text-[16px]"
            {...register("goalDeficit", { valueAsNumber: true })}
          >
            {goalDeficitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FieldShell>
      </div>

      <Controller
        control={control}
        name="isSmoker"
        render={({ field }) => (
          <BooleanChoiceField
            label="מעשן"
            value={field.value}
            onChange={field.onChange}
            helperText="הבחירה הזו משפיעה ישירות על יעד ויטמין C."
            tone={tone}
          />
        )}
      />
    </div>
  );
}

function BooleanChoiceField({
  label,
  value,
  onChange,
  helperText,
  tone,
}: BooleanChoiceFieldProps) {
  return (
    <div className={containerClassName(tone)}>
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
      {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}

function FieldShell({ label, children, error, tone }: FieldShellProps) {
  return (
    <div className={containerClassName(tone)}>
      <Label>{label}</Label>
      {children}
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </div>
  );
}

function containerClassName(tone: "soft" | "muted") {
  return cn(
    "space-y-2 rounded-[24px] p-5",
    tone === "soft"
      ? "border border-white/70 bg-white/85 shadow-[0_14px_30px_rgba(15,23,42,0.06)]"
      : "border border-slate-200 bg-slate-50/80",
  );
}
