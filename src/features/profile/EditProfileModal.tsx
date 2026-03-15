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
          name: activeUser.name === "משתמש" ? "" : activeUser.name,
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

    reset({
      name: activeUser.name === "משתמש" ? "" : activeUser.name,
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
    updateProfileDetails(data);
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
