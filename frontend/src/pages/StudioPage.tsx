import { useAuth } from '../context/AuthContext.js';

export const StudioPage = (): JSX.Element => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          AI Image Generation Studio
        </h1>
        <p className="text-gray-600 mb-8">
          Welcome, {user?.email || 'User'}! Start creating amazing images.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-500">Studio features coming soon...</p>
          <p className="text-sm text-gray-400 mt-2">
            Upload images, add prompts, and generate styled variations
          </p>
        </div>
      </div>
    </div>
  );
};

