import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const uploadHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const getUploadedUrl = (data: { url?: string; avatarUrl?: string; data?: { url?: string; avatarUrl?: string } }) => {
  const url = data.url || data.avatarUrl || data.data?.url || data.data?.avatarUrl;
  if (!url) throw new Error("The server did not return an image URL.");
  return url;
};

const getUploadError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const responseData: unknown = error.response?.data;
    if (typeof responseData === "string") {
      const serverMessage = responseData.match(/<pre>(.*?)<\/pre>/)?.[1];
      return serverMessage || responseData || error.message || fallback;
    }
    if (responseData && typeof responseData === "object" && "message" in responseData) {
      const message = responseData.message;
      return typeof message === "string" ? message : error.message || fallback;
    }
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

export const uploadService = {
  uploadAvatar: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await axios.post(`${API_URL}/upload/avatar`, formData, {
        headers: uploadHeaders(),
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Upload failed");
      }
      return getUploadedUrl(response.data);
    } catch (error: unknown) {
      throw new Error(getUploadError(error, "Failed to upload avatar"), { cause: error });
    }
  },

  uploadSectionImage: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(`${API_URL}/upload/section`, formData, {
        headers: uploadHeaders(),
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Upload failed");
      }
      return getUploadedUrl(response.data);
    } catch (error: unknown) {
      throw new Error(getUploadError(error, "Failed to upload image"), { cause: error });
    }
  },
};