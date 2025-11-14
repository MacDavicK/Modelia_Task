import axiosInstance from './axios.js';
import type { AuthResponse, LoginCredentials, SignupCredentials } from '../types/auth.js';
import type { AxiosError } from 'axios';

interface ApiError {
  error?: string;
  message?: string;
  details?: Array<{ field: string; message: string }>;
}

const handleApiError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiError>;
    const errorData = axiosError.response?.data;

    if (errorData?.error) {
      return errorData.error;
    }

    if (errorData?.details && errorData.details.length > 0) {
      return errorData.details.map((d) => d.message).join(', ');
    }

    if (errorData?.message) {
      return errorData.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

export const authApi = {
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/signup', credentials);
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },
};

