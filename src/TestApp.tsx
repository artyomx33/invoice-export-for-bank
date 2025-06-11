import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f0f0f0',
      color: '#333',
      fontSize: '24px',
      fontFamily: 'sans-serif'
    }}>
      <p>Test App - If you see this, React is working!</p>
    </div>
  );
};

export default TestApp;
