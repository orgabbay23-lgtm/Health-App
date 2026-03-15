import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { ModalShell } from "../../components/ui/modal-shell";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { useActiveUser, useAppStore } from "../../store";
import {
  activityLevelOptions,
  goalDeficitOptions,
  type ProfileFormValues,
} from "./profile-form-schema";
import { cn } from "../../utils/utils";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const activeUser = useActiveUser();
  const updateProfileDetails = useAppStore((state) => state.updateProfileDetails);

  const [draft, setDraft] = useState<ProfileFormValues | null>(null);

  useEffect(() => {
    if (isOpen && activeUser?.profile) {
      setDraft({
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
  }, [isOpen]); // Intentionally omitting activeUser to prevent overwriting user input on re-renders

  if (!activeUser?.profile || !draft) {
    return null;
  }

  const handleChange = (field: keyof ProfileFormValues, value: any) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft) {
      updateProfileDetails(draft);
      onClose();
    }
  };

  const containerClass = cn(
    "space-y-2 rounded-[24px] p-5 border border-slate-200 bg-slate-50/80"
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="עריכת פרופיל"
      description=""
      className="max-w-md"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-5">
          <div className={containerClass}>
            <Label>שם מלא</Label>
            <Input
              type="text"
              value={draft.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className={containerClass}>
              <Label>גיל</Label>
              <Input
                type="number"
                value={draft.age || ""}
                onChange={(e) => handleChange("age", Number(e.target.value))}
                required
                min={15}
                max={120}
              />
            </div>

            <div className={containerClass}>
              <Label>מגדר</Label>
              <Select
                className="text-right"
                value={draft.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
              >
                <option value="male">זכר</option>
                <option value="female">נקבה</option>
              </Select>
            </div>

            <div className={containerClass}>
              <Label>גובה (ס"מ)</Label>
              <Input
                type="number"
                value={draft.height || ""}
                onChange={(e) => handleChange("height", Number(e.target.value))}
                required
                min={100}
                max={250}
              />
            </div>

            <div className={containerClass}>
              <Label>משקל (ק"ג)</Label>
              <Input
                type="number"
                value={draft.weight || ""}
                onChange={(e) => handleChange("weight", Number(e.target.value))}
                required
                min={30}
                max={300}
              />
            </div>

            <div className={containerClass}>
              <Label>רמת פעילות</Label>
              <Select
                className="text-right"
                value={draft.activityLevel}
                onChange={(e) => handleChange("activityLevel", e.target.value)}
              >
                {activityLevelOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className={containerClass}>
              <Label>יעד גרעון קלורי</Label>
              <Select
                className="text-right"
                value={draft.goalDeficit}
                onChange={(e) => handleChange("goalDeficit", Number(e.target.value))}
              >
                {goalDeficitOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className={containerClass}>
            <Label>מעשן</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={draft.isSmoker ? "default" : "outline"}
                className="rounded-full"
                onClick={() => handleChange("isSmoker", true)}
              >
                כן
              </Button>
              <Button
                type="button"
                variant={draft.isSmoker ? "outline" : "default"}
                className="rounded-full"
                onClick={() => handleChange("isSmoker", false)}
              >
                לא
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              הבחירה הזו משפיעה ישירות על יעד ויטמין C.
            </p>
          </div>
        </div>

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
