import axios from "axios";
import api, { API_URL } from "./apiClient";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string; errors?: { message?: string }[] }>(error)) {
    return error.response?.data?.message || error.response?.data?.errors?.[0]?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

export const resolveAssetUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export interface AiCriterion {
  key: string;
  score: number;
  comment: string;
}

export interface AiResult {
  criteria: AiCriterion[];
  summary: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
  flags: string[];
}

export type AiStatus = "pending" | "processing" | "done" | "failed" | "skipped";
export type SubmissionSource = "upload" | "recorded" | "live";

export interface Submission {
  submission_id: number | string;
  lesson_id: number | string;
  student_id: number | string;
  student_name: string;
  student_avatar?: string | null;
  media_url: string;
  source: SubmissionSource;
  ai_status: AiStatus;
  ai_percent: number | null;
  ai_points: number | null;
  ai_result: AiResult | null;
  ai_error?: string | null;
  skip_reason?: string | null;
  needs_review: boolean;
  teacher_points: number | null;
  teacher_feedback: string | null;
  final_points: number | null;
  created_at: string;
}

export interface SubmitLessonOptions {
  source: SubmissionSource;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export interface SubmitLessonResponse {
  success?: boolean;
  message?: string;
  data?: Submission;
  submission?: Submission;
}

export interface GradeSubmissionPayload {
  points: number;
  feedback: string;
}

function isSubmission(value: unknown): value is Submission {
  return typeof value === "object" && value !== null && "submission_id" in value;
}

function getSubmissionResponse(value: unknown, allowEmpty = false): Submission | null {
  if (value === null || value === undefined) {
    if (allowEmpty) return null;
    throw new Error("The server returned an invalid submission");
  }
  if (typeof value !== "object") throw new Error("The server returned an invalid submission");
  if ("success" in value && value.success === false) {
    const message = "message" in value && typeof value.message === "string" ? value.message : "";
    throw new Error(message || "The server could not update this submission");
  }
  if ("data" in value && isSubmission(value.data)) return value.data;
  if ("submission" in value && isSubmission(value.submission)) return value.submission;
  if (isSubmission(value)) return value;
  if (allowEmpty && "success" in value && value.success === true) return null;
  throw new Error("The server returned an invalid submission");
}

function unwrapSubmissionList(value: unknown): Submission[] {
  if (Array.isArray(value)) return value.filter(isSubmission);
  if (typeof value !== "object" || value === null) {
    throw new Error("The server returned an invalid submissions list");
  }
  if ("success" in value && value.success === false) {
    const message = "message" in value && typeof value.message === "string" ? value.message : "";
    throw new Error(message || "The server could not load submissions");
  }
  if ("data" in value && Array.isArray(value.data)) return value.data.filter(isSubmission);
  if ("submissions" in value && Array.isArray(value.submissions)) {
    return value.submissions.filter(isSubmission);
  }
  if (
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "submissions" in value.data &&
    Array.isArray(value.data.submissions)
  ) {
    return value.data.submissions.filter(isSubmission);
  }
  throw new Error("The server returned an invalid submissions list");
}

export interface LessonPayload {
  title?: string;
  lesson_title?: string;
  lesson_type?: string;
  media_type?: string;
  type?: string;
  media_url?: string;
  file_url?: string;
  media_file?: string | null;
  file_name?: string | null;
  file?: File | null;
  assignment?: Record<string, unknown>;
  department_id?: number | null;
  departmentId?: number | null;
  date_start?: string;
  start_date?: string;
  date_end?: string;
  end_date?: string;
  description?: string;
  progress_points?: number;
  points?: number;
  status?: string;
}

const SERVER_CONTROLLED_FIELDS = new Set(["created_by", "role_code"]);

const buildFormData = (payload: LessonPayload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (SERVER_CONTROLLED_FIELDS.has(key)) return;
    if (value === undefined || value === null) return;

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

export const lessonService = {
  submitLesson: async (
    lessonId: number | string,
    file: File,
    { source, onProgress, signal }: SubmitLessonOptions
  ): Promise<SubmitLessonResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", source);

    try {
      const response = await api.post<SubmitLessonResponse>(
        `/lessons/${encodeURIComponent(String(lessonId))}/submit`,
        formData,
        {
          withCredentials: true,
          signal,
          onUploadProgress: (event) => {
            if (event.total) onProgress?.((event.loaded / event.total) * 100);
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isCancel(error)) throw error;
      throw new Error(getErrorMessage(error, "Failed to upload lesson work"), { cause: error });
    }
  },

  getMySubmissions: async (): Promise<Submission[]> => {
    try {
      const response = await api.get<unknown>("/lessons/submissions/mine", {
        withCredentials: true,
      });
      return unwrapSubmissionList(response.data);
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, "Failed to load your submissions"), { cause: error });
    }
  },

  getLessonSubmissions: async (lessonId: number | string): Promise<Submission[]> => {
    try {
      const response = await api.get<unknown>(
        `/lessons/${encodeURIComponent(String(lessonId))}/submissions`,
        { withCredentials: true }
      );
      return unwrapSubmissionList(response.data);
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, "Failed to load lesson submissions"), { cause: error });
    }
  },

  gradeSubmission: async (
    submissionId: number | string,
    payload: GradeSubmissionPayload
  ): Promise<Submission | null> => {
    try {
      const response = await api.put<unknown>(
        `/lessons/submissions/${encodeURIComponent(String(submissionId))}/grade`,
        payload,
        { withCredentials: true }
      );
      return getSubmissionResponse(response.data);
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, "Failed to grade submission"), { cause: error });
    }
  },

  reEvaluate: async (submissionId: number | string): Promise<Submission | null> => {
    try {
      const response = await api.post<unknown>(
        `/lessons/submissions/${encodeURIComponent(String(submissionId))}/re-evaluate`,
        {},
        { withCredentials: true }
      );
      return getSubmissionResponse(response.data, true);
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error, "Failed to re-evaluate submission"), { cause: error });
    }
  },

  createLesson: async (payload: LessonPayload, onProgress?: (percent: number) => void) => {
    try {
      const response = await api.post("/lessons/create", buildFormData(payload), {
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress((event.loaded / event.total) * 100);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to create lesson"), { cause: error });
    }
  },

  getMyLessons: async () => {
    try {
      const response = await api.get("/lessons/my");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to load my lessons"), { cause: error });
    }
  },

  getCreatedLessons: async () => {
    try {
      const response = await api.get("/lessons/created");
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to load created lessons"), { cause: error });
    }
  },

  deleteLesson: async (id: number | string) => {
    try {
      const response = await api.delete(`/lessons/delete/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to delete lesson"), { cause: error });
    }
  },
};