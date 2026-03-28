import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';

interface UserFunctions {
  functions: Array<{
    id: string;
    name: string;
    description: string;
    module: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

export function usePermissions() {
  const [userFunctions, setUserFunctions] = useState<UserFunctions>({
    functions: [],
    isLoading: true,
    error: null,
  });

  const fetchUserFunctions = useCallback(async () => {
    try {
      console.log('🔍 usePermissions: Starting to fetch user functions...');
      setUserFunctions(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await apiService.getCurrentUserFunctions();
      console.log('🔍 usePermissions: API response:', response);
      if (response.success && response.data) {
        const functions = (response.data as UserFunctions['functions']) || [];
        console.log('🔍 usePermissions: Functions loaded:', functions.length);
        setUserFunctions({
          functions,
          isLoading: false,
          error: null,
        });
      } else {
        console.log('🔍 usePermissions: API response failed:', response);
        setUserFunctions(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to load permissions',
        }));
      }
    } catch (error) {
      console.error('🔍 usePermissions: Error fetching functions:', error);
      setUserFunctions(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load permissions',
      }));
    }
  }, []);

  useEffect(() => {
    fetchUserFunctions();
  }, [fetchUserFunctions]);

  const hasFunction = useCallback((functionName: string): boolean => {
    const result = userFunctions.functions.some(f => f.name === functionName);
    console.log(`🔍 usePermissions: hasFunction(${functionName}) = ${result} (available functions: ${userFunctions.functions.length})`);
    return result;
  }, [userFunctions.functions]);

  const hasAnyFunction = useCallback((functionNames: string[]): boolean => {
    return functionNames.some(name => hasFunction(name));
  }, [hasFunction]);

  const hasAllFunctions = useCallback((functionNames: string[]): boolean => {
    return functionNames.every(name => hasFunction(name));
  }, [hasFunction]);

  const hasModuleAccess = useCallback((module: string): boolean => {
    return userFunctions.functions.some(f => f.module === module);
  }, [userFunctions.functions]);

  return {
    functions: userFunctions.functions,
    isLoading: userFunctions.isLoading,
    error: userFunctions.error,
    hasFunction,
    hasAnyFunction,
    hasAllFunctions,
    hasModuleAccess,
    refresh: fetchUserFunctions,
  };
}

// Permission guard component
interface PermissionGuardProps {
  functionName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ functionName, children, fallback = null }: PermissionGuardProps) {
  const { hasFunction, isLoading } = usePermissions();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-32 rounded" />;
  }

  if (!hasFunction(functionName)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Multiple permissions guard
interface AnyPermissionGuardProps {
  functionNames: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AnyPermissionGuard({ functionNames, children, fallback = null }: AnyPermissionGuardProps) {
  const { hasAnyFunction, isLoading } = usePermissions();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-32 rounded" />;
  }

  if (!hasAnyFunction(functionNames)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Module access guard
interface ModuleGuardProps {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ModuleGuard({ module, children, fallback = null }: ModuleGuardProps) {
  const { hasModuleAccess, isLoading } = usePermissions();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-32 rounded" />;
  }

  if (!hasModuleAccess(module)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
