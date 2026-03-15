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
          <div className="flex items-center gap-3">
            <p className="text-xl font-black text-slate-950">
              ערכים תזונתיים
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-8 pb-8">
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
