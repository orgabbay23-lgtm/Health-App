import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import type { MicronutrientTotals } from "../../../utils/nutrition-utils";
import type { UserProfile } from "../../../store";
import { NutrientGrid } from "./NutrientGrid";

interface FullNutritionAccordionProps {
  current: MicronutrientTotals;
  target: MicronutrientTotals;
  userProfile: UserProfile;
}

export function FullNutritionAccordion({
  current,
  target,
  userProfile,
}: FullNutritionAccordionProps) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="full-nutrition">
        <AccordionTrigger>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-950">
              ערכים תזונתיים מלאים
            </p>
            <p className="text-sm text-slate-500">
              ויטמינים ומינרלים נפתחים רק כשצריך, כדי לשמור על מסך בית נקי וברור.
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <NutrientGrid
            current={current}
            target={target}
            userProfile={userProfile}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
