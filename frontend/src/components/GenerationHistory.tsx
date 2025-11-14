import { useState, useEffect } from 'react';
import { getUserGenerations } from '../api/generation.js';
import type { Generation } from '../types/generation.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface GenerationHistoryProps {
  onRestore?: (generation: Generation) => void;
  refreshTrigger?: number;
}

export const GenerationHistory = ({ onRestore, refreshTrigger }: GenerationHistoryProps): JSX.Element => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGenerations = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserGenerations(5);
      setGenerations(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load generation history';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();
  }, [refreshTrigger]);

  const getImageUrl = (imageUrl: string): string => {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${imageUrl}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(date);
  };

  const truncatePrompt = (prompt: string, maxLength: number = 50): string => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  const getStyleBadgeColor = (style: string): string => {
    const colors: Record<string, string> = {
      Realistic: 'bg-blue-100 text-blue-800',
      Artistic: 'bg-purple-100 text-purple-800',
      Minimalist: 'bg-gray-100 text-gray-800',
      Vintage: 'bg-amber-100 text-amber-800',
    };
    return colors[style] || 'bg-gray-100 text-gray-800';
  };

  const handleCardClick = (generation: Generation): void => {
    if (onRestore) {
      onRestore(generation);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Generations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-gray-200 animate-pulse rounded-lg h-48"
              role="status"
              aria-label="Loading"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Generations</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Generations</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500">No generations yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first generation to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Recent Generations</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {generations.map((generation, index) => (
          <div
            key={generation.id}
            onClick={() => handleCardClick(generation)}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary-300"
            style={{
              animation: `fadeIn 0.3s ease-out ${index * 50}ms both`,
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(generation);
              }
            }}
            aria-label={`Restore generation: ${generation.prompt} in ${generation.style} style`}
          >
            <div className="relative aspect-square bg-gray-100">
              <img
                src={getImageUrl(generation.imageUrl)}
                alt={`Generated image: ${generation.prompt} in ${generation.style} style`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 space-y-2">
              <p className="text-sm text-gray-900" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {truncatePrompt(generation.prompt)}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStyleBadgeColor(
                    generation.style
                  )}`}
                >
                  {generation.style}
                </span>
                <span className="text-xs text-gray-500">{formatDate(generation.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

