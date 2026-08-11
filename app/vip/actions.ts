"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUuid, valueString } from "@/lib/admin-content-validation";
import { getCurrentUser } from "@/lib/auth-session";
import { cancelVipActivationRequest, requestVipActivation } from "@/lib/vip-activation-request-service";

function loginForVip(): never {
  redirect("/login?returnTo=%2Fvip");
}

export async function requestVipActivationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) loginForVip();
  const planId = valueString(formData, "planId", 40);
  const userNote = valueString(formData, "userNote", 500);
  if (!isUuid(planId)) redirect("/vip?error=invalid_input");

  const result = await requestVipActivation({
    userId: user.id,
    planId,
    userNote,
    source: "vip_page",
  });
  if (!result.ok) redirect(`/vip?error=${result.error}`);
  revalidatePath("/vip");
  revalidatePath("/account");
  revalidatePath("/admin/subscriptions");
  redirect("/vip?success=requested");
}

export async function cancelVipActivationRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) loginForVip();
  const requestId = valueString(formData, "requestId", 40);
  const destination = valueString(formData, "returnTo", 20) === "account" ? "/account" : "/vip";
  if (!isUuid(requestId)) redirect(`${destination}?error=invalid_input`);

  const result = await cancelVipActivationRequest(requestId, user.id);
  if (!result.ok) redirect(`${destination}?error=${result.error}`);
  revalidatePath("/vip");
  revalidatePath("/account");
  revalidatePath("/admin/subscriptions");
  redirect(`${destination}?success=request_cancelled`);
}
