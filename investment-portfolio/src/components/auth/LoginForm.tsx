import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { LoginRequest } from '@/types/api';
import { Lock, AlertCircle, Clock } from 'lucide-react';

export function LoginForm() {
  const [credentials, setCredentials] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { login, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      await login(credentials);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Determine error type for customized display
  const getErrorDetails = (error: string | null) => {
    if (!error) return null;

    const errorLower = error.toLowerCase();

    if (errorLower.includes('locked')) {
      return {
        type: 'locked',
        icon: <Lock className="w-5 h-5 text-red-600" />,
        title: 'Account Locked',
        message: error,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
      };
    }

    if (errorLower.includes('pending approval')) {
      return {
        type: 'pending',
        icon: <Clock className="w-5 h-5 text-yellow-600" />,
        title: 'Account Pending Approval',
        message: error,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
      };
    }

    if (errorLower.includes('suspended') || errorLower.includes('rejected') || errorLower.includes('inactive')) {
      return {
        type: 'suspended',
        icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
        title: 'Account Access Denied',
        message: error,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
      };
    }

    // Default error
    return {
      type: 'error',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      title: 'Login Failed',
      message: error,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
    };
  };

  const errorDetails = getErrorDetails(typeof error === 'string' ? error : null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              JCL Investment Portfolio
            </CardTitle>
            <CardDescription>
              Sign in to manage your investment portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  value={credentials.username}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your username (min 3 chars)"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  maxLength={10}
                  value={credentials.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your password (6-10 chars)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Password must contain uppercase, lowercase, and a number
                </p>
              </div>

              {errorDetails && (
                <div className={`${errorDetails.bgColor} ${errorDetails.borderColor} border rounded-lg p-4`}>
                  <div className="flex items-start space-x-3">
                    {errorDetails.icon}
                    <div>
                      <h4 className={`font-semibold ${errorDetails.textColor}`}>
                        {errorDetails.title}
                      </h4>
                      <p className={`text-sm mt-1 ${errorDetails.textColor}`}>
                        {errorDetails.message}
                      </p>
                      {errorDetails.type === 'locked' && (
                        <p className="text-xs text-gray-600 mt-2">
                          Please contact your system administrator to unlock your account.
                        </p>
                      )}
                      {errorDetails.type === 'pending' && (
                        <p className="text-xs text-gray-600 mt-2">
                          Your account is awaiting administrator approval. You will be notified once approved.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || errorDetails?.type === 'locked'}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Demo: Use any username (3+ chars) and password (6+ chars) to create an account
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
