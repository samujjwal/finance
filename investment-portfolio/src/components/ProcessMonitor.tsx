import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ProcessStatus {
  node_running: boolean;
  backend_running: boolean;
  last_restart: string;
}

export const ProcessMonitor: React.FC = () => {
  const [status, setStatus] = useState<ProcessStatus>({
    node_running: false,
    backend_running: false,
    last_restart: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const result = await invoke<ProcessStatus>('get_process_status');
      setStatus(result);
      setError(null);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const restartBackend = async () => {
    try {
      setLoading(true);
      await invoke('force_restart_backend');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for restart
      await checkStatus();
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4">Backend Process Status</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className={`p-3 rounded ${status.node_running ? 'bg-green-100' : 'bg-red-100'}`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${status.node_running ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">Node.js Runtime</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {status.node_running ? 'Running' : 'Stopped'}
          </div>
        </div>

        <div className={`p-3 rounded ${status.backend_running ? 'bg-green-100' : 'bg-red-100'}`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${status.backend_running ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">Backend Server</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {status.backend_running ? 'Running' : 'Stopped'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Last restart: {new Date(status.last_restart).toLocaleString()}
        </div>
        <button
          onClick={restartBackend}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
        >
          {loading ? 'Restarting...' : 'Restart Backend'}
        </button>
      </div>
    </div>
  );
};
