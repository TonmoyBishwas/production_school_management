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
      
      setResults(prev => ({ ...prev, login: { status: response.status, data } }));
    } catch (error) {
      setResults(prev => ({ ...prev, login: { error: error.message } }));
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
      setResults(prev => ({ ...prev, schoolCreation: { status: response.status, data } }));
    } catch (error) {
      setResults(prev => ({ ...prev, schoolCreation: { error: error.message } }));
    }
    setLoading(false);
  };

  const testDbConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setResults(prev => ({ ...prev, database: { status: response.status, data } }));
    } catch (error) {
      setResults(prev => ({ ...prev, database: { error: error.message } }));
    }
    setLoading(false);
  };

  const testEnvVars = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-env');
      const data = await response.json();
      setResults(prev => ({ ...prev, environment: { status: response.status, data } }));
    } catch (error) {
      setResults(prev => ({ ...prev, environment: { error: error.message } }));
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>API Testing Page</h1>
      <p>Test the APIs directly to identify issues</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testLogin} disabled={loading} style={{ marginRight: '10px', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test Login
        </button>
        <button onClick={testSchoolCreation} disabled={loading} style={{ marginRight: '10px', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test School Creation
        </button>
        <button onClick={testDbConnection} disabled={loading} style={{ marginRight: '10px', padding: '10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}>
          Test Database
        </button>
        <button onClick={testEnvVars} disabled={loading} style={{ padding: '10px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test Environment
        </button>
      </div>

      {loading && <p>Loading...</p>}

      <div style={{ marginTop: '20px' }}>
        <h2>Results:</h2>
        <pre style={{ background: '#f8f9fa', padding: '15px', border: '1px solid #dee2e6', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e9ecef', borderRadius: '4px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Click "Test Login" first to get authentication token</li>
          <li>If login succeeds, click "Test School Creation" to see exact error</li>
          <li>Click "Test Database" to verify database connectivity</li>
          <li>Click "Test Environment" to check environment variables</li>
        </ol>
      </div>
    </div>
  );
}