import { Settings2, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { formatNutritionValue } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";

interface ProfileScreenProps {
  userProfile: UserProfile;
  savedMealsCount: number;
  loggedDaysCount: number;
  onEditProfile: () => void;
}

export function ProfileScreen({
  userProfile,
  savedMealsCount,
  loggedDaysCount,
  onEditProfile,
}: ProfileScreenProps) {
  const profileRows = [
    { label: "גיל", value: String(userProfile.age) },
    { label: "מגדר", value: userProfile.gender === "female" ? "נקבה" : "זכר" },
    { label: "גובה", value: `${userProfile.height} ס"מ` },
    { label: "משקל", value: `${userProfile.weight} ק"ג` },
    {
      label: "מטרה",
      value:
        userProfile.goalDeficit > 0
          ? `גרעון של ${userProfile.goalDeficit} קק"ל`
          : "שמירה",
    },
    { label: "עישון", value: userProfile.isSmoker ? "כן" : "לא" },
  ];

  const targetRows = [
    {
      label: "קלוריות",
      value: `${formatNutritionValue(userProfile.targets.calories)} קק"ל`,
    },
    {
      label: "חלבון",
      value: `${formatNutritionValue(userProfile.targets.protein)} ג'`,
    },
    {
      label: "פחמימות",
      value: `${formatNutritionValue(userProfile.targets.carbs)} ג'`,
    },
    {
      label: "שומן",
      value: `${formatNutritionValue(userProfile.targets.fat)} ג'`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[34px] border-white/55 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
        <CardContent className="grid gap-8 p-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white">
              PROFILE
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold text-slate-950 md:text-4xl">
                פרופיל קליני ונקודות בקרה
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                כאן מרוכזים הפרטים האישיים שמזינים את כל החישובים הקליניים, כולל
                רצפות בטיחות, חלבון מותאם, ויעדי מיקרונוטריינטים.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ProfileStat label="ימים מתועדים" value={String(loggedDaysCount)} />
            <ProfileStat label="מועדפים" value={String(savedMealsCount)} />
            <ProfileStat
              label="BMR"
              value={`${formatNutritionValue(userProfile.targets.calculations.bmr)} קק"ל`}
            />
            <ProfileStat
              label="TDEE"
              value={`${formatNutritionValue(userProfile.targets.calculations.tdee)} קק"ל`}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="rounded-[30px] border-white/60 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                  <UserRound size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    פרטי משתמש
                  </h3>
                  <p className="text-sm text-slate-500">
                    הנתונים שמזינים את האלגוריתם
                  </p>
                </div>
              </div>

              <Button
                type="button"
                className="rounded-full"
                onClick={onEditProfile}
              >
                <Settings2 size={16} className="ms-2" />
                ערוך פרופיל
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profileRows.map((row) => (
                <ProfileRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-white/60 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  יעדי בסיס ומנגנוני בטיחות
                </h3>
                <p className="text-sm text-slate-500">
                  המספרים הקריטיים שהמערכת שומרת עליהם
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {targetRows.map((row) => (
                <ProfileRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                />
              ))}
              <ProfileRow
                label="רצפה קלינית"
                value={`${formatNutritionValue(userProfile.targets.calculations.clinicalCalorieFloor)} קק"ל`}
              />
              <ProfileRow
                label="משקל ייחוס"
                value={`${formatNutritionValue(userProfile.targets.calculations.referenceWeight)} ק"ג`}
              />
            </div>

            {userProfile.targets.guidanceFlags.length > 0 ? (
              <div className="space-y-3 rounded-[24px] bg-slate-50 p-4">
                {userProfile.targets.guidanceFlags.map((flag) => (
                  <div
                    key={flag}
                    className="rounded-2xl border border-white bg-white px-4 py-3 text-sm leading-6 text-slate-600"
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
    <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
