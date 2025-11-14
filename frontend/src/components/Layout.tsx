import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import type { ReactNode } from 'react';

interface LayoutProps {
  children?: ReactNode;
}

export const Layout = ({ children }: LayoutProps): JSX.Element => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = (): void => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl md:text-2xl font-bold text-primary-600">
                🎨 Mini AI Studio
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/studio"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Studio
                  </Link>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 hidden lg:inline">
                      {user?.email || 'User'}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="flex flex-col space-y-3">
                  <Link
                    to="/studio"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Studio
                  </Link>
                  <div className="px-3 py-2 text-sm text-gray-600">
                    {user?.email || 'User'}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium text-left"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};

