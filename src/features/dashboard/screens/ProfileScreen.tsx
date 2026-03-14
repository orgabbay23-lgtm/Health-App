import { Settings2 } from "lucide-react";
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
  const profileRows = [
    { label: "גיל", value: String(userProfile.age) },
    { label: "מגדר", value: userProfile.gender === "female" ? "נקבה" : "זכר" },
    { label: 'גובה', value: `${userProfile.height} ס"מ` },
    { label: 'משקל', value: `${userProfile.weight} ק"ג` },
    {
      label: "יעד",
      value:
        userProfile.goalDeficit > 0
          ? `גרעון של ${userProfile.goalDeficit} קק"ל`
          : "שמירה על המשקל",
    },
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
    <div className="space-y-5">
      <Card className="overflow-hidden border-white/70 bg-[linear-gradient(150deg,_rgba(255,255,255,0.96),_rgba(250,245,235,0.95))] shadow-[0_28px_72px_rgba(15,23,42,0.08)]">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <UserAvatar
                name={activeUser.name}
                accent={activeUser.accent}
                size="lg"
              />
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                  PROFILE
                </p>
                <h2 className="text-3xl font-semibold text-slate-950">
                  {activeUser.name}
                </h2>
                <p className="text-sm text-slate-500">
                  יעדים קליניים, פרטים אישיים וניהול משתמשים במקום אחד.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" className="rounded-full" onClick={onEditProfile}>
                <Settings2 size={16} className="ms-2" />
                עריכת פרופיל
              </Button>
            </div>          </div>

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

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-white/70 bg-white/90 shadow-[0_22px_56px_rgba(15,23,42,0.06)]">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-slate-950">פרטים אישיים</h3>
              <p className="text-sm text-slate-500">
                הנתונים שמזינים את כל החישובים הקליניים.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {profileRows.map((row) => (
                <ProfileRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90 shadow-[0_22px_56px_rgba(15,23,42,0.06)]">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-slate-950">יעדי מאקרו</h3>
              <p className="text-sm text-slate-500">
                כל יעד כולל טיפ מותאם אישית לפי גיל, מגדר ומטרה.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {targetRows.map((row) => (
                <div
                  key={row.nutrient}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold tracking-[0.14em] text-slate-400">
                        {NUTRIENT_META[row.nutrient].label}
                      </p>
                      <p className="text-sm font-medium text-slate-800">{row.value}</p>
                    </div>
                    <TipPopover
                      content={generateNutritionalTip(row.nutrient, userProfile)}
                      label={`טיפ עבור ${NUTRIENT_META[row.nutrient].label}`}
                    />
                  </div>
                </div>
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
    <div className="rounded-[24px] border border-white/70 bg-white/92 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
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
