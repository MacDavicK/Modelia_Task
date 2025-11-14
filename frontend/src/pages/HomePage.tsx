import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export const HomePage = (): JSX.Element => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="text-center py-20">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">
        🎨 Mini AI Studio
      </h1>
      <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
        Create stunning AI-generated fashion images with style. Upload your images,
        add creative prompts, and watch the magic happen.
      </p>

      {isAuthenticated ? (
        <Link
          to="/studio"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-md transition-colors text-lg"
        >
          Go to Studio
        </Link>
      ) : (
        <div className="flex justify-center space-x-4">
          <Link
            to="/login"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-md transition-colors text-lg"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-8 rounded-md transition-colors text-lg"
          >
            Sign Up
          </Link>
        </div>
      )}

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-xl font-semibold mb-2">Upload Images</h3>
          <p className="text-gray-600">
            Drag and drop your fashion images to get started
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-4">✍️</div>
          <h3 className="text-xl font-semibold mb-2">Add Prompts</h3>
          <p className="text-gray-600">
            Describe the style you want with creative prompts
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold mb-2">Generate</h3>
          <p className="text-gray-600">
            Watch AI transform your images with amazing styles
          </p>
        </div>
      </div>
    </div>
  );
};

