const AI_URL = import.meta.env.VITE_AI_URL || "http://localhost:8787";

export interface AiHealth {
  status: string;
  version: string;
  trained_at: string | null;
  last_batch_at: string | null;
  student_count: number | null;
  backend: string;
  uptime_seconds: number;
  memory_used_mb: number;
  memory_total_mb: number;
}

export interface StudentPrediction {
  student_id: number;
  predicted_days_to_next_level: number;
  confidence: number;
  levelled_up_within_30_days: boolean;
  at_risk: boolean;
}

export interface SectionStudentPrediction {
  student_id: number;
  predicted_days_to_next_level: number | null;
  confidence: number | null;
  at_risk: boolean;
  risk_reason: string | null;
  absent_week_ratio: number | null;
  consistency_score: number | null;
  current_points: number | null;
  computed_at: string | null;
}

export interface SectionSummary {
  section_id: number;
  total_students: number;
  at_risk_count: number;
  levelling_soon_count: number;
  avg_days_to_next_level: number | null;
  last_batch_at: string | null;
  students: SectionStudentPrediction[];
}

export interface BatchResponse {
  status: string;
  message: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const aiGet = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${AI_URL}${path}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI service ${path} -> ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
};

export const aiService = {
  getHealth: (): Promise<AiHealth> => aiGet<AiHealth>("/health"),

  getStudentPrediction: (studentId: number): Promise<StudentPrediction> =>
    aiGet<StudentPrediction>(`/predictions/student/${studentId}`),

  getSectionSummary: (sectionId: number): Promise<SectionSummary> =>
    aiGet<SectionSummary>(`/predictions/section/${sectionId}/summary`),

  triggerBatch: async (): Promise<BatchResponse> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${AI_URL}/predict/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: "{}",
    });
    if (!res.ok) throw new Error(`Batch trigger failed: ${res.status}`);
    return res.json() as Promise<BatchResponse>;
  },
};
