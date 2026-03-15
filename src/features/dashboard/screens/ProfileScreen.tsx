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
      <Card className="overflow-hidden border-none bg-white/40 backdrop-blur-md shadow-soft-xl rounded-[2.5rem]">
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
                   <span className="text-xs font-bold text-slate-400 uppercase bg-white/50 px-3 py-1 rounded-full">{loggedDaysCount} ימי רישום</span>
                   <span className="text-xs font-bold text-slate-400 uppercase bg-white/50 px-3 py-1 rounded-full">{savedMealsCount} מועדפים</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" className="rounded-2xl h-11 px-6 bg-slate-950 shadow-lg" onClick={onEditProfile}>
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
              label="BMR"
              value={`${formatNutritionValue(userProfile.targets.calculations.bmr)}`}
            />
            <ProfileStat
              label="TDEE"
              value={`${formatNutritionValue(userProfile.targets.calculations.tdee)}`}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="border-none bg-white/60 backdrop-blur-sm shadow-soft-lg rounded-[2rem]">
          <CardContent className="space-y-6 p-8">
            <h3 className="text-xl font-bold text-slate-900">נתונים אישיים</h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {profileRows.map((row) => (
                <ProfileRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/60 backdrop-blur-sm shadow-soft-lg rounded-[2rem]">
          <CardContent className="space-y-6 p-8">
            <h3 className="text-xl font-bold text-slate-900">יעדים קליניים</h3>
            <div className="grid gap-4 grid-cols-2">
              {targetRows.map((row) => (
                <div
                  key={row.nutrient}
                  className="rounded-3xl border border-white bg-white/50 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {NUTRIENT_META[row.nutrient].label}
                      </p>
                      <p className="text-lg font-bold text-slate-900">{row.value}</p>
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
    <div className="rounded-[1.5rem] border border-white bg-white/80 p-5 shadow-sm">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">קק"ל / יום</p>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white bg-white/40 p-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}
