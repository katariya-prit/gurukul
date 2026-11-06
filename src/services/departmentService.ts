import { AxiosError } from 'axios';
import api from './apiClient';

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
};

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