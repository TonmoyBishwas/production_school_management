export default function TestSimple() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <h1 style={{
        fontSize: '24px',
        color: '#000000',
        marginBottom: '16px'
      }}>
        Simple Test Page
      </h1>
      <p style={{
        fontSize: '16px',
        color: '#666666'
      }}>
        This page should work without any environment variables or client-side JavaScript.
      </p>
      <div style={{
        marginTop: '20px',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        Current timestamp: {new Date().toISOString()}
      </div>
    </div>
  );
}