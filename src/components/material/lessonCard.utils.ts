import { resolveAssetUrl } from "../../services/lessonService";
import type { LessonCardData } from "./lessonCard.types";

export type { LessonCardData };

const formatDate = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

export const normalizeLesson = (item: any): LessonCardData => {
  const rawPoints = item.progress_points ?? item.points;

  return {
    id: String(item.lesson_id ?? item.id),
    title: item.lesson_title ?? item.title ?? "Untitled lesson",
    type: String(item.lesson_type ?? item.media_type ?? item.type ?? "").toLowerCase(),
    mediaUrl: resolveAssetUrl(item.media_url ?? item.mediaUrl),
    thumbnail: resolveAssetUrl(item.thumbnail_url ?? item.thumbnailUrl ?? item.thumbnail),
    startDate: formatDate(item.date_start ?? item.start_date),
    endDate: formatDate(item.date_end ?? item.end_date),
    points: rawPoints === undefined || rawPoints === null ? null : Number(rawPoints),
    description: item.description ?? "",
  };
};

export const extractLessonList = (result: any): any[] => {
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.lessons)) return result.lessons;
  if (Array.isArray(result)) return result;
  return [];
};