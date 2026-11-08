import { resolveAssetUrl } from "../../services/lessonService";
import type { LessonCardData } from "./lessonCard.types";

export type { LessonCardData };

const formatDate = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

type RawLesson = Record<string, unknown>;

function asRecord(value: unknown): RawLesson {
  return typeof value === "object" && value !== null ? value as RawLesson : {};
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function asNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || (typeof value === "string" && !value.trim())) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getLastPathSegment(value: string) {
  const path = value.split(/[?#]/, 1)[0] ?? "";
  const segment = path.split("/").filter(Boolean).at(-1) ?? "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function formatFileSize(bytes: number | null | undefined) {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

export function getFileExtension(nameOrUrl: string) {
  const filename = getLastPathSegment(nameOrUrl);
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex > 0 ? filename.slice(dotIndex + 1).toLowerCase() : "";
}

export const normalizeLesson = (input: unknown): LessonCardData => {
  const item = asRecord(input);
  const rawPoints = item.progress_points ?? item.points;
  const points = rawPoints === undefined || rawPoints === null ? null : Number(rawPoints);
  const createdBy = item.created_by;
  const rawMediaUrl = asText(
    item.media_url ?? item.mediaUrl ?? item.file_url ?? item.fileUrl ?? item.media_file
  );
  const rawFileName = asText(item.file_name ?? item.fileName);
  const rawFileSize = item.file_size ?? item.fileSize ?? item.size;
  return {
    id: asText(item.lesson_id ?? item.id),
    title: asText(item.lesson_title ?? item.title, "Untitled lesson"),
    type: asText(item.lesson_type ?? item.media_type ?? item.type).toLowerCase(),
    mediaUrl: resolveAssetUrl(rawMediaUrl || null),
    thumbnail: resolveAssetUrl(
      asText(item.thumbnail_url ?? item.thumbnailUrl ?? item.thumbnail) || null
    ),
    startDate: formatDate(item.date_start ?? item.start_date),
    endDate: formatDate(item.date_end ?? item.end_date),
    points: points !== null && Number.isFinite(points) ? points : null,
    description: asText(item.description),
    createdBy: createdBy == null ? null : asText(createdBy),
    fileName: rawFileName || getLastPathSegment(rawMediaUrl) || undefined,
    fileSize: asNumberOrNull(rawFileSize),
    mimeType: asText(item.mime_type ?? item.mimeType) || undefined,
    duration: asNumberOrNull(item.duration ?? item.duration_seconds),
  };
};

export const extractLessonList = (result: unknown): unknown[] => {
  if (Array.isArray(result)) return result;
  const record = asRecord(result);
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.lessons)) return record.lessons;
  return [];
};