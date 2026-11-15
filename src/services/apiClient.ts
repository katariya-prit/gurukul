import axios from "axios";
import { toast } from "sonner";

export const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:3333").replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    } else if (error.response?.status === 403) {
      const message =
        error.response.data?.message ||
        error.response.data?.errors?.[0]?.message ||
        "You do not have permission to perform this action.";
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
