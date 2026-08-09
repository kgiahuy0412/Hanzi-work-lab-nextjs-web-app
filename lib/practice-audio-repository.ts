import "server-only";

import { and, eq } from "drizzle-orm";
import { readDb } from "../db/index.ts";
import {
  practiceAudioAssets,
  practiceExercises,
  practiceIndustries,
  practiceScenarios,
} from "../db/schema.ts";
import { hasActiveVipAccess } from "./lesson-access.ts";
import type { AuthenticatedUser } from "./auth-service.ts";
import { isPracticeStaffRole } from "./practice-workflow.ts";

export type PracticeAudioPayload = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  content: Uint8Array | null;
  cloudinarySecureUrl: string | null;
  publicCache: boolean;
};

export async function getPracticeAudioPayload(assetId: string, user: AuthenticatedUser | null): Promise<PracticeAudioPayload | null> {
  const references = await readDb((db) => db.select({
    id: practiceAudioAssets.id,
    originalName: practiceAudioAssets.originalName,
    mimeType: practiceAudioAssets.mimeType,
    sizeBytes: practiceAudioAssets.sizeBytes,
    durationMs: practiceAudioAssets.durationMs,
    cloudinarySecureUrl: practiceAudioAssets.cloudinarySecureUrl,
    isFree: practiceScenarios.isFree,
    scenarioStatus: practiceScenarios.status,
    industryStatus: practiceIndustries.status,
    audioReviewStatus: practiceExercises.audioReviewStatus,
  }).from(practiceAudioAssets)
    .innerJoin(practiceExercises, eq(practiceExercises.audioAssetId, practiceAudioAssets.id))
    .innerJoin(practiceScenarios, eq(practiceExercises.scenarioId, practiceScenarios.id))
    .innerJoin(practiceIndustries, eq(practiceScenarios.industryId, practiceIndustries.id))
    .where(eq(practiceAudioAssets.id, assetId)));
  const asset = references[0];
  if (!asset) return null;

  const publishedReferences = references.filter((reference) => (
    reference.scenarioStatus === "published"
    && reference.industryStatus === "published"
    && reference.audioReviewStatus === "approved"
  ));
  const publicCache = publishedReferences.some((reference) => reference.isFree);
  const staffAllowed = isPracticeStaffRole(user?.role);
  const vipAllowed = !publicCache && Boolean(user) && publishedReferences.length > 0
    ? await hasActiveVipAccess(user!.id)
    : false;
  if (!staffAllowed && !publicCache && !vipAllowed) return null;

  if (asset.cloudinarySecureUrl) return { ...asset, content: null, publicCache };
  const contentRows = await readDb((db) => db.select({ content: practiceAudioAssets.content })
    .from(practiceAudioAssets)
    .where(and(eq(practiceAudioAssets.id, assetId), eq(practiceAudioAssets.sizeBytes, asset.sizeBytes)))
    .limit(1));
  if (!contentRows[0]?.content) return null;
  return { ...asset, content: contentRows[0].content, publicCache };
}
