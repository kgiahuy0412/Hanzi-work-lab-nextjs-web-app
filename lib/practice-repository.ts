import "server-only";

import { getLessonAccess } from "./lesson-access.ts";
import {
  practiceIndustries,
  practiceScenarios,
  type PracticeIndustry,
  type PracticeScenarioDto,
} from "./practice-content.ts";

export type PracticeCatalog = {
  industries: PracticeIndustry[];
  scenarios: PracticeScenarioDto[];
  hasVip: boolean;
};

/**
 * The catalogue is filtered on the server so paid exercise answers are never
 * serialized into the page for a learner without an active subscription.
 */
export async function getPracticeCatalog(userId: string | null): Promise<PracticeCatalog> {
  const vipAccess = await getLessonAccess({ isFree: false, userId });
  const hasVip = vipAccess.allowed && vipAccess.source === "vip";

  return {
    industries: practiceIndustries,
    hasVip,
    scenarios: practiceScenarios.map((scenario) => {
      const locked = !scenario.isFree && !hasVip;
      return {
        ...scenario,
        locked,
        exercises: locked ? null : scenario.exercises,
      };
    }),
  };
}
