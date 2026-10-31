import axios, { AxiosError } from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
};

export const resolveAssetUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

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
  role_code?: string;
  created_by?: number | string | null;
  status?: string;
}

const buildFormData = (payload: LessonPayload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
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
  createLesson: async (payload: LessonPayload) => {
    try {
      const response = await axios.post(`${API_URL}/lessons/create`, buildFormData(payload), {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to create lesson"), { cause: error });
    }
  },

  getMyLessons: async () => {
    try {
      const response = await axios.get(`${API_URL}/lessons/my`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to load my lessons"), { cause: error });
    }
  },

  getCreatedLessons: async () => {
    try {
      const response = await axios.get(`${API_URL}/lessons/created`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to load created lessons"), { cause: error });
    }
  },

  deleteLesson: async (id: number | string) => {
    try {
      const response = await axios.delete(`${API_URL}/lessons/delete/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to delete lesson"), { cause: error });
    }
  },
};