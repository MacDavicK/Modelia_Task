import { Link } from 'react-router-dom';

export const NotFoundPage = (): JSX.Element => {
  return (
    <div className="max-w-md mx-auto text-center mt-20">
      <div className="bg-white rounded-lg shadow-md p-12">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

