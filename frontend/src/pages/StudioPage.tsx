import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { GenerationForm } from '../components/GenerationForm.js';
import { useGeneration } from '../hooks/useGeneration.js';
import type { GenerationFormData } from '../types/generation.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const StudioPage = (): JSX.Element => {
  const { user } = useAuth();
  const { loading, error, result, generate, abort, reset } = useGeneration();
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastFormData, setLastFormData] = useState<GenerationFormData | null>(null);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  const MAX_RETRIES = 3;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleSubmit = async (data: GenerationFormData): Promise<void> => {
    setLastFormData(data);
    setRetryCount(0);
    await generate(data.image, data.prompt, data.style);
  };

  const handleRetry = async (): Promise<void> => {
    if (!lastFormData || retryCount >= MAX_RETRIES) {
      return;
    }

    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);

    // Exponential backoff: delay = 1000 * 2^retryCount ms
    const delay = 1000 * Math.pow(2, retryCount);
    
    const timeout = setTimeout(async () => {
      await generate(lastFormData.image, lastFormData.prompt, lastFormData.style);
    }, delay);

    setRetryTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  // Reset retry count on successful generation
  useEffect(() => {
    if (result) {
      setRetryCount(0);
      setLastFormData(null);
    }
  }, [result]);

  const getImageUrl = (imageUrl: string): string => {
    // If imageUrl is already a full URL, return it
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Otherwise, prepend the base URL
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${imageUrl}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Image Generation Studio</h1>
        <p className="text-gray-600">Welcome, {user?.email || 'User'}! Create amazing styled images.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Generation</h2>
          <GenerationForm onSubmit={handleSubmit} loading={loading} error={error || undefined} />
        </div>

        {/* Right Column: Result */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Result</h2>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg
                className="animate-spin h-12 w-12 text-primary-600 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-600 mb-4">Generating...</p>
              <button
                onClick={abort}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                Abort
              </button>
            </div>
          )}

          {error && !loading && (
            <div className="py-12 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              {retryCount < MAX_RETRIES && lastFormData && (
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
                >
                  Retry ({MAX_RETRIES - retryCount} attempts left)
                </button>
              )}
              {retryCount >= MAX_RETRIES && (
                <p className="text-sm text-gray-500 mt-2">Maximum retry attempts reached</p>
              )}
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={getImageUrl(result.imageUrl)}
                  alt="Generated image"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Prompt</p>
                  <p className="text-gray-900">{result.prompt}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Style</p>
                  <p className="text-gray-900">{result.style}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-gray-900">{formatDate(result.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Clear Result
              </button>
            </div>
          )}

          {!loading && !error && !result && (
            <div className="py-12 text-center text-gray-500">
              <p>Your generated image will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
