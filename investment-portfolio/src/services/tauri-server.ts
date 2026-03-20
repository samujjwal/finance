import { invoke } from '@tauri-apps/api/core';
import React from 'react';

export const tauriServerCommands = {
  /**
   * Start the backend server
   */
  async startServer(): Promise<string> {
    return await invoke('start_server');
  },

  /**
   * Stop the backend server
   */
  async stopServer(): Promise<string> {
    return await invoke('stop_server');
  },

  /**
   * Check if server is running
   */
  async isServerRunning(): Promise<boolean> {
    return await invoke('is_server_running');
  },

  /**
   * Get comprehensive server status including health check
   */
  async getServerStatus(): Promise<{
    running: boolean;
    message?: string;
    error?: string;
    health?: any;
    port: number;
    api_url?: string;
  }> {
    return await invoke('get_server_status');
  },

  /**
   * Get the database path
   */
  async getDatabasePath(): Promise<string> {
    return await invoke('get_database_path');
  },

  /**
   * Get the API URL
   */
  async getApiUrl(): Promise<string> {
    return await invoke('get_api_url');
  },
};

/**
 * Hook to manage server status with auto-start
 */
export function useServerStatus() {
  const [isRunning, setIsRunning] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);
  const [apiUrl, setApiUrl] = React.useState('http://localhost:3001');

  React.useEffect(() => {
    checkAndStartServer();
  }, []);

  const checkAndStartServer = async () => {
    try {
      setIsChecking(true);

      // Check if server is already running
      const running = await tauriServerCommands.isServerRunning();
      
      if (!running) {
        console.log('Server not running, starting...');
        await tauriServerCommands.startServer();
        // Give server time to fully initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setIsRunning(true);
      const url = await tauriServerCommands.getApiUrl();
      setApiUrl(url);
    } catch (error) {
      console.error('Failed to manage server:', error);
      setIsRunning(false);
    } finally {
      setIsChecking(false);
    }
  };

  return { isRunning, isChecking, apiUrl, checkAndStartServer };
}

export default tauriServerCommands;
