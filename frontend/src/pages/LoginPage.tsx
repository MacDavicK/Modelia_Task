import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { LoginForm } from '../components/LoginForm.js';

export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (email: string, password: string): Promise<void> => {
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Redirect to studio after successful login
      navigate('/studio');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Welcome Back
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to continue to Mini AI Studio
        </p>

        <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />
      </div>
    </div>
  );
};

