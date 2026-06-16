import { Settings2, LogOut } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { TipPopover } from "../../../components/ui/tip-popover";
import {
  NUTRIENT_META,
  generateNutritionalTip,
} from "../../../utils/nutritional-tips";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import type { UserData, UserProfile } from "../../../store";
import { UserAvatar } from "../../users/UserAvatar";
import { supabase } from "../../../lib/supabase";
import { clearCachedApiKey } from "../../../utils/gemini";
import { cn } from "../../../utils/utils";

const TARGET_TINT: Record<"calories" | "protein" | "carbs" | "fat", { card: string; label: string }> = {
  calories: { card: "from-sky-50/90 border-sky-100/80", label: "text-sky-600" },
  protein: { card: "from-orange-50/90 border-orange-100/80", label: "text-orange-600" },
  carbs: { card: "from-emerald-50/90 border-emerald-100/80", label: "text-emerald-600" },
  fat: { card: "from-amber-50/90 border-amber-100/80", label: "text-amber-600" },
};

interface ProfileScreenProps {
  userProfile: UserProfile;
  activeUser: UserData;
  savedMealsCount: number;
  loggedDaysCount: number;
  onEditProfile: () => void;
}

export function ProfileScreen({
  userProfile,
  activeUser,
  savedMealsCount,
  loggedDaysCount,
  onEditProfile,
}: ProfileScreenProps) {
  const handleLogout = async () => {
    clearCachedApiKey();
    await supabase.auth.signOut();
  };

  const profileRows = [
    { label: "גיל", value: String(userProfile.age) },
    { label: "מגדר", value: userProfile.gender === "female" ? "נקבה" : "זכר" },
    { label: 'גובה', value: `${userProfile.height} ס"מ` },
    { label: 'משקל', value: `${userProfile.weight} ק"ג` },
    { label: "יעד", value: userProfile.goalDeficit > 0 ? `${userProfile.goalDeficit} קק"ל` : "שמירה" },
    { label: "עישון", value: userProfile.isSmoker ? "כן" : "לא" },
  ];

  const targetRows = [
    {
      nutrient: "calories" as const,
      value: `${formatNutritionValue(userProfile.targets.calories)} ${NUTRIENT_META.calories.unit}`,
    },
    {
      nutrient: "protein" as const,
      value: `${formatNutritionValue(userProfile.targets.protein)} ${NUTRIENT_META.protein.unit}`,
    },
    {
      nutrient: "carbs" as const,
      value: `${formatNutritionValue(userProfile.targets.carbs)} ${NUTRIENT_META.carbs.unit}`,
    },
    {
      nutrient: "fat" as const,
      value: `${formatNutritionValue(userProfile.targets.fat)} ${NUTRIENT_META.fat.unit}`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="specular border border-white/60 bg-gradient-to-b from-white/60 to-white/40 backdrop-blur-md shadow-premium-lg rounded-[2.5rem]">
        <CardContent className="grid gap-8 p-8 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-5">
              <UserAvatar
                name={activeUser.name}
                accent={activeUser.accent}
                size="lg"
                className="h-20 w-20 ring-4 ring-white shadow-md"
              />
              <div className="space-y-0.5">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  {activeUser.name}
                </h2>
                <div className="flex gap-2">
                   <span className="text-[13px] font-bold text-slate-500 uppercase bg-white/50 px-3 py-1 rounded-full">{loggedDaysCount} ימי רישום</span>
                   <span className="text-[13px] font-bold text-slate-500 uppercase bg-white/50 px-3 py-1 rounded-full">{savedMealsCount} מועדפים</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" className="rounded-2xl h-11 px-6 shadow-lg" onClick={onEditProfile}>
                <Settings2 size={18} className="ms-2" />
                עריכת פרופיל
              </Button>
              <Button type="button" variant="outline" className="rounded-2xl h-11 px-6 border-slate-200 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleLogout}>
                <LogOut size={18} className="ms-2" />
                התנתקות
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[240px]">
            <ProfileStat
              label="חילוף חומרים בסיסי"
              value={`${formatNutritionValue(userProfile.targets.calculations.bmr)}`}
            />
            <ProfileStat
              label="הוצאה יומית כוללת"
              value={`${formatNutritionValue(userProfile.targets.calculations.tdee)}`}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="specular border border-white/60 bg-white/55 backdrop-blur-sm shadow-premium rounded-[2rem]">
          <CardContent className="space-y-6 p-8">
            <h3 className="flex items-center gap-2.5 text-xl font-black text-slate-900">
              <span className="h-5 w-1.5 rounded-full bg-gradient-to-b from-sky-500 to-indigo-500" />
              נתונים אישיים
            </h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {profileRows.map((row) => (
                <ProfileRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="specular border border-white/60 bg-white/55 backdrop-blur-sm shadow-premium rounded-[2rem]">
          <CardContent className="space-y-6 p-8">
            <h3 className="flex items-center gap-2.5 text-xl font-black text-slate-900">
              <span className="h-5 w-1.5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
              יעדים קליניים
            </h3>
            <div className="grid gap-4 grid-cols-2">
              {targetRows.map((row) => (
                <div
                  key={row.nutrient}
                  className={cn(
                    "specular rounded-3xl border bg-gradient-to-b to-white/70 p-5 shadow-premium",
                    TARGET_TINT[row.nutrient].card,
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className={cn("text-[13px] font-black uppercase tracking-widest", TARGET_TINT[row.nutrient].label)}>
                        {NUTRIENT_META[row.nutrient].label}
                      </p>
                      <p className="text-lg font-black text-slate-900">{row.value}</p>
                    </div>
                    <TipPopover
                      content={generateNutritionalTip(row.nutrient, userProfile)}
                      label={`טיפ עבור ${NUTRIENT_META[row.nutrient].label}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {userProfile.targets.guidanceFlags.length > 0 ? (
              <div className="space-y-2">
                {userProfile.targets.guidanceFlags.map((flag) => (
                  <div
                    key={flag}
                    className="rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-3 text-sm font-medium text-blue-700"
                  >
                    {flag}
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="specular rounded-[1.5rem] border border-white/70 bg-gradient-to-b from-indigo-50/80 to-white/70 p-5 shadow-premium">
      <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tighter bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">{value}</p>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">קק"ל / יום</p>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white bg-white/40 p-4">
      <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}
