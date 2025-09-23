'use client';

import { useState } from 'react';

export default function DebugAuth() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'superadmin',
          password: 'super123'
        })
      });
      
      const data = await response.json();
      setResult({ 
        status: response.status,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const testDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setResult({ 
        status: response.status,
        data: data 
      });
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const testSchoolCreation = async () => {
    setLoading(true);
    try {
      // First login to get token
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'superadmin',
          password: 'super123'
        })
      });
      
      if (!loginResponse.ok) {
        throw new Error('Login failed');
      }
      
      const loginData = await loginResponse.json();
      
      // Now test school creation
      const response = await fetch('/api/superadmin/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`,
          'x-user-role': 'superadmin'
        },
        body: JSON.stringify({
          name: 'Test School',
          address: '123 Test St',
          phone: '123-456-7890',
          email: 'test@school.com'
        })
      });
      
      const data = await response.json();
      setResult({ 
        status: response.status,
        data: data 
      });
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication & API Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={testLogin}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Login
          </button>
          
          <button
            onClick={testDatabase}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test Database
          </button>
          
          <button
            onClick={testSchoolCreation}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Test School Creation
          </button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">Testing...</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Check:</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Database URL Set:</strong> {process.env.DATABASE_URL ? '✅ Yes' : '❌ No'}</p>
            <p><strong>JWT Secret Set:</strong> {process.env.JWT_SECRET ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}