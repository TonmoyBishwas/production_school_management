'use client';

export default function DebugPage() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🔍 Debug Page</h1>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#666', marginBottom: '10px' }}>✅ Client-Side Rendering Working</h2>
        <p>If you can see this page with styling, React hydration is working.</p>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#666', marginBottom: '10px' }}>🌐 Environment Check</h2>
        <p>Node ENV: {process.env.NODE_ENV || 'undefined'}</p>
        <p>Next.js Version: 14.2.11</p>
        <p>Current Time: {new Date().toISOString()}</p>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#666', marginBottom: '10px' }}>🔗 Navigation Test</h2>
        <a
          href="/login"
          style={{
            color: '#0066cc',
            textDecoration: 'underline',
            marginRight: '20px'
          }}
        >
          Go to Login Page
        </a>
        <a
          href="/"
          style={{
            color: '#0066cc',
            textDecoration: 'underline'
          }}
        >
          Go to Home Page
        </a>
      </div>
    </div>
  );
}