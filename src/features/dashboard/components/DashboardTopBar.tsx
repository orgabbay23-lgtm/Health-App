import { LogOut, Plus, Settings2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { supabase } from "../../../lib/supabase";
import { UserAvatar } from "../../users/UserAvatar";
import type { UserAccentToken } from "../../../store";

interface DashboardTopBarProps {
  activeUser: {
    name: string;
    accent: UserAccentToken;
  };
  selectedDayKey: string;
  onOpenMealModal: () => void;
  onOpenProfileModal: () => void;
}

export function DashboardTopBar({
  activeUser,
  selectedDayKey,
  onOpenMealModal,
  onOpenProfileModal,
}: DashboardTopBarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Card className="border-white/70 bg-white/88 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar name={activeUser.name} accent={activeUser.accent} size="md" />
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-950">
                {activeUser.name || "טוען..."}
              </h1>
              <p className="text-sm text-slate-500" dir="ltr">
                {selectedDayKey}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut size={16} className="ms-2" />
              התנתק
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={onOpenProfileModal}
            >
              <Settings2 size={16} className="ms-2" />
              פרופיל
            </Button>
            <Button
              type="button"
              className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
              onClick={onOpenMealModal}
            >
              <Plus size={16} className="ms-2" />
              ארוחה
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
