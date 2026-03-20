// Simple environment configuration - single backend approach
export function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return "http://localhost:3001/api";
  }
  return import.meta.env.VITE_API_URL || "http://localhost:3001/api";
}

export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/** Returns true when running inside a Tauri desktop window */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}
