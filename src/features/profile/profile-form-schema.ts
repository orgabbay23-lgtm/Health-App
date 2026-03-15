import * as z from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "השם חייב להכיל לפחות 2 תווים").max(50),
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

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const activityLevelOptions = [
  {
    value: "sedentary",
    label: "יושבני, כמעט ללא פעילות",
  },
  {
    value: "light",
    label: "פעילות קלה, 1-3 פעמים בשבוע",
  },
  {
    value: "moderate",
    label: "פעילות בינונית, 3-5 פעמים בשבוע",
  },
  {
    value: "active",
    label: "פעיל מאוד, 6-7 פעמים בשבוע",
  },
  {
    value: "very_active",
    label: "פעילות אינטנסיבית או עבודה פיזית",
  },
] as const;

export const goalDeficitOptions = [
  {
    value: 0,
    label: "שמירה על המשקל",
  },
  {
    value: 300,
    label: "ירידה קלה, גרעון של 300 קק\"ל",
  },
  {
    value: 500,
    label: "ירידה מתונה, גרעון של 500 קק\"ל",
  },
  {
    value: 800,
    label: "ירידה מהירה, גרעון של 800 קק\"ל",
  },
] as const;
