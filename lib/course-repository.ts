import { asc, and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache.js";
import { readDb } from "../db/index.ts";
import type { Database } from "../db/index.ts";
import { courses as courseTable } from "../db/schema.ts";
import { courses as demoCourses, getCourse as getDemoCourse } from "./course-data.ts";
import type { Course } from "./content-types.ts";

function mapCourse(row: typeof courseTable.$inferSelect): Course {
  return {
    slug: row.slug,
    category: row.category,
    title: row.titleVi,
    chineseTitle: row.titleZh,
    hanzi: row.hanzi,
    description: row.description,
    lessons: row.lessonCount,
    minutes: row.totalMinutes,
    freeLessons: row.freeLessonCount,
    level: row.level,
    color: row.themeColor,
    ink: row.themeInk,
    availability: row.lessonCount > 0 ? "available" : "coming_soon",
  };
}

const getCachedPublishedCourses = unstable_cache(async () => {
  const rows = await readDb((db) => db
    .select()
    .from(courseTable)
    .where(eq(courseTable.status, "published"))
    .orderBy(asc(courseTable.sortOrder)));

  return rows.map(mapCourse);
}, ["published-courses"], { revalidate: 300, tags: ["published-content"] });

const getCachedPublishedCourse = unstable_cache(async (slug: string) => {
  const rows = await readDb((db) => db
    .select()
    .from(courseTable)
    .where(and(eq(courseTable.slug, slug), eq(courseTable.status, "published")))
    .limit(1));

  return rows[0] ? mapCourse(rows[0]) : undefined;
}, ["published-course"], { revalidate: 300, tags: ["published-content"] });

export async function listPublishedCourses(): Promise<Course[]> {
  if (!process.env.DATABASE_URL) return demoCourses;
  return getCachedPublishedCourses();
}

export async function getPublishedCourse(slug: string, database?: Database): Promise<Course | undefined> {
  if (!process.env.DATABASE_URL) return getDemoCourse(slug);

  if (!database) return getCachedPublishedCourse(slug);

  const query = (db: Database) => db
    .select()
    .from(courseTable)
    .where(and(eq(courseTable.slug, slug), eq(courseTable.status, "published")))
    .limit(1);
  const [row] = await query(database);

  return row ? mapCourse(row) : undefined;
}
