import { useEffect, useState } from "react";
import { tauriServerCommands } from "./tauri-server";

interface ServerStatus {
  running: boolean;
  message?: string;
  error?: string;
  health?: any;
  port: number;
  api_url?: string;
}

interface DesktopEnv {
  isDeskop: boolean;
  databasePath: string;
  apiUrl: string;
  serverStatus: ServerStatus;
  isServerReady: boolean;
}

let cachedDesktopEnv: DesktopEnv | null = null;

/**
 * Hook to get desktop environment info and manage server lifecycle
 */
export function useDesktopEnvironment() {
  const [env, setEnv] = useState<DesktopEnv | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDesktopEnvironmentInternal();
  }, []);

  const initializeDesktopEnvironmentInternal = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const isDesktop = isDesktopApp();

      if (!isDesktop) {
        setEnv({
          isDeskop: false,
          databasePath: "N/A",
          apiUrl: "http://localhost:3001/api",
          serverStatus: { running: false, port: 3001 },
          isServerReady: false,
        });
        setIsLoading(false);
        return;
      }

      const [dbPath, apiUrl] = await Promise.all([
        tauriServerCommands.getDatabasePath(),
        tauriServerCommands.getApiUrl(),
      ]);

      const status = await tauriServerCommands.getServerStatus();

      const desktopEnv: DesktopEnv = {
        isDeskop: true,
        databasePath: dbPath,
        apiUrl: `${apiUrl}/api`,
        serverStatus: status,
        isServerReady: status.running,
      };

      cachedDesktopEnv = desktopEnv;
      setEnv(desktopEnv);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to initialize desktop environment:", msg);
      setError(msg);
      setEnv(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    env,
    isLoading,
    error,
    reinitialize: initializeDesktopEnvironmentInternal,
  };
}

/**
 * Check if app is running in Tauri desktop environment
 */
export function isDesktopApp(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI__" in window;
}

/**
 * Get the API base URL (desktop or web)
 */
export function getApiBaseUrl(): string {
  if (cachedDesktopEnv?.isDeskop) {
    return cachedDesktopEnv.apiUrl;
  }

  return "http://localhost:3001/api";
}

/**
 * Get the database path (desktop only)
 */
export function getDatabasePath(): string | null {
  return cachedDesktopEnv?.databasePath || null;
}

/**
 * Monitor server health and sync status
 */
export function useServerHealthMonitor(intervalMs: number = 5000) {
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!isDesktopApp()) {
      setIsHealthy(true);
      return;
    }

    const checkHealth = async () => {
      try {
        const status = await tauriServerCommands.getServerStatus();
        setIsHealthy(status.running === true);
        setLastCheckTime(new Date());
      } catch (err) {
        console.warn("Health check failed:", err);
        setIsHealthy(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return { isHealthy, lastCheckTime };
}

/**
 * Initialize desktop environment on app startup
 */
export async function initializeDesktopApp(): Promise<{
  success: boolean;
  message: string;
  apiUrl?: string;
  databasePath?: string;
}> {
  try {
    if (!isDesktopApp()) {
      return { success: true, message: "Running in web mode" };
    }

    console.log("Initializing desktop app environment...");

    const [dbPath, apiUrl] = await Promise.all([
      tauriServerCommands.getDatabasePath(),
      tauriServerCommands.getApiUrl(),
    ]);

    console.log("Database path:", dbPath);
    console.log("API URL:", apiUrl);

    const status = await tauriServerCommands.getServerStatus();

    if (!status.running) {
      console.warn(
        "Server is not running, attempting to start...",
        status.error,
      );
      try {
        await tauriServerCommands.startServer();
        console.log("Server started successfully");
      } catch (startErr) {
        console.error("Failed to start server:", startErr);
        return {
          success: false,
          message: `Failed to start server: ${startErr}`,
        };
      }
    }

    cachedDesktopEnv = {
      isDeskop: true,
      databasePath: dbPath,
      apiUrl: `${apiUrl}/api`,
      serverStatus: status,
      isServerReady: true,
    };

    return {
      success: true,
      message: "Desktop environment initialized",
      apiUrl: cachedDesktopEnv.apiUrl,
      databasePath: dbPath,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Desktop initialization failed:", msg);
    return { success: false, message: `Initialization failed: ${msg}` };
  }
}

/**
 * Clean shutdown of desktop app
 */
export async function shutdownDesktopApp(): Promise<void> {
  try {
    if (isDesktopApp()) {
      console.log("Shutting down desktop app...");
      await tauriServerCommands.stopServer();
      console.log("Server stopped");
    }
  } catch (err) {
    console.warn("Error during shutdown:", err);
  }
}
