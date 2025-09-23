'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token
        localStorage.setItem('token', data.token);
        document.cookie = `token=${data.token}; path=/; max-age=28800`; // 8 hours
        
        // Redirect based on role
        const roleRedirects = {
          superadmin: '/superadmin',
          admin: '/admin',
          teacher: '/teacher',
          student: '/student',
          parent: '/parent',
          accountant: '/accountant'
        };
        
        const redirectPath = roleRedirects[data.user.role as keyof typeof roleRedirects] || '/';
        router.push(redirectPath);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">School.com</h1>
          <p className="text-gray-600 mt-2">Professional School Management System</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-w-md mx-auto p-6" data-testid="login-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" data-testid="error-message">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                data-testid="username-input"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                data-testid="password-input"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="login-button"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-600">
              <h3 className="font-medium mb-3">Default Login Credentials:</h3>
              <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                <div><strong>Superadmin:</strong> superadmin / super123</div>
                <div><em>Other accounts created via registration</em></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}