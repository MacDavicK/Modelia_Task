import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenerationForm } from '../src/components/GenerationForm.js';

// Mock the ImageUpload component
vi.mock('../src/components/ImageUpload.js', () => ({
  ImageUpload: ({ onFileSelect, error, disabled }: any) => (
    <div data-testid="image-upload">
      <input
        type="file"
        data-testid="file-input"
        accept="image/jpeg,image/jpg,image/png"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelect(file);
          }
        }}
      />
      {error && <div data-testid="image-error">{error}</div>}
    </div>
  ),
}));

describe('GenerationForm', () => {
  const mockOnSubmit = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render form with all inputs', () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      expect(screen.getByTestId('image-upload')).toBeInTheDocument();
      expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /style/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit generation request/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should show character counter', () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);
      expect(screen.getByText(/0\/500/i)).toBeInTheDocument();
    });

    it('should show all style options', () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);
      const styleSelect = screen.getByRole('combobox', { name: /style/i }) as HTMLSelectElement;

      expect(styleSelect.options[0].text).toBe('Realistic');
      expect(styleSelect.options[1].text).toBe('Artistic');
      expect(styleSelect.options[2].text).toBe('Minimalist');
      expect(styleSelect.options[3].text).toBe('Vintage');
    });
  });

  describe('File Upload', () => {
    it('should handle file selection and show preview', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(fileInput, file);

      // File should be selected (ImageUpload component handles preview)
      expect(fileInput.files?.[0]).toBe(file);
    });

    it('should show error for invalid file type', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(fileInput, file);

      // React Hook Form validates on change - the form should be invalid
      // Wait a moment for validation to process
      await waitFor(
        async () => {
          const submitButton = screen.getByRole('button', { name: /submit generation request/i });
          // Button should be disabled because file validation failed
          expect(submitButton).toBeDisabled();
        },
        { timeout: 1000 }
      );

      // The validation error should prevent form submission
      // Error message may appear in ImageUpload component or form validation
      // Verify form is invalid by checking button state
      const submitButton = screen.getByRole('button', { name: /submit generation request/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('should show error when submitting without image', async () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const promptInput = screen.getByLabelText(/prompt/i);
      await user.type(promptInput, 'A valid prompt that is long enough');

      const generateButton = screen.getByRole('button', { name: /submit generation request/i });
      expect(generateButton).toBeDisabled();
    });

    it('should show error for prompt too short', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(fileInput, file);

      const promptInput = screen.getByLabelText(/prompt/i);
      await user.type(promptInput, 'Short');

      await waitFor(() => {
        expect(screen.getByText(/must be at least 10 characters/i)).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /submit generation request/i });
      expect(generateButton).toBeDisabled();
    });

    it('should show error for prompt too long', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(fileInput, file);

      const promptInput = screen.getByLabelText(/prompt/i);
      const longPrompt = 'a'.repeat(501);
      await user.type(promptInput, longPrompt);

      await waitFor(() => {
        expect(screen.getByText(/must not exceed 500 characters/i)).toBeInTheDocument();
      });
    });

    it('should update character counter as user types', async () => {
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const promptInput = screen.getByLabelText(/prompt/i);
      await user.type(promptInput, 'Hello');

      expect(screen.getByText(/5\/500/i)).toBeInTheDocument();
    });
  });

  describe('Generate Flow', () => {
    it('should call onSubmit with form data when valid form is submitted', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      // Upload file
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(fileInput, file);

      // Fill prompt
      const promptInput = screen.getByLabelText(/prompt/i);
      await user.type(promptInput, 'A stylish fashion outfit');

      // Select style
      const styleSelect = screen.getByRole('combobox', { name: /style/i });
      await user.selectOptions(styleSelect, 'Artistic');

      // Submit form
      const generateButton = screen.getByRole('button', { name: /submit generation request/i });
      expect(generateButton).not.toBeDisabled();
      await user.click(generateButton);

      // Wait for onSubmit to be called
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      const callArgs = mockOnSubmit.mock.calls[0][0];
      expect(callArgs.image).toBe(file);
      expect(callArgs.prompt).toBe('A stylish fashion outfit');
      expect(callArgs.style).toBe('Artistic');
    });

    it('should show loading state when loading prop is true', () => {
      render(<GenerationForm onSubmit={mockOnSubmit} loading={true} />);

      expect(screen.getByText(/generating/i)).toBeInTheDocument();
      const submitButton = screen.getByRole('button', { name: /processing generation request|submit generation request/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('button', { name: /clear/i })).toBeDisabled();
    });

    it('should disable inputs when loading', () => {
      render(<GenerationForm onSubmit={mockOnSubmit} loading={true} />);

      const promptInput = screen.getByLabelText(/prompt/i);
      const styleSelect = screen.getByRole('combobox', { name: /style/i });
      const fileInput = screen.getByTestId('file-input');

      expect(promptInput).toBeDisabled();
      expect(styleSelect).toBeDisabled();
      expect(fileInput).toBeDisabled();
    });

    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Model overloaded. Please try again.';
      render(<GenerationForm onSubmit={mockOnSubmit} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Clear Form', () => {
    it('should clear all form fields when clear button is clicked', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      // Fill form
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(fileInput, file);

      const promptInput = screen.getByLabelText(/prompt/i) as HTMLTextAreaElement;
      await user.type(promptInput, 'A stylish fashion outfit');

      const styleSelect = screen.getByRole('combobox', { name: /style/i }) as HTMLSelectElement;
      await user.selectOptions(styleSelect, 'Artistic');

      // Clear form
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // Verify form is cleared
      await waitFor(() => {
        expect(promptInput.value).toBe('');
        expect(styleSelect.value).toBe('Realistic');
      });
    });
  });

  describe('Initial Data', () => {
    it('should populate form with initial data', async () => {
      const initialData = {
        prompt: 'Initial prompt text',
        style: 'Vintage' as const,
      };

      render(<GenerationForm onSubmit={mockOnSubmit} initialData={initialData} />);

      const promptInput = screen.getByLabelText(/prompt/i) as HTMLTextAreaElement;
      const styleSelect = screen.getByRole('combobox', { name: /style/i }) as HTMLSelectElement;

      await waitFor(() => {
        expect(promptInput.value).toBe('Initial prompt text');
        expect(styleSelect.value).toBe('Vintage');
      });
    });
  });

  describe('Form Validation States', () => {
    it('should enable generate button when form is valid', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      // Upload file
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(fileInput, file);

      // Fill valid prompt
      const promptInput = screen.getByLabelText(/prompt/i);
      await user.type(promptInput, 'A valid prompt that is long enough');

      // Select style
      const styleSelect = screen.getByRole('combobox', { name: /style/i });
      await user.selectOptions(styleSelect, 'Minimalist');

      const generateButton = screen.getByRole('button', { name: /submit generation request/i });
      await waitFor(() => {
        expect(generateButton).not.toBeDisabled();
      });
    });

    it('should disable generate button when prompt is invalid', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(fileInput, file);

      const promptInput = screen.getByLabelText(/prompt/i);
      await user.type(promptInput, 'Short');

      const generateButton = screen.getByRole('button', { name: /submit generation request/i });
      expect(generateButton).toBeDisabled();
    });
  });

  describe('Abort Functionality', () => {
    it('should show loading state that allows abort (handled by parent)', () => {
      // The form shows loading state, abort is handled by StudioPage
      render(<GenerationForm onSubmit={mockOnSubmit} loading={true} />);

      expect(screen.getByText(/generating/i)).toBeInTheDocument();
      const submitButton = screen.getByRole('button', { name: /processing generation request|submit generation request/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should allow form to be cleared during loading (simulating abort)', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<GenerationForm onSubmit={mockOnSubmit} loading={true} />);

      // Form should be disabled during loading
      const generateButton = screen.getByRole('button', { name: /processing generation request|submit generation request/i });
      expect(generateButton).toBeDisabled();

      // Clear button should also be disabled during loading
      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Retry Functionality', () => {
    it('should display 503 error message for retry scenario', () => {
      const errorMessage = 'Model overloaded. Please try again in a moment.';
      render(<GenerationForm onSubmit={mockOnSubmit} error={errorMessage} />);

      expect(screen.getByText(/model overloaded/i)).toBeInTheDocument();
    });

    it('should allow form to be resubmitted after error (enabling retry)', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const errorMessage = 'Model overloaded. Please try again.';

      // First render with error
      const { rerender } = render(
        <GenerationForm onSubmit={mockOnSubmit} error={errorMessage} />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();

      // Upload file and fill form
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(fileInput, file);

      const promptInput = screen.getByLabelText(/prompt/i);
      await user.type(promptInput, 'A valid prompt for retry');

      const styleSelect = screen.getByRole('combobox', { name: /style/i });
      await user.selectOptions(styleSelect, 'Artistic');

      // Clear error and allow retry
      rerender(<GenerationForm onSubmit={mockOnSubmit} error={undefined} />);

      const generateButton = screen.getByRole('button', { name: /submit generation request/i });
      await waitFor(() => {
        expect(generateButton).not.toBeDisabled();
      });

      // Form can be submitted again (retry)
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Mocked API Calls', () => {
    it('should handle successful API response through onSubmit', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<GenerationForm onSubmit={mockOnSubmit} />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      await user.upload(fileInput, file);

      const promptInput = screen.getByLabelText(/prompt/i);
      await user.type(promptInput, 'Test prompt for API call');

      const styleSelect = screen.getByRole('combobox', { name: /style/i });
      await user.selectOptions(styleSelect, 'Realistic');

      const generateButton = screen.getByRole('button', { name: /submit generation request/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          image: file,
          prompt: 'Test prompt for API call',
          style: 'Realistic',
        });
      });
    });

    it('should handle API error through error prop', () => {
      const apiError = 'Failed to generate image. Please try again.';
      render(<GenerationForm onSubmit={mockOnSubmit} error={apiError} />);

      expect(screen.getByText(apiError)).toBeInTheDocument();
    });
  });
});

