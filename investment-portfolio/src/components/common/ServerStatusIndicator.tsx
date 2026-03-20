import { useEffect, useState } from 'react';
import { tauriServerCommands } from '@/services/tauri-server';

/**
 * Component to display server status indicator
 */
export function ServerStatusIndicator() {
    const [isHealthy, setIsHealthy] = useState(true);
    const [isDesktop, setIsDesktop] = useState(false);
    const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

    useEffect(() => {
        // Check if we're in desktop environment
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
            setIsDesktop(true);

            const checkHealth = async () => {
                try {
                    const status = await tauriServerCommands.getServerStatus();
                    setIsHealthy(status.running === true);
                    setLastCheckTime(new Date());
                } catch (err) {
                    console.warn('Health check failed:', err);
                    setIsHealthy(false);
                }
            };

            // Check immediately
            checkHealth();

            // Set up periodic checks (every 5 seconds)
            const interval = setInterval(checkHealth, 5000);

            return () => clearInterval(interval);
        }
    }, []);

    if (!isDesktop) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 rounded">
            <div
                className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
            />
            <span className={isHealthy ? 'text-green-700' : 'text-red-700'}>
                {isHealthy ? 'Server running' : 'Server offline'}
            </span>
            {lastCheckTime && (
                <span className="text-gray-500">{lastCheckTime.toLocaleTimeString()}</span>
            )}
        </div>
    );
}
