export const LIFETIME_VIP_PLAN_CODE = "VIP_LIFETIME";
export const LIFETIME_VIP_STORAGE_DAYS = 3_650;

export function isLifetimeVipPlan(planCode: string): boolean {
  return planCode.trim().toUpperCase() === LIFETIME_VIP_PLAN_CODE;
}

export function vipPlanDurationLabel(planCode: string, durationDays: number): string {
  return isLifetimeVipPlan(planCode) ? "Vĩnh viễn" : `${durationDays} ngày`;
}

export function vipPlanAccessLabel(planCode: string, durationDays: number): string {
  return isLifetimeVipPlan(planCode) ? "Quyền truy cập vĩnh viễn" : `${durationDays} ngày sử dụng`;
}
