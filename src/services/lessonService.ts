import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
};

export interface LessonPayload {
  title?: string;
  lesson_title?: string;
  lesson_type?: string;
  media_type?: string;
  type?: string;
  media_url?: string;
  file_url?: string;
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

export const lessonService = {
  createLesson: async (payload: LessonPayload) => {
    try {
      const response = await axios.post(`${API_URL}/lessons/create`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to create lesson"), { cause: error });
    }
  },

  getMyLessons: async (userId?: number | string | null) => {
    try {
      const params = userId ? { userId } : {};
      const response = await axios.get(`${API_URL}/lessons/my-lessons`, { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to load my lessons"), { cause: error });
    }
  },
};
