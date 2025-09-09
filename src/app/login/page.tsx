'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';

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
          <h1 className="text-3xl font-bold text-primary">School.com</h1>
          <p className="text-gray-600 mt-2">Professional School Management System</p>
        </div>

        <Card className="max-w-md mx-auto" testId="login-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" data-testid="error-message">
                {error}
              </div>
            )}

            <Input
              label="Username"
              type="text"
              value={username}
              onChange={setUsername}
              placeholder="Enter your username"
              required
              testId="username-input"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              required
              testId="password-input"
            />

            <Button
              type="submit"
              loading={loading}
              testId="login-button"
              className="w-full"
            >
              Sign In
            </Button>
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
        </Card>
      </div>
    </div>
  );
}