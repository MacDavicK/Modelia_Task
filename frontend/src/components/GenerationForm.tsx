import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { ImageUpload } from './ImageUpload.js';
import type { GenerationFormData, GenerationStyle } from '../types/generation.js';

interface GenerationFormProps {
  onSubmit: (data: GenerationFormData) => void;
  loading?: boolean;
  error?: string;
  initialData?: Partial<GenerationFormData>;
}

const STYLE_OPTIONS: GenerationStyle[] = ['Realistic', 'Artistic', 'Minimalist', 'Vintage'];

export const GenerationForm = ({
  onSubmit,
  loading = false,
  error,
  initialData,
}: GenerationFormProps): JSX.Element => {
  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<GenerationFormData>({
    mode: 'onChange',
    defaultValues: {
      prompt: initialData?.prompt || '',
      style: initialData?.style || 'Realistic',
    },
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      if (initialData.prompt) {
        setValue('prompt', initialData.prompt, { shouldValidate: true });
      }
      if (initialData.style) {
        setValue('style', initialData.style, { shouldValidate: true });
      }
    }
  }, [initialData, setValue]);

  const prompt = watch('prompt');
  const promptLength = prompt?.length || 0;
  const imageFile = watch('image');

  const handleFormSubmit = (data: GenerationFormData): void => {
    if (!data.image) {
      return;
    }
    onSubmit(data);
  };

  const handleClear = (): void => {
    reset({
      prompt: '',
      style: 'Realistic',
      image: undefined as any,
    });
  };

  const isFormValid = 
    !errors.prompt && 
    !errors.style && 
    !errors.image && 
    imageFile && 
    promptLength >= 10 && 
    promptLength <= 500;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <Controller
          name="image"
          control={control}
          rules={{
            required: 'Image is required',
            validate: (file: File | undefined) => {
              if (!file) return 'Image is required';
              const maxSize = 10 * 1024 * 1024; // 10MB
              const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
              if (!allowedTypes.includes(file.type)) {
                return 'Only JPEG and PNG images are allowed';
              }
              if (file.size > maxSize) {
                return 'File size must not exceed 10MB';
              }
              return true;
            },
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <ImageUpload
              onFileSelect={(file) => onChange(file)}
              error={error?.message}
              disabled={loading}
            />
          )}
        />
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Prompt
        </label>
        <textarea
          id="prompt"
          {...register('prompt', {
            required: 'Prompt is required',
            minLength: {
              value: 10,
              message: 'Prompt must be at least 10 characters long',
            },
            maxLength: {
              value: 500,
              message: 'Prompt must not exceed 500 characters',
            },
          })}
          rows={4}
          disabled={loading}
          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed resize-none ${
            errors.prompt ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe the style you want (10-500 characters)..."
          aria-invalid={!!errors.prompt}
          aria-describedby={errors.prompt ? 'prompt-error' : 'prompt-counter'}
        />
        <div className="flex justify-between items-center mt-1">
          <div>
            {errors.prompt && (
              <p id="prompt-error" className="text-sm text-red-600" role="alert">
                {errors.prompt.message}
              </p>
            )}
          </div>
          <p
            id="prompt-counter"
            className={`text-xs ${promptLength > 500 ? 'text-red-600' : 'text-gray-500'}`}
          >
            {promptLength}/500
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
          Style
        </label>
        <select
          id="style"
          {...register('style', {
            required: 'Style is required',
          })}
          disabled={loading}
          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.style ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.style}
          aria-describedby={errors.style ? 'style-error' : undefined}
        >
          {STYLE_OPTIONS.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
        {errors.style && (
          <p id="style-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.style.message}
          </p>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
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
              <span>Generating...</span>
            </>
          ) : (
            <span>Generate</span>
          )}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </form>
  );
};

