import axios, { isAxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface GrowthTrendPoint {
  date: string;
  newEnrollments: number;
  totalActive: number;
}

export interface LessonStats {
  totalLessons: number;
  submittedLessons: number;
  lessonCompletionPercent: number;
  totalLessonPoints: number;
  earnedLessonPoints: number;
  lessonScorePercent: number;
}

export type LessonItemStatus = 'pending' | 'submitted' | 'graded';

export interface StudentLessonItem {
  lessonId: number;
  title: string;
  type: string;
  dateStart: string;
  dateEnd: string;
  maxPoints: number;
  status: LessonItemStatus;
  earnedPoints: number | null;
  submittedAt: string | null;
}

export interface UserProgress extends LessonStats {
  suid: number;
  name: string;
  avatar: string | null;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  overallPercentage: number;
}

export interface UserProgressDetail extends UserProgress {
  lessons: StudentLessonItem[];
}

export interface SectionProgress extends LessonStats {
  section_id: number;
  name: string;
  department_id: number;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  overallPercentage: number;
  users: UserProgress[];
  studentCount?: number;
  growthTrend?: GrowthTrendPoint[];
}

export interface DepartmentProgress extends LessonStats {
  department_id: number;
  department_name: string;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  overallPercentage: number;
  sections: SectionProgress[];
  growthTrend?: GrowthTrendPoint[];
}

export interface DepartmentSummary extends LessonStats {
  department_id: number;
  department_name: string;
  percentage: number;
  overallPercentage: number;
}

export type LessonGrowthScope = 'user' | 'section' | 'department' | 'all';
export type LessonGrowthPeriod = 'week' | 'month';

export interface LessonGrowthPoint {
  periodStart: string;
  periodEnd: string;
  newSubmissions: number;
  cumulativeSubmissions: number;
  assignedLessons: number;
  completionPercent: number;
  cumulativePoints: number;
}

export interface LessonGrowth {
  period: LessonGrowthPeriod;
  points: LessonGrowthPoint[];
  currentPercent: number;
  previousPercent: number;
  changePercent: number;
}

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const errorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

export const progressService = {
  getAllDepartmentsProgress: async (): Promise<ApiResponse<DepartmentSummary[]>> => {
    try {
      const response = await axios.get<ApiResponse<DepartmentSummary[]>>(`${API_URL}/progress/departments`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error(errorMessage(error, 'Failed to fetch departments progress'));
    }
  },

  getDepartmentProgress: async (departmentId: number): Promise<ApiResponse<DepartmentProgress>> => {
    try {
      const response = await axios.get<ApiResponse<DepartmentProgress>>(
        `${API_URL}/progress/department/${departmentId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(errorMessage(error, 'Failed to fetch department progress'));
    }
  },

  getSectionProgress: async (sectionId: number): Promise<ApiResponse<SectionProgress>> => {
    try {
      const response = await axios.get<ApiResponse<SectionProgress>>(
        `${API_URL}/progress/section/${sectionId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(errorMessage(error, 'Failed to fetch section progress'));
    }
  },

  getUserProgress: async (suid: number): Promise<ApiResponse<UserProgressDetail>> => {
    try {
      const response = await axios.get<ApiResponse<UserProgressDetail>>(
        `${API_URL}/progress/user/${suid}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(errorMessage(error, 'Failed to fetch user progress'));
    }
  },

  getLessonGrowth: async (
    scope: LessonGrowthScope,
    id?: number,
    period: LessonGrowthPeriod = 'week'
  ): Promise<ApiResponse<LessonGrowth>> => {
    try {
      const response = await axios.get<ApiResponse<LessonGrowth>>(`${API_URL}/progress/lessons/growth`, {
        headers: getAuthHeaders(),
        params: { scope, id, period },
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error(errorMessage(error, 'Failed to fetch lesson growth'));
    }
  },
};