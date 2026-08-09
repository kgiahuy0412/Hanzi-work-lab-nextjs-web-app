import type { ContentStatus } from "./admin-content-validation.ts";

type SnapshotScenario = {
  title: string;
  brief: string;
  context: string;
  durationMinutes: number;
  level: string;
  isFree: boolean;
  sentenceZh: string;
  pinyin: string;
  translation: string;
  focus: string[];
  status: ContentStatus;
  sortOrder: number;
};

type SnapshotExercise = {
  audioAssetId: string | null;
  slug: string;
  eyebrow: string;
  prompt: string;
  chinese: string | null;
  listeningText: string | null;
  isStatementCorrect: boolean | null;
  audioUrl: string | null;
  options: string[];
  correctOption: number;
  explanation: string;
  sortOrder: number;
};

export type PracticeScenarioSnapshot = {
  scenario: SnapshotScenario;
  exercises: SnapshotExercise[];
};

const contentStatuses = new Set<ContentStatus>(["draft", "review", "published", "archived"]);

function recordOf(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function nullableString(value: unknown): string | null | undefined {
  return value === null ? null : typeof value === "string" ? value : undefined;
}

function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function parseScenario(value: unknown): SnapshotScenario | null {
  const source = recordOf(value);
  if (!source) return null;
  const durationMinutes = integer(source.durationMinutes);
  const sortOrder = integer(source.sortOrder);
  const focus = Array.isArray(source.focus) && source.focus.every((item) => typeof item === "string")
    ? source.focus
    : null;
  const status = typeof source.status === "string" && contentStatuses.has(source.status as ContentStatus)
    ? source.status as ContentStatus
    : null;
  const stringFields = ["title", "brief", "context", "level", "sentenceZh", "pinyin", "translation"] as const;
  if (stringFields.some((field) => typeof source[field] !== "string")) return null;
  if (durationMinutes === null || durationMinutes < 1 || sortOrder === null || !focus || !status || typeof source.isFree !== "boolean") return null;
  return {
    title: source.title as string,
    brief: source.brief as string,
    context: source.context as string,
    durationMinutes,
    level: source.level as string,
    isFree: source.isFree,
    sentenceZh: source.sentenceZh as string,
    pinyin: source.pinyin as string,
    translation: source.translation as string,
    focus,
    status,
    sortOrder,
  };
}

function parseExercise(value: unknown): SnapshotExercise | null {
  const source = recordOf(value);
  if (!source) return null;
  const audioAssetIdValue = nullableString(source.audioAssetId);
  const chinese = nullableString(source.chinese);
  const listeningTextValue = nullableString(source.listeningText);
  const audioUrl = nullableString(source.audioUrl);
  const correctOption = integer(source.correctOption);
  const sortOrder = integer(source.sortOrder);
  const options = Array.isArray(source.options) && source.options.every((item) => typeof item === "string")
    ? source.options
    : null;
  const stringFields = ["slug", "eyebrow", "prompt", "explanation"] as const;
  if (stringFields.some((field) => typeof source[field] !== "string")) return null;
  if (chinese === undefined || audioUrl === undefined) return null;
  if (correctOption === null || sortOrder === null || !options) return null;
  if (source.isStatementCorrect !== undefined && source.isStatementCorrect !== null && typeof source.isStatementCorrect !== "boolean") return null;
  const audioAssetId = audioAssetIdValue === undefined ? null : audioAssetIdValue;
  const listeningText = listeningTextValue === undefined ? chinese : listeningTextValue;
  return {
    audioAssetId,
    slug: source.slug as string,
    eyebrow: source.eyebrow as string,
    prompt: source.prompt as string,
    chinese,
    listeningText,
    isStatementCorrect: source.isStatementCorrect === undefined ? null : source.isStatementCorrect as boolean | null,
    audioUrl,
    options,
    correctOption,
    explanation: source.explanation as string,
    sortOrder,
  };
}

export function parsePracticeScenarioSnapshot(value: unknown): PracticeScenarioSnapshot | null {
  const source = recordOf(value);
  if (!source || !Array.isArray(source.exercises)) return null;
  const scenario = parseScenario(source.scenario);
  const exercises = source.exercises.map(parseExercise);
  if (!scenario || exercises.some((exercise) => !exercise)) return null;
  const parsedExercises = exercises as SnapshotExercise[];
  if (new Set(parsedExercises.map((exercise) => exercise.slug)).size !== parsedExercises.length) return null;
  return { scenario, exercises: parsedExercises };
}

export function preparePracticeVersionRestore(snapshot: PracticeScenarioSnapshot, availableAudioAssetIds: ReadonlySet<string>) {
  const missingAudioAssetIds: string[] = [];
  const exercises = snapshot.exercises.map((exercise) => {
    const audioAssetId = exercise.audioAssetId && availableAudioAssetIds.has(exercise.audioAssetId)
      ? exercise.audioAssetId
      : null;
    if (exercise.audioAssetId && !audioAssetId) missingAudioAssetIds.push(exercise.audioAssetId);
    return { ...exercise, audioAssetId };
  });
  return {
    scenario: {
      title: snapshot.scenario.title,
      brief: snapshot.scenario.brief,
      context: snapshot.scenario.context,
      durationMinutes: snapshot.scenario.durationMinutes,
      level: snapshot.scenario.level,
      isFree: snapshot.scenario.isFree,
      sentenceZh: snapshot.scenario.sentenceZh,
      pinyin: snapshot.scenario.pinyin,
      translation: snapshot.scenario.translation,
      focus: snapshot.scenario.focus,
      sortOrder: snapshot.scenario.sortOrder,
    },
    exercises,
    missingAudioAssetIds,
  };
}
