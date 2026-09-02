import "server-only";
import { and, eq } from "drizzle-orm";
import { writeDb } from "../db/index.ts";
import { users } from "../db/schema.ts";

export async function updateUserAvatar(userId: string, avatar: { publicId: string; secureUrl: string }) {
  return writeDb((db) => db.transaction(async (tx) => {
    const existing = await tx
      .select({ avatarPublicId: users.avatarPublicId })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.isActive, true)))
      .limit(1);

    if (!existing[0]) return null;

    await tx
      .update(users)
      .set({
        avatarPublicId: avatar.publicId,
        avatarUrl: avatar.secureUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { avatarUrl: avatar.secureUrl, previousPublicId: existing[0].avatarPublicId };
  }));
}

