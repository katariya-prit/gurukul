import { resolveAssetUrl } from "../../services/lessonService";
import type { LessonCardData } from "./lessonCard.types";

export type { LessonCardData };

const formatDate = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

type RawLesson = Record<string, unknown>;

function asRecord(value: unknown): RawLesson {
  return typeof value === "object" && value !== null ? value as RawLesson : {};
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

export const normalizeLesson = (input: unknown): LessonCardData => {
  const item = asRecord(input);
  const rawPoints = item.progress_points ?? item.points;
  const points = rawPoints === undefined || rawPoints === null ? null : Number(rawPoints);
  const createdBy = item.created_by;
  return {
    id: asText(item.lesson_id ?? item.id),
    title: asText(item.lesson_title ?? item.title, "Untitled lesson"),
    type: asText(item.lesson_type ?? item.media_type ?? item.type).toLowerCase(),
    mediaUrl: resolveAssetUrl(asText(item.media_url ?? item.mediaUrl) || null),
    thumbnail: resolveAssetUrl(
      asText(item.thumbnail_url ?? item.thumbnailUrl ?? item.thumbnail) || null
    ),
    startDate: formatDate(item.date_start ?? item.start_date),
    endDate: formatDate(item.date_end ?? item.end_date),
    points: points !== null && Number.isFinite(points) ? points : null,
    description: asText(item.description),
    createdBy: createdBy == null ? null : asText(createdBy),
  };
};

export const extractLessonList = (result: unknown): unknown[] => {
  if (Array.isArray(result)) return result;
  const record = asRecord(result);
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.lessons)) return record.lessons;
  return [];
};