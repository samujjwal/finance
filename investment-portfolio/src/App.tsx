import { useEffect, useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SetupWizard } from "@/components/auth/SetupWizard";
import { CompanyList } from "@/components/companies/CompanyList";
import { TransactionList } from "@/components/transactions/TransactionList";
import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { UnifiedDashboard } from "@/components/dashboard/UnifiedDashboard";
import { CombinedReports } from "@/components/reports/CombinedReports";
import { ServerStatusIndicator } from "@/components/common/ServerStatusIndicator";
import { RootMaintenanceView } from "@/components/admin/RootMaintenanceView";
import { useAuthStore } from "@/stores/authStore";
import { isDevelopment } from "@/utils/environment";
import { apiService } from "@/services/api";
import { initializeDesktopApp } from "@/services/desktop-environment";

type Tab = 'dashboard' | 'portfolio' | 'transactions' | 'reports' | 'companies' | 'maintenance';

function App() {
  const { isAuthenticated, checkAuth, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  // null = still querying; true = first-run wizard required; false = normal
  const [firstRun, setFirstRun] = useState<boolean | null>(null);
  const [appReady, setAppReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Initialize desktop environment first (if running in Tauri)
    const initApp = async () => {
      try {
        await initializeDesktopApp();
      } catch (err) {
        console.warn('Desktop initialization warning:', err);
      }

      // Check setup status FIRST (without authentication) – decides whether to show wizard
      try {
        const res = await apiService.getSetupStatus();
        const debugMsg = `Setup status: ${JSON.stringify(res)}`;
        console.log(debugMsg);
        setDebugInfo(debugMsg);
        if (res.success && res.data) {
          const isFirstRun = (res.data as any).firstRun === true;
          setFirstRun(isFirstRun);
          setDebugInfo(prev => prev + ` | firstRun=${isFirstRun}`);
        } else {
          setFirstRun(false);
          setDebugInfo(prev => prev + ' | firstRun=false (no data)');
        }
      } catch (err) {
        const errorMsg = `Setup error: ${err}`;
        console.error(errorMsg);
        setDebugInfo(errorMsg);
        setFirstRun(false);
      }

      // Now check auth (after setup status)
      await checkAuth();
      
      setAppReady(true);
    };

    initApp();
  }, [checkAuth]);

  // While we're waiting for the setup-status response, show nothing (or a spinner)
  if (firstRun === null || !appReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 text-sm">Loading…</div>
          <div className="text-xs text-gray-400 mt-2">{debugInfo}</div>
        </div>
      </div>
    );
  }

  // First-run: show the setup wizard (it handles its own login/registration)
  if (firstRun) {
    return <SetupWizard onComplete={() => setFirstRun(false)} />;
  }

  // Not authenticated: show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              JCL Investment Portfolio
            </h1>
            <p className="text-gray-600 mt-2">Sign in to access your portfolio</p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  const isRootUser = user?.role === 'ROOT' || user?.username === 'root';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <UnifiedDashboard onNavigate={setActiveTab} />;
      case 'portfolio':
        return <PortfolioView />;
      case 'transactions':
        return <TransactionList />;
      case 'reports':
        return <CombinedReports />;
      case 'companies':
        return <CompanyList />;
      case 'maintenance':
        return isRootUser ? <RootMaintenanceView /> : <UnifiedDashboard />;
      default:
        return <UnifiedDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              JCL Investment Portfolio
            </h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm text-gray-600">
                Welcome, {user?.username}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${isDevelopment()
                ? 'bg-orange-100 text-orange-800'
                : 'bg-green-100 text-green-800'
                }`}>
                {isDevelopment() ? 'Development' : 'Production'}
              </span>
              <ServerStatusIndicator />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'dashboard', name: 'Dashboard' },
                { id: 'portfolio', name: 'Portfolio' },
                { id: 'transactions', name: 'Transactions' },
                { id: 'reports', name: 'Reports' },
                { id: 'companies', name: 'Companies' },
                ...(isRootUser ? [{ id: 'maintenance', name: 'Root Actions' }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
