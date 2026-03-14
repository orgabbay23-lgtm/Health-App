import { CalendarDays, Plus, Settings2, Users } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import type { UserData } from "../../../store";
import { UserAvatar } from "../../users/UserAvatar";

interface DashboardTopBarProps {
  activeUser: UserData;
  selectedDayKey: string;
  onOpenMealModal: () => void;
  onOpenProfileModal: () => void;
  onSwitchUser: () => void;
}

export function DashboardTopBar({
  activeUser,
  selectedDayKey,
  onOpenMealModal,
  onOpenProfileModal,
  onSwitchUser,
}: DashboardTopBarProps) {
  return (
    <Card className="border-white/70 bg-white/88 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar name={activeUser.name} accent={activeUser.accent} size="md" />
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                ACTIVE PROFILE
              </p>
              <h1 className="text-2xl font-semibold text-slate-950">
                {activeUser.name}
              </h1>
              <p className="text-sm text-slate-500">
                היום הנבחר לרישום: <span dir="ltr">{selectedDayKey}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={onSwitchUser}
            >
              <Users size={16} className="ms-2" />
              החלפת משתמש
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={onOpenProfileModal}
            >
              <Settings2 size={16} className="ms-2" />
              עריכת פרופיל
            </Button>
            <Button
              type="button"
              className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
              onClick={onOpenMealModal}
            >
              <Plus size={16} className="ms-2" />
              הוספת ארוחה
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
            <CalendarDays size={15} />
            היסטוריה נשמרת לפי מפתח יומי `YYYY-MM-DD`
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
            גלגול יום לוגי פעיל בשעה 03:00
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
