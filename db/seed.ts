import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { and, eq, isNull } from "drizzle-orm";
import { closeDb, getDb } from "./index.ts";
import {
  courses as courseTable,
  lessons as lessonTable,
  lessonVocabulary,
  modules,
  practiceAudioAssets,
  practiceExercises as practiceExerciseTable,
  practiceIndustries as practiceIndustryTable,
  practiceScenarios as practiceScenarioTable,
  vipPlans,
  vocabulary as vocabularyTable,
} from "./schema.ts";
import { courses } from "../lib/course-data.ts";
import { coreWorkplaceLessons, coreWorkplaceModules } from "../lib/core-workplace-course-seed.ts";
import { ecommerceLessons, ecommerceModules } from "../lib/ecommerce-course-seed.ts";
import { factoryLessons, factoryModules } from "../lib/factory-course-seed.ts";
import { highFrequencyLessons, highFrequencyModules } from "../lib/high-frequency-course-seed.ts";
import { logisticsLessons, logisticsModules } from "../lib/logistics-course-seed.ts";
import { officeLessons, officeModules } from "../lib/office-course-seed.ts";
import { getPracticeListeningStatement, getPracticeMeaningQuestion, practiceIndustries, practiceScenarios } from "../lib/practice-content.ts";
import { detectPracticeAudioMime } from "../lib/practice-audio-validation.ts";
import { restaurantLessons, restaurantModules } from "../lib/restaurant-course-seed.ts";
import { salesLessons, salesModules } from "../lib/sales-course-seed.ts";
import type { CourseSeedBundle } from "../lib/course-seed-types.ts";
import { LIFETIME_VIP_PLAN_CODE, LIFETIME_VIP_STORAGE_DAYS } from "../lib/vip-plan.ts";

const localEnvPath = resolve(process.cwd(), ".env.local");
if (existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);

const publishedAt = new Date();

type PracticeAudioManifestItem = {
  scenarioSlug: string;
  exerciseSlug: string;
  fileName: string;
  listeningText: string;
  isStatementCorrect: boolean;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  checksumSha256: string;
};

const practiceAudioDirectory = resolve(process.cwd(), "content", "practice-audio");
const practiceAudioManifestPath = resolve(practiceAudioDirectory, "manifest.json");
const practiceAudioManifest = existsSync(practiceAudioManifestPath)
  ? JSON.parse(readFileSync(practiceAudioManifestPath, "utf8")) as { items?: PracticeAudioManifestItem[] }
  : null;
const practiceAudioByExercise = new Map(
  (practiceAudioManifest?.items ?? []).map((item) => [item.exerciseSlug, item]),
);

const planSeeds = [
  { code: LIFETIME_VIP_PLAN_CODE, name: "VIP vĩnh viễn", durationDays: LIFETIME_VIP_STORAGE_DAYS, priceVnd: 1_090_000, discountPercent: 0, promotionLabel: null },
  { code: "VIP_1M", name: "VIP 1 tháng", durationDays: 30, priceVnd: 79_000, discountPercent: 0, promotionLabel: null },
  { code: "VIP_6M", name: "VIP 6 tháng", durationDays: 180, priceVnd: 329_000, discountPercent: 15, promotionLabel: "Tiết kiệm hơn theo kỳ 6 tháng" },
  { code: "VIP_12M", name: "VIP 1 năm", durationDays: 365, priceVnd: 549_000, discountPercent: 30, promotionLabel: "Ưu đãi tốt nhất trong năm" },
] as const;

const courseSeedBundles: CourseSeedBundle[] = [
  { courseSlug: "van-phong-hanh-chinh", modules: officeModules, lessons: officeLessons },
  { courseSlug: "nha-may-san-xuat", modules: factoryModules, lessons: factoryLessons },
  { courseSlug: "kho-van-logistics", modules: logisticsModules, lessons: logisticsLessons },
  { courseSlug: "ban-hang-cham-soc-khach-hang", modules: salesModules, lessons: salesLessons },
  { courseSlug: "nha-hang-dich-vu", modules: restaurantModules, lessons: restaurantLessons },
  { courseSlug: "thuong-mai-dien-tu", modules: ecommerceModules, lessons: ecommerceLessons },
  { courseSlug: "giao-tiep-cong-so", modules: coreWorkplaceModules, lessons: coreWorkplaceLessons },
  { courseSlug: "tieng-trung-tan-suat-cao", modules: highFrequencyModules, lessons: highFrequencyLessons },
];

const practiceIndustryImages: Record<string, string> = {
  office: "/assets/practice/office-progress-meeting.webp",
  factory: "/assets/courses/factory-production.webp",
  logistics: "/assets/courses/warehouse-logistics.webp",
  sales: "/assets/courses/sales-customer-care.webp",
  restaurant: "/assets/courses/restaurant-service.webp",
  ecommerce: "/assets/courses/ecommerce-operations.webp",
  core: "/assets/courses/workplace-communication.webp",
};

async function seed() {
  const db = getDb();
  let attachedPracticeAudioCount = 0;

  await db.transaction(async (tx) => {
    for (const [sortOrder, course] of courses.entries()) {
      await tx.insert(courseTable).values({
        slug: course.slug,
        titleVi: course.title,
        titleZh: course.chineseTitle,
        hanzi: course.hanzi,
        category: course.category,
        description: course.description,
        level: course.level,
        lessonCount: course.lessons,
        totalMinutes: course.minutes,
        freeLessonCount: course.freeLessons,
        themeColor: course.color,
        themeInk: course.ink,
        status: "published",
        sortOrder,
        publishedAt,
        updatedAt: publishedAt,
      }).onConflictDoUpdate({
        target: courseTable.slug,
        set: {
          titleVi: course.title,
          titleZh: course.chineseTitle,
          hanzi: course.hanzi,
          category: course.category,
          description: course.description,
          level: course.level,
          lessonCount: course.lessons,
          totalMinutes: course.minutes,
          freeLessonCount: course.freeLessons,
          themeColor: course.color,
          themeInk: course.ink,
          status: "published",
          sortOrder,
          publishedAt,
          updatedAt: publishedAt,
        },
      });
    }

    for (const plan of planSeeds) {
      await tx.insert(vipPlans).values({
        ...plan,
        benefits: ["Mở toàn bộ bài học", "Luyện tập không giới hạn", "Theo dõi tiến độ"],
      }).onConflictDoUpdate({
        target: vipPlans.code,
        set: {
          name: plan.name,
          durationDays: plan.durationDays,
          priceVnd: plan.priceVnd,
          discountPercent: plan.discountPercent,
          promotionLabel: plan.promotionLabel,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }

    for (const bundle of courseSeedBundles) {
      const [courseRow] = await tx
        .select({ id: courseTable.id })
        .from(courseTable)
        .where(eq(courseTable.slug, bundle.courseSlug))
        .limit(1);

      if (!courseRow) throw new Error(`Không tìm thấy lộ trình ${bundle.courseSlug} sau khi seed catalog.`);

      const moduleIds = new Map<string, string>();
      for (const [sortOrder, moduleSeed] of bundle.modules.entries()) {
        const [moduleRow] = await tx.insert(modules).values({
          courseId: courseRow.id,
          slug: moduleSeed.slug,
          title: moduleSeed.title,
          description: moduleSeed.description,
          sortOrder,
        }).onConflictDoUpdate({
          target: [modules.courseId, modules.slug],
          set: { title: moduleSeed.title, description: moduleSeed.description, sortOrder },
        }).returning({ id: modules.id });
        moduleIds.set(moduleSeed.slug, moduleRow.id);
      }

      const moduleLessonOrders = new Map<string, number>();
      for (const lesson of bundle.lessons) {
        const moduleId = moduleIds.get(lesson.moduleSlug);
        if (!moduleId) throw new Error(`Không tìm thấy module ${lesson.moduleSlug} cho bài ${lesson.slug}.`);
        const sortOrder = moduleLessonOrders.get(lesson.moduleSlug) ?? 0;
        moduleLessonOrders.set(lesson.moduleSlug, sortOrder + 1);
        const [lessonRow] = await tx.insert(lessonTable).values({
          moduleId,
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          situation: lesson.situation,
          estimatedMinutes: lesson.estimatedMinutes,
          isFree: lesson.isFree,
          status: "published",
          sortOrder,
          content: lesson.content,
          updatedAt: publishedAt,
        }).onConflictDoUpdate({
          target: [lessonTable.moduleId, lessonTable.slug],
          set: {
            title: lesson.title,
            summary: lesson.summary,
            situation: lesson.situation,
            estimatedMinutes: lesson.estimatedMinutes,
            isFree: lesson.isFree,
            status: "published",
            sortOrder,
            content: lesson.content,
            updatedAt: publishedAt,
          },
        }).returning({ id: lessonTable.id });

        for (const [vocabularyOrder, word] of lesson.vocabulary.entries()) {
          const tags = [bundle.courseSlug, lesson.slug];
          const [vocabularyRow] = await tx.insert(vocabularyTable).values({
            slug: word.slug,
            hanzi: word.hanzi,
            pinyin: word.pinyin,
            meaningVi: word.meaning,
            exampleZh: word.example,
            exampleVi: word.translation,
            audioUrl: word.audioUrl,
            tags,
            updatedAt: publishedAt,
          }).onConflictDoUpdate({
            target: vocabularyTable.slug,
            set: {
              hanzi: word.hanzi,
              pinyin: word.pinyin,
              meaningVi: word.meaning,
              exampleZh: word.example,
              exampleVi: word.translation,
              audioUrl: word.audioUrl,
              tags,
              updatedAt: publishedAt,
            },
          }).returning({ id: vocabularyTable.id });

          await tx.insert(lessonVocabulary).values({
            lessonId: lessonRow.id,
            vocabularyId: vocabularyRow.id,
            sortOrder: vocabularyOrder,
          }).onConflictDoUpdate({
            target: [lessonVocabulary.lessonId, lessonVocabulary.vocabularyId],
            set: { sortOrder: vocabularyOrder },
          });
        }
      }
    }

    const practiceIndustryIds = new Map<string, string>();
    for (const [sortOrder, industry] of practiceIndustries.entries()) {
      const [row] = await tx.insert(practiceIndustryTable).values({
        slug: industry.id,
        label: industry.label,
        description: industry.description,
        imageUrl: industry.imageUrl ?? practiceIndustryImages[industry.id] ?? null,
        status: "published",
        sortOrder,
        updatedAt: publishedAt,
      }).onConflictDoUpdate({
        target: practiceIndustryTable.slug,
        set: {
          label: industry.label,
          description: industry.description,
          imageUrl: industry.imageUrl ?? practiceIndustryImages[industry.id] ?? null,
          status: "published",
          sortOrder,
          updatedAt: publishedAt,
        },
      }).returning({ id: practiceIndustryTable.id });
      practiceIndustryIds.set(industry.id, row.id);
    }

    const practiceScenarioOrders = new Map<string, number>();
    for (const scenario of practiceScenarios) {
      const industryId = practiceIndustryIds.get(scenario.industry);
      if (!industryId) throw new Error(`Không tìm thấy nhóm Luyện ca ${scenario.industry}.`);
      const sortOrder = practiceScenarioOrders.get(scenario.industry) ?? 0;
      practiceScenarioOrders.set(scenario.industry, sortOrder + 1);
      const [scenarioRow] = await tx.insert(practiceScenarioTable).values({
        industryId,
        slug: scenario.id,
        title: scenario.title,
        brief: scenario.brief,
        context: scenario.context,
        durationMinutes: scenario.durationMinutes,
        level: scenario.level,
        isFree: scenario.isFree,
        sentenceZh: scenario.sentenceZh,
        pinyin: scenario.pinyin,
        translation: scenario.translation,
        focus: scenario.focus,
        status: "published",
        sortOrder,
        publishedAt,
        updatedAt: publishedAt,
      }).onConflictDoUpdate({
        target: practiceScenarioTable.slug,
        set: {
          industryId,
          title: scenario.title,
          brief: scenario.brief,
          context: scenario.context,
          durationMinutes: scenario.durationMinutes,
          level: scenario.level,
          isFree: scenario.isFree,
          sentenceZh: scenario.sentenceZh,
          pinyin: scenario.pinyin,
          translation: scenario.translation,
          focus: scenario.focus,
          status: "published",
          sortOrder,
          publishedAt,
          updatedAt: publishedAt,
        },
      }).returning({ id: practiceScenarioTable.id });

      for (const [exerciseOrder, exercise] of scenario.exercises.entries()) {
        const listeningStatement = getPracticeListeningStatement(exercise, scenario);
        const meaningQuestion = getPracticeMeaningQuestion(exercise);
        const [exerciseRow] = await tx.insert(practiceExerciseTable).values({
          scenarioId: scenarioRow.id,
          slug: exercise.id,
          eyebrow: exercise.eyebrow,
          prompt: exercise.prompt,
          chinese: exercise.chinese ?? null,
          listeningText: listeningStatement.text,
          isStatementCorrect: listeningStatement.isCorrect,
          audioUrl: exercise.audioUrl ?? null,
          audioReviewStatus: exercise.audioUrl ? "approved" : "pending",
          options: meaningQuestion.options,
          correctOption: meaningQuestion.correctOption,
          explanation: exercise.explanation,
          sortOrder: exerciseOrder,
          updatedAt: publishedAt,
        }).onConflictDoUpdate({
          target: [practiceExerciseTable.scenarioId, practiceExerciseTable.slug],
          set: {
            eyebrow: exercise.eyebrow,
            prompt: exercise.prompt,
            chinese: exercise.chinese ?? null,
            listeningText: listeningStatement.text,
            isStatementCorrect: listeningStatement.isCorrect,
            audioUrl: exercise.audioUrl ?? null,
            options: meaningQuestion.options,
            correctOption: meaningQuestion.correctOption,
            explanation: exercise.explanation,
            sortOrder: exerciseOrder,
            updatedAt: publishedAt,
          },
        }).returning({ id: practiceExerciseTable.id, audioAssetId: practiceExerciseTable.audioAssetId });

        const audioSeed = practiceAudioByExercise.get(exercise.id);
        if (!exerciseRow.audioAssetId && audioSeed) {
          if (audioSeed.scenarioSlug !== scenario.id
            || audioSeed.listeningText !== listeningStatement.text
            || audioSeed.isStatementCorrect !== listeningStatement.isCorrect) {
            throw new Error(`Manifest audio không khớp nội dung lượt nghe ${exercise.id}.`);
          }

          const audioPath = resolve(practiceAudioDirectory, audioSeed.fileName);
          if (!existsSync(audioPath)) throw new Error(`Thiếu tệp audio ${audioSeed.fileName}.`);
          const audioBytes = readFileSync(audioPath);
          const checksumSha256 = createHash("sha256").update(audioBytes).digest("hex");
          const mimeType = detectPracticeAudioMime(audioBytes);
          if (checksumSha256 !== audioSeed.checksumSha256
            || audioBytes.byteLength !== audioSeed.sizeBytes
            || mimeType !== audioSeed.mimeType) {
            throw new Error(`Tệp audio ${audioSeed.fileName} không còn khớp manifest.`);
          }

          const [insertedAsset] = await tx.insert(practiceAudioAssets).values({
            originalName: audioSeed.fileName,
            mimeType,
            sizeBytes: audioBytes.byteLength,
            durationMs: audioSeed.durationMs,
            checksumSha256,
            content: new Uint8Array(audioBytes),
          }).onConflictDoNothing().returning({ id: practiceAudioAssets.id });
          const asset = insertedAsset ?? (await tx.select({ id: practiceAudioAssets.id })
            .from(practiceAudioAssets)
            .where(eq(practiceAudioAssets.checksumSha256, checksumSha256))
            .limit(1))[0];
          if (!asset) throw new Error(`Không thể lưu asset audio ${audioSeed.fileName}.`);

          const attached = await tx.update(practiceExerciseTable)
            .set({
              audioAssetId: asset.id,
              audioReviewStatus: scenario.isFree ? "approved" : "pending",
              updatedAt: publishedAt,
            })
            .where(and(eq(practiceExerciseTable.id, exerciseRow.id), isNull(practiceExerciseTable.audioAssetId)))
            .returning({ id: practiceExerciseTable.id });
          attachedPracticeAudioCount += attached.length;
        }
      }
    }
  });

  const lessonCount = courseSeedBundles.reduce((total, bundle) => total + bundle.lessons.length, 0);
  const vocabularyCount = courseSeedBundles.reduce((total, bundle) => total + bundle.lessons.flatMap((lesson) => lesson.vocabulary).length, 0);
  const practiceExerciseCount = practiceScenarios.reduce((total, scenario) => total + scenario.exercises.length, 0);
  console.log(`Đã seed ${courses.length} lộ trình, ${planSeeds.length} gói VIP, ${lessonCount} bài, ${vocabularyCount} mục từ, ${practiceIndustries.length} nhóm Luyện ca, ${practiceScenarios.length} ca, ${practiceExerciseCount} lượt nghe và gắn mới ${attachedPracticeAudioCount} audio.`);
}

seed()
  .catch((error) => {
    console.error("Seed PostgreSQL thất bại:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDb);
