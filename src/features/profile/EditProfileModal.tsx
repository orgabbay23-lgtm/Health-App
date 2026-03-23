import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { ModalShell } from "../../components/ui/modal-shell";
import { useActiveUser, useAppStore } from "../../store";
import { ProfileFormFields } from "./ProfileFormFields";
import {
  profileSchema,
  type ProfileFormValues,
} from "./profile-form-schema";
import { Loader2 } from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const activeUser = useActiveUser();
  const updateProfileDetails = useAppStore((state) => state.updateProfileDetails);
  const addWeightLog = useAppStore((state) => state.addWeightLog);
  const setActiveScreen = useAppStore((state) => state.setActiveScreen);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      age: 30,
      gender: "male",
      height: 170,
      weight: 70,
      activityLevel: "sedentary",
      goalDeficit: 500,
      isSmoker: false,
    },
  });

  // Reset form only once when modal opens or when profile data becomes available
  const profileExists = !!activeUser?.profile;
  useEffect(() => {
    if (isOpen && activeUser?.profile) {
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
    }
  }, [isOpen, profileExists, reset]); // Added profileExists to ensure data loads if it arrives late

  if (!activeUser?.profile) {
    return null;
  }

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const weightChanged = activeUser?.profile && data.weight !== activeUser.profile.weight;
      await updateProfileDetails(data);
      
      if (weightChanged) {
        // Explicitly add to weight history since the SQL trigger was removed
        // Passing 'true' skips the reverse profile update to prevent double-saving & double-toasts
        await addWeightLog(data.weight, undefined, true);
      }
      
      onClose();
      
      if (weightChanged) {
        // Small delay to allow the modal to close smoothly before rendering the graph
        setTimeout(() => setActiveScreen("weight"), 150);
      }
    } catch (error) {
      console.error("Failed to update profile", error);
    }
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
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button type="submit" className="rounded-full px-5" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                שומר...
              </span>
            ) : (
              "שמירת שינויים"
            )}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

