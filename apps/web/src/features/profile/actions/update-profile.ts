// File: apps/web/src/features/profile/actions/update-profile.ts
// Purpose: Server Action for editing profile fields. Uses
//          `auth.api.updateUser` rather than a direct repository write —
//          `name` is a Better Auth core field and `phone` is a Better
//          Auth additionalField (input: true), so Better Auth already
//          owns validation/persistence for both. Writing to the `user`
//          table directly here would create a second path mutating a
//          table Better Auth considers its own, risking the two falling
//          out of sync (e.g. session cache not reflecting the change).

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@credixa/auth";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "../schemas/update-profile-schema";

export type UpdateProfileActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<UpdateProfileActionResult> {
  const parsed = updateProfileSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Please fix the errors below" };
  }

  try {
    await auth.api.updateUser({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (message.includes("phone") || message.includes("unique")) {
      return { success: false, error: "This phone number is already in use." };
    }
    return {
      success: false,
      error: "We couldn't update your profile. Please try again.",
    };
  }

  // The dashboard header and profile page both render the user's name —
  // revalidate so they reflect the change immediately without a full
  // page reload.
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true };
}
