import React, { useEffect, useState } from 'react';

function App() {
  const [backendMessage, setBackendMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:8080/api/health')
      .then(response => response.json())
      .then(data => {
        setBackendMessage(data.content);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to connect to backend');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Real-Time Chat App
        </h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Backend Connection Status:
          </h2>
          {loading ? (
            <p className="text-gray-600">Connecting...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p className="text-green-600 font-medium">{backendMessage}</p>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Tech Stack:</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">React</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">TypeScript</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Tailwind CSS</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Go</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
