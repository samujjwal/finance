import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../src/App';

// Mock the API service
vi.mock('../src/services/api', () => ({
  apiService: {
    getSetupStatus: vi.fn().mockResolvedValue({
      success: true,
      data: { firstRun: false, userCount: 3 }
    }),
    login: vi.fn().mockResolvedValue({
      success: true,
      data: {
        user: { username: 'admin', role: 'ADMIN' },
        token: 'mock-token'
      }
    }),
    getUsers: vi.fn().mockResolvedValue({
      success: true,
      data: { users: [], total: 0 }
    }),
    getPendingApprovals: vi.fn().mockResolvedValue({
      success: true,
      data: []
    }),
    getRoles: vi.fn().mockResolvedValue({
      success: true,
      data: []
    })
  }
}));

// Mock the auth store
vi.mock('../src/stores/authStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn()
  })
}));

// Mock desktop environment
vi.mock('../src/services/desktop-environment', () => ({
  initializeDesktopApp: vi.fn().mockResolvedValue(undefined),
  isDesktopApp: () => false
}));

// Mock environment utils
vi.mock('../src/utils/environment', () => ({
  isDevelopment: () => true
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Load', () => {
    test('should show loading state initially', () => {
      renderApp();
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    test('should show login form after setup check', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText('JCL Investment Portfolio')).toBeInTheDocument();
        expect(screen.getByText('Sign in to access your portfolio')).toBeInTheDocument();
      });
    });

    test('should display login form elements', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Structure', () => {
    test('should render main navigation tabs', async () => {
      renderApp();
      
      await waitFor(() => {
        const tabs = ['Dashboard', 'Portfolio', 'Transactions', 'Reports', 'Companies'];
        tabs.forEach(tab => {
          expect(screen.getByRole('button', { name: tab })).toBeInTheDocument();
        });
      });
    });

    test('should show admin tab for admin users', async () => {
      // Mock admin user
      const { useAuthStore } = await import('../src/stores/authStore');
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'admin', role: 'ADMIN' },
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn()
      });

      renderApp();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument();
      });
    });

    test('should show root actions for root users', async () => {
      // Mock root user
      const { useAuthStore } = await import('../src/stores/authStore');
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'root', role: 'ROOT' },
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn()
      });

      renderApp();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Root Actions' })).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(async () => {
      // Mock authenticated user
      const { useAuthStore } = await import('../src/stores/authStore');
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'admin', role: 'ADMIN' },
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn()
      });
    });

    test('should switch between tabs when clicked', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
      });

      // Click Portfolio tab
      fireEvent.click(screen.getByRole('button', { name: 'Portfolio' }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Portfolio' })).toHaveClass(/border-indigo-500/);
      });

      // Click Transactions tab
      fireEvent.click(screen.getByRole('button', { name: 'Transactions' }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Transactions' })).toHaveClass(/border-indigo-500/);
      });
    });

    test('should maintain active tab state', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
      });

      // Dashboard should be active initially
      expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveClass(/border-indigo-500/);
      
      // Click Reports tab
      fireEvent.click(screen.getByRole('button', { name: 'Reports' }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Reports' })).toHaveClass(/border-indigo-500/);
        expect(screen.getByRole('button', { name: 'Dashboard' })).not.toHaveClass(/border-indigo-500/);
      });
    });
  });

  describe('User Interface', () => {
    beforeEach(async () => {
      // Mock authenticated user
      const { useAuthStore } = await import('../src/stores/authStore');
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'admin', role: 'ADMIN' },
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn()
      });
    });

    test('should display user information', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText(/Welcome, admin/)).toBeInTheDocument();
        expect(screen.getByText(/Development/)).toBeInTheDocument();
      });
    });

    test('should have logout button', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });
    });

    test('should show server status indicator', async () => {
      renderApp();
      
      await waitFor(() => {
        // Check for server status component
        expect(screen.getByTestId('server-status') || document.querySelector('[class*="status"]')).toBeInTheDocument();
      });
    });
  });

  describe('Content Rendering', () => {
    beforeEach(async () => {
      // Mock authenticated user
      const { useAuthStore } = await import('../src/stores/authStore');
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: { username: 'admin', role: 'ADMIN' },
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn()
      });
    });

    test('should render dashboard content by default', async () => {
      renderApp();
      
      await waitFor(() => {
        // Check for dashboard content
        expect(screen.getByText(/Portfolio Overview/) || document.querySelector('[class*="dashboard"]')).toBeInTheDocument();
      });
    });

    test('should render portfolio content when portfolio tab is clicked', async () => {
      renderApp();
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Portfolio' }));
      });

      await waitFor(() => {
        // Check for portfolio content
        expect(screen.getByText(/Portfolio/) || document.querySelector('[class*="portfolio"]')).toBeInTheDocument();
      });
    });

    test('should render transaction content when transactions tab is clicked', async () => {
      renderApp();
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Transactions' }));
      });

      await waitFor(() => {
        // Check for transaction content
        expect(screen.getByText(/Transactions/) || document.querySelector('[class*="transaction"]')).toBeInTheDocument();
      });
    });

    test('should render reports content when reports tab is clicked', async () => {
      renderApp();
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Reports' }));
      });

      await waitFor(() => {
        // Check for reports content
        expect(screen.getByText(/Reports/) || document.querySelector('[class*="report"]')).toBeInTheDocument();
      });
    });

    test('should render companies content when companies tab is clicked', async () => {
      renderApp();
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Companies' }));
      });

      await waitFor(() => {
        // Check for companies content
        expect(screen.getByText(/Companies/) || document.querySelector('[class*="company"]')).toBeInTheDocument();
      });
    });

    test('should render admin dashboard when admin tab is clicked', async () => {
      renderApp();
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Admin' }));
      });

      await waitFor(() => {
        // Check for admin content
        expect(screen.getByText(/Admin Dashboard/) || document.querySelector('[class*="admin"]')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle setup status fetch error', async () => {
      // Mock API error
      const { apiService } = await import('../src/services/api');
      vi.mocked(apiService.getSetupStatus).mockRejectedValue(new Error('Network error'));

      renderApp();
      
      await waitFor(() => {
        // Should still show login form despite error
        expect(screen.getByText('JCL Investment Portfolio')).toBeInTheDocument();
        expect(screen.getByText('Sign in to access your portfolio')).toBeInTheDocument();
      });
    });

    test('should handle auth check error gracefully', async () => {
      // Mock auth check error
      const { useAuthStore } = await import('../src/stores/authStore');
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        checkAuth: vi.fn().mockRejectedValue(new Error('Auth error'))
      });

      renderApp();
      
      await waitFor(() => {
        // Should still show login form
        expect(screen.getByText('Sign in to access your portfolio')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', async () => {
      renderApp();
      
      await waitFor(() => {
        // Check for main heading
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toBeInTheDocument();
        expect(mainHeading).toHaveTextContent('JCL Investment Portfolio');
      });
    });

    test('should have accessible navigation buttons', async () => {
      renderApp();
      
      await waitFor(() => {
        const navButtons = screen.getAllByRole('button');
        expect(navButtons.length).toBeGreaterThan(0);
        
        // Check that buttons have accessible names
        navButtons.forEach(button => {
          expect(button).toHaveAttribute('type');
        });
      });
    });

    test('should have proper form labels', async () => {
      renderApp();
      
      await waitFor(() => {
        // Check for form inputs with proper labels
        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);
        
        expect(usernameInput).toBeInTheDocument();
        expect(passwordInput).toBeInTheDocument();
        expect(usernameInput).toHaveAttribute('type', 'text');
        expect(passwordInput).toHaveAttribute('type', 'password');
      });
    });
  });
});
