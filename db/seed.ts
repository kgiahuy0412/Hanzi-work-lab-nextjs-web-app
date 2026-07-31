import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "./index.ts";
import {
  courses as courseTable,
  lessons as lessonTable,
  lessonVocabulary,
  modules,
  vipPlans,
  vocabulary as vocabularyTable,
} from "./schema.ts";
import { courses } from "../lib/course-data.ts";
import { factoryLessons, factoryModules } from "../lib/factory-course-seed.ts";
import { logisticsLessons, logisticsModules } from "../lib/logistics-course-seed.ts";
import { officeLessons, officeModules } from "../lib/office-course-seed.ts";
import { salesLessons, salesModules } from "../lib/sales-course-seed.ts";
import type { CourseSeedBundle } from "../lib/course-seed-types.ts";

const localEnvPath = resolve(process.cwd(), ".env.local");
if (existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);

const publishedAt = new Date();

const planSeeds = [
  { code: "VIP_1M", name: "VIP 1 tháng", durationDays: 30, priceVnd: 79_000 },
  { code: "VIP_6M", name: "VIP 6 tháng", durationDays: 180, priceVnd: 329_000 },
  { code: "VIP_12M", name: "VIP 12 tháng", durationDays: 365, priceVnd: 549_000 },
] as const;

const courseSeedBundles: CourseSeedBundle[] = [
  { courseSlug: "van-phong-hanh-chinh", modules: officeModules, lessons: officeLessons },
  { courseSlug: "nha-may-san-xuat", modules: factoryModules, lessons: factoryLessons },
  { courseSlug: "kho-van-logistics", modules: logisticsModules, lessons: logisticsLessons },
  { courseSlug: "ban-hang-cham-soc-khach-hang", modules: salesModules, lessons: salesLessons },
];

async function seed() {
  const db = getDb();

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
        set: { name: plan.name, durationDays: plan.durationDays, priceVnd: plan.priceVnd, isActive: true },
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
  });

  const lessonCount = courseSeedBundles.reduce((total, bundle) => total + bundle.lessons.length, 0);
  const vocabularyCount = courseSeedBundles.reduce((total, bundle) => total + bundle.lessons.flatMap((lesson) => lesson.vocabulary).length, 0);
  console.log(`Đã seed ${courses.length} lộ trình, ${planSeeds.length} gói VIP, ${lessonCount} bài và ${vocabularyCount} mục từ cho ${courseSeedBundles.length} chuyên ngành.`);
}

seed()
  .catch((error) => {
    console.error("Seed PostgreSQL thất bại:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDb);
