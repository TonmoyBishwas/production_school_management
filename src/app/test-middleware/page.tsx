'use client';

import { useState } from 'react';

export default function TestMiddleware() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testAccess = async () => {
    setLoading(true);
    setResult('Testing /superadmin access...');

    try {
      const token = localStorage.getItem('token');
      console.log('Using token:', token);

      const response = await fetch('/superadmin', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': document.cookie
        }
      });

      setResult(`
Status: ${response.status}
Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}
URL: ${response.url}
      `);

      if (response.ok) {
        const text = await response.text();
        setResult(prev => prev + '\n\n✅ Access successful!\nResponse length: ' + text.length);
      } else {
        setResult(prev => prev + '\n\n❌ Access denied');
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Middleware Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Token in localStorage: {localStorage.getItem('token')?.substring(0, 50)}...</p>
        <p>Cookies: {document.cookie}</p>
      </div>

      <button
        onClick={testAccess}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test /superadmin Access'}
      </button>

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {result}
        </div>
      )}
    </div>
  );
}