import axiosInstance from './axios.js';
import type { Generation } from '../types/generation.js';

/**
 * Create a new generation
 * @param image - Image file to upload
 * @param prompt - Text prompt for generation
 * @param style - Style option
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Generation object
 */
export const createGeneration = async (
  image: File,
  prompt: string,
  style: string,
  signal?: AbortSignal
): Promise<Generation> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('prompt', prompt);
  formData.append('style', style);

  const response = await axiosInstance.post<Generation>('/generations', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    signal,
  });

  return response.data;
};

/**
 * Get user's generations
 * @param limit - Maximum number of generations to return (default: 5)
 * @returns Array of Generation objects
 */
export const getUserGenerations = async (limit: number = 5): Promise<Generation[]> => {
  const response = await axiosInstance.get<Generation[]>('/generations', {
    params: { limit },
  });

  return response.data;
};

