import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/button";
import { ModalShell } from "../../components/ui/modal-shell";
import {
  useActiveUser,
  useAppStore,
} from "../../store";
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
  const updateProfileName = useAppStore((state) => state.updateProfileName);

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: activeUser
      ? {
          name: activeUser.name,
          age: activeUser.profile?.age ?? 30,
          gender: activeUser.profile?.gender ?? "male",
          height: activeUser.profile?.height ?? 170,
          weight: activeUser.profile?.weight ?? 70,
          activityLevel: activeUser.profile?.activityLevel ?? "sedentary",
          goalDeficit: activeUser.profile?.goalDeficit ?? 500,
          isSmoker: activeUser.profile?.isSmoker ?? false,
        }
      : undefined,
  });

  useEffect(() => {
    if (!activeUser || !isOpen) {
      return;
    }

    reset({
      name: activeUser.name,
      age: activeUser.profile?.age ?? 30,
      gender: activeUser.profile?.gender ?? "male",
      height: activeUser.profile?.height ?? 170,
      weight: activeUser.profile?.weight ?? 70,
      activityLevel: activeUser.profile?.activityLevel ?? "sedentary",
      goalDeficit: activeUser.profile?.goalDeficit ?? 500,
      isSmoker: activeUser.profile?.isSmoker ?? false,
    });
  }, [activeUser, isOpen, reset]);

  if (!activeUser) {
    return null;
  }

  const onSubmit = async (data: ProfileFormValues) => {
    const { name, ...details } = data;
    await updateProfileName(name);
    await updateProfileDetails(details);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="עריכת פרופיל"
      description=""
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
