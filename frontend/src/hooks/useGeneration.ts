import { useState, useRef, useEffect } from 'react';
import { createGeneration } from '../api/generation.js';
import type { Generation } from '../types/generation.js';

interface UseGenerationReturn {
  loading: boolean;
  error: string | null;
  result: Generation | null;
  generate: (image: File, prompt: string, style: string) => Promise<void>;
  abort: () => void;
  reset: () => void;
}

export const useGeneration = (): UseGenerationReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Generation | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = async (image: File, prompt: string, style: string): Promise<void> => {
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const generation = await createGeneration(image, prompt, style, abortController.signal);
      setResult(generation);
      setError(null);
    } catch (err: unknown) {
      // Don't set error if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Handle 503 error specially
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status === 503) {
          setError('Model overloaded. Please try again in a moment.');
        } else {
          const errorMessage =
            axiosError.response?.data?.error ||
            (err instanceof Error ? err.message : 'Failed to generate image');
          setError(errorMessage);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  };

  const abort = (): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const reset = (): void => {
    abort();
    setError(null);
    setResult(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    loading,
    error,
    result,
    generate,
    abort,
    reset,
  };
};

