import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
};

// 🎯 FIX: Authorization header automatically attach karva mate axios instance
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const departmentService = {
  createDepartment: async (data: { departmentName: string; departmentHeadId?: number | string | null; description?: string }) => {
    try {
      const response = await api.post(`/departments/create`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create department'), { cause: error });
    }
  },

  getAllDepartments: async () => {
    try {
      const response = await api.get(`/departments`);
      return response.data; // { success: true, data: [...] }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch departments'), { cause: error });
    }
  },

  getDepartmentById: async (departmentId: number) => {
    try {
      const response = await api.get(`/departments/${departmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch department'), { cause: error });
    }
  },

  updateDepartment: async (departmentId: number, data: { departmentName?: string; departmentHeadId?: number | string | null; description?: string }) => {
    try {
      const response = await api.put(`/departments/${departmentId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update department'), { cause: error });
    }
  },

  deleteDepartment: async (departmentId: number) => {
    try {
      const response = await api.delete(`/departments/delete/${departmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete department'), { cause: error });
    }
  },

  getUsersByDepartment: async (departmentId: number) => {
    try {
      const response = await api.get(`/departments/${departmentId}/users`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch department users'), { cause: error });
    }
  }
};