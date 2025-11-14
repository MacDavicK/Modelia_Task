import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { SignupForm } from '../components/SignupForm.js';

export const SignupPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (email: string, password: string): Promise<void> => {
    setError('');
    setLoading(true);

    try {
      await signup(email, password);
      // Redirect to studio after successful signup
      navigate('/studio');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Create Account
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Join Mini AI Studio and start creating
        </p>

        <SignupForm onSubmit={handleSubmit} loading={loading} error={error} />
      </div>
    </div>
  );
};

