import axios from "axios";
import { toast } from "sonner";
import { API_BASE_URL } from "./OverviewService";

export type QuoteType = "activity" | "event";
export type EventApprovalStatus = "Approved" | "Rejected" | "Pending";
export type EventStatus = "Active" | "Inactive";
export type HeroSectionChoice = "Yes" | "No";

export interface UpcomingEventMetadata {
  name?: string;
  displayStartDate?: string;
  displayEndDate?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  isApproved?: EventApprovalStatus;
  status?: EventStatus;
  addToHero?: HeroSectionChoice;
}

export interface QuoteData {
  id: number;
  type: QuoteType;
  image_url: string;
  public_id: string;
  title?: string;
  description: string | null;
  event_date: string;
  created_at: string;
  name?: string | null;
  display_start_date?: string | null;
  display_end_date?: string | null;
  event_start_date?: string | null;
  event_end_date?: string | null;
  is_approved?: EventApprovalStatus | null;
  status?: EventStatus | null;
  add_to_hero?: HeroSectionChoice | null;
}



interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

function getAuthHeaders() {
  const token = getToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

function getApiError(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export const quoteService = {
  createQuote: async (
    type: QuoteType,
    file: File,
    date: string,
    description?: string,
    metadata?: UpcomingEventMetadata
  ): Promise<ApiResponse<QuoteData>> => {
    try {
      const formData = new FormData();

      formData.append("image", file);
      formData.append("type", type);
      formData.append("date", date);

      if (description) formData.append("description", description);
      if (metadata?.name) formData.append("name", metadata.name);
      if (metadata?.displayStartDate) formData.append("display_start_date", metadata.displayStartDate);
      if (metadata?.displayEndDate) formData.append("display_end_date", metadata.displayEndDate);
      if (metadata?.eventStartDate) formData.append("event_start_date", metadata.eventStartDate);
      if (metadata?.eventEndDate) formData.append("event_end_date", metadata.eventEndDate);
      if (metadata?.isApproved) formData.append("is_approved", metadata.isApproved);
      if (metadata?.status) formData.append("status", metadata.status);
      if (metadata?.addToHero) formData.append("add_to_hero", metadata.addToHero);

      const response = await axios.post<ApiResponse<QuoteData>>(
        `${API_BASE_URL}/quotes`,
        formData,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Quote created successfully");
      } else {
        toast.error(response.data.message || "Failed to create quote");
      }

      return response.data;
    } catch (error: unknown) {
      const message = getApiError(error, "Failed to create quote");
      toast.error(message);
      throw new Error(message, { cause: error });
    }
  },

  getQuotesByType: async (
    type: QuoteType,
    includeUnapproved = false
  ): Promise<ApiResponse<QuoteData[]>> => {
    try {
      const response = await axios.get<ApiResponse<QuoteData[]>>(
        `${API_BASE_URL}/quotes/type/${encodeURIComponent(type)}`,
        {
          params: includeUnapproved
            ? { includeUnapproved: "true" }
            : undefined,
          headers: getAuthHeaders(),
        }
      );

      return {
        success: response.data.success ?? true,
        data: Array.isArray(response.data.data) ? response.data.data : [],
        message: response.data.message,
      };
    } catch {
      return {
        success: false,
        data: [],
        message: "Unable to load data",
      };
    }
  },

  deleteQuote: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await axios.delete<ApiResponse<null>>(
        `${API_BASE_URL}/quotes/${id}`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Quote deleted successfully");
      } else {
        toast.error(response.data.message || "Failed to delete quote");
      }

      return response.data;
    } catch (error: unknown) {
      const message = getApiError(error, "Failed to delete quote");
      toast.error(message);
      throw new Error(message, { cause: error });
    }
  },

  updateQuote: async (
    id: number,
    file: File | null,
    date: string,
    description: string,
    metadata: UpcomingEventMetadata
  ): Promise<ApiResponse<QuoteData>> => {
    try {
      const formData = new FormData();

      if (file) formData.append("image", file);

      formData.append("date", date);
      formData.append("description", description);

      if (metadata.name) formData.append("name", metadata.name);
      if (metadata.displayStartDate) formData.append("display_start_date", metadata.displayStartDate);
      if (metadata.displayEndDate) formData.append("display_end_date", metadata.displayEndDate);
      if (metadata.eventStartDate) formData.append("event_start_date", metadata.eventStartDate);
      if (metadata.eventEndDate) formData.append("event_end_date", metadata.eventEndDate);
      if (metadata.isApproved) formData.append("is_approved", metadata.isApproved);
      if (metadata.status) formData.append("status", metadata.status);
      if (metadata.addToHero) formData.append("add_to_hero", metadata.addToHero);

      const response = await axios.put<ApiResponse<QuoteData>>(
        `${API_BASE_URL}/quotes/${id}`,
        formData,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Quote updated successfully");
      } else {
        toast.error(response.data.message || "Failed to update quote");
      }

      return response.data;
    } catch (error: unknown) {
      const message = getApiError(error, "Failed to update quote");
      toast.error(message);
      throw new Error(message, { cause: error });
    }
  },
};