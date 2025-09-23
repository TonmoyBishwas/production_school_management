'use client';

import { useState } from 'react';

export default function ApiTest() {
  const [results, setResults] = useState<any>({});
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
      
      // Save token for subsequent tests
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
      }
      
      setResults((prev: any) => ({ ...prev, login: { status: response.status, data } }));
    } catch (error: any) {
      setResults((prev: any) => ({ ...prev, login: { error: error.message } }));
    }
    setLoading(false);
  };

  const testSchoolCreation = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/superadmin/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `Test School ${Date.now()}`,
          address: '123 Test Street',
          phone: '555-0123',
          email: 'test@testschool.com'
        })
      });
      
      const data = await response.json();
      setResults((prev: any) => ({ ...prev, schoolCreation: { status: response.status, data } }));
    } catch (error: any) {
      setResults((prev: any) => ({ ...prev, schoolCreation: { error: error.message } }));
    }
    setLoading(false);
  };

  const testDbConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setResults((prev: any) => ({ ...prev, database: { status: response.status, data } }));
    } catch (error: any) {
      setResults((prev: any) => ({ ...prev, database: { error: error.message } }));
    }
    setLoading(false);
  };

  const testEnvVars = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-env');
      const data = await response.json();
      setResults((prev: any) => ({ ...prev, environment: { status: response.status, data } }));
    } catch (error: any) {
      setResults((prev: any) => ({ ...prev, environment: { error: error.message } }));
    }
    setLoading(false);
  };

  return (
    <div className="p-5 font-mono">
      <h1 className="text-2xl font-bold mb-4">API Testing Page</h1>
      <p className="mb-4">Test the APIs directly to identify issues</p>
      
      <div className="mb-5 space-x-2">
        <button 
          onClick={testLogin} 
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Login
        </button>
        <button 
          onClick={testSchoolCreation} 
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test School Creation
        </button>
        <button 
          onClick={testDbConnection} 
          disabled={loading}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          Test Database
        </button>
        <button 
          onClick={testEnvVars} 
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Test Environment
        </button>
      </div>

      {loading && <p className="text-gray-600">Loading...</p>}

      <div className="mt-5">
        <h2 className="text-xl font-semibold mb-2">Results:</h2>
        <pre className="bg-gray-100 p-4 border rounded overflow-auto text-sm">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>

      <div className="mt-5 p-4 bg-gray-200 rounded">
        <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Test Login" first to get authentication token</li>
          <li>If login succeeds, click "Test School Creation" to see exact error</li>
          <li>Click "Test Database" to verify database connectivity</li>
          <li>Click "Test Environment" to check environment variables</li>
        </ol>
      </div>
    </div>
  );
}