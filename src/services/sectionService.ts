import { AxiosError } from 'axios';
import api from './apiClient';

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
};

export const sectionService = {
  // 1. સેક્શન ક્રિએટ કરવા માટે
  createSection: async (data: {
    name: string;
    departmentId: number;
    description?: string;
    sectionHead?: number | string | null;
  }) => {
    try {
      const response = await api.post(`/sections/create`, {
        name: data.name,
        departmentId: data.departmentId,
        description: data.description,
        sectionHeadId: data.sectionHead || null,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create section'), { cause: error });
    }
  },

  // 2. સેક્શન અપડેટ કરવા માટે
  updateSection: async (
    sectionId: number,
    data: {
      name?: string;
      description?: string;
      sectionHead?: number | string | null;
    }
  ) => {
    try {
      const response = await api.put(`/sections/${sectionId}`, {
        name: data.name,
        description: data.description,
        sectionHeadId: data.sectionHead,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update section'), { cause: error });
    }
  },

  // 3. બધા સેક્શન લાવવા માટે
  getAllSections: async () => {
    try {
      const response = await api.get(`/sections`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch sections'), { cause: error });
    }
  },

  // 4. એક Section ID પ્રમાણે લાવવા માટે
  getSectionById: async (sectionId: number) => {
    try {
      const response = await api.get(`/sections/${sectionId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch section'), { cause: error });
    }
  },

  // 5. Department પ્રમાણે Sections લાવવા માટે
  getSectionsByDepartment: async (departmentId: number) => {
    try {
      const response = await api.get(`/sections/department/${departmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch sections for department'), { cause: error });
    }
  },

  // 6. Section ડિલીટ કરવા માટે
  deleteSection: async (sectionId: number) => {
    try {
      const response = await api.delete(`/sections/delete/${sectionId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete section'), { cause: error });
    }
  },
};