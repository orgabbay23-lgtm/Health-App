import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ModalShell } from "../../components/ui/modal-shell";
import {
  USER_ACCENT_TOKENS,
  useActiveUser,
  useAppStore,
  type UserAccentToken,
} from "../../store";
import { cn } from "../../utils/utils";
import { accentThemeMap } from "../users/user-theme";
import { ProfileFormFields } from "./ProfileFormFields";
import {
  profileSchema,
  type ProfileFormValues,
} from "./profile-form-schema";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const activeUser = useActiveUser();
  const updateProfileDetails = useAppStore((state) => state.updateProfileDetails);
  const updateActiveUserIdentity = useAppStore(
    (state) => state.updateActiveUserIdentity,
  );
  const [displayName, setDisplayName] = useState(activeUser?.name ?? "");
  const [accent, setAccent] = useState<UserAccentToken>(
    activeUser?.accent ?? USER_ACCENT_TOKENS[0],
  );

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: activeUser?.profile
      ? {
          age: activeUser.profile.age,
          gender: activeUser.profile.gender,
          height: activeUser.profile.height,
          weight: activeUser.profile.weight,
          activityLevel: activeUser.profile.activityLevel,
          goalDeficit: activeUser.profile.goalDeficit,
          isSmoker: activeUser.profile.isSmoker,
        }
      : undefined,
  });

  useEffect(() => {
    if (!activeUser || !isOpen || !activeUser.profile) {
      return;
    }

    setDisplayName(activeUser.name);
    setAccent(activeUser.accent);
    reset({
      age: activeUser.profile.age,
      gender: activeUser.profile.gender,
      height: activeUser.profile.height,
      weight: activeUser.profile.weight,
      activityLevel: activeUser.profile.activityLevel,
      goalDeficit: activeUser.profile.goalDeficit,
      isSmoker: activeUser.profile.isSmoker,
    });
  }, [activeUser, isOpen, reset]);

  if (!activeUser?.profile) {
    return null;
  }

  const onSubmit = (data: ProfileFormValues) => {
    updateActiveUserIdentity({
      name: displayName,
      accent,
    });
    updateProfileDetails(data);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="עריכת משתמש ופרופיל"
      description="העדכון ישפיע רק על המשתמש הפעיל וישמור על כל היסטוריית המזון והמועדפים שלו."
      className="max-w-4xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-2 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <label htmlFor="displayName" className="text-sm font-medium text-slate-700">
              שם להצגה
            </label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={24}
            />
          </div>

          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm font-medium text-slate-700">צבע מזהה</p>
            <div className="grid grid-cols-5 gap-3">
              {USER_ACCENT_TOKENS.map((token) => {
                const theme = accentThemeMap[token];
                const active = accent === token;

                return (
                  <button
                    key={token}
                    type="button"
                    className={cn(
                      "flex h-12 items-center justify-center rounded-2xl border transition",
                      theme.button,
                      active ? "ring-2 ring-slate-900 ring-offset-2" : "border-transparent",
                    )}
                    onClick={() => setAccent(token)}
                  >
                    {active ? <Check size={16} className="text-slate-900" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <ProfileFormFields
          register={register}
          control={control}
          errors={errors}
          tone="muted"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" className="rounded-full px-5">
            שמירת שינויים
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
