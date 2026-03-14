import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useActiveUser, useAppStore } from "../../store";
import { ProfileFormFields } from "../profile/ProfileFormFields";
import {
  profileSchema,
  type ProfileFormValues,
} from "../profile/profile-form-schema";
import { UserAvatar } from "../users/UserAvatar";

export function OnboardingFlow() {
  const activeUser = useActiveUser();
  const selectUser = useAppStore((state) => state.selectUser);
  const setUserProfile = useAppStore((state) => state.setUserProfile);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      age: 30,
      gender: "male",
      height: 170,
      weight: 70,
      activityLevel: "sedentary",
      goalDeficit: 500,
      isSmoker: false,
    },
  });

  if (!activeUser) {
    return null;
  }

  const onSubmit = (data: ProfileFormValues) => {
    setUserProfile(data);
  };

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,247,237,0.92),_rgba(255,255,255,0.95)_42%,_rgba(239,246,255,0.96)_78%),linear-gradient(180deg,_#faf6ef_0%,_#f8fafc_56%,_#edf6ff_100%)] px-4 py-8 text-right"
      dir="rtl"
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-white/70 bg-[linear-gradient(160deg,_rgba(255,255,255,0.95),_rgba(255,250,240,0.95))] shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
            <CardContent className="space-y-8 p-8 md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-slate-500 shadow-sm">
                <Sparkles size={14} />
                USER SETUP
              </div>

              <div className="flex items-center gap-4">
                <UserAvatar
                  name={activeUser.name}
                  accent={activeUser.accent}
                  size="lg"
                />
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">פרופיל נבחר</p>
                  <h1 className="text-3xl font-semibold text-slate-950">
                    {activeUser.name}
                  </h1>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-semibold leading-tight text-slate-950">
                  נגדיר בסיס קליני מדויק לפני שמתחילים לתעד
                </h2>
                <p className="text-sm leading-7 text-slate-600 md:text-base">
                  הפרטים כאן מזינים את יעדי הקלוריות, החלבון, המיקרונוטריינטים,
                  מנגנוני הבטיחות והלוגיקה של היום הפעיל עם גלגול 3:00 לפנות בוקר.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FeaturePill label="Gemini 3.0 Flash" />
                <FeaturePill label="Clinical formulas" />
                <FeaturePill label="AI logging" />
                <FeaturePill label="Multi-user ready" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-white/70 bg-white/92 shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
            <CardContent className="space-y-6 p-8 md:p-10">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                    PROFILE DETAILS
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-950">
                    משלימים את ההגדרה הראשונית
                  </h2>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => selectUser(null)}
                >
                  <ArrowRight size={16} className="ms-2" />
                  חזרה לבחירת משתמש
                </Button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <ProfileFormFields
                  register={register}
                  control={control}
                  errors={errors}
                  tone="soft"
                />

                <Button type="submit" className="w-full rounded-full">
                  שמירת פרופיל והמשך לאפליקציה
                </Button>
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
