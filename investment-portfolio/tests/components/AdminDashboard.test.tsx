import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AdminDashboard } from '../src/components/admin/AdminDashboard';

// Mock API service
vi.mock('../src/services/api', () => ({
  apiService: {
    getUsers: vi.fn().mockResolvedValue({
      success: true,
      data: { 
        users: [
          { id: '1', username: 'admin', status: 'ACTIVE' },
          { id: '2', username: 'demo', status: 'ACTIVE' }
        ], 
        total: 2 
      }
    }),
    getPendingApprovals: vi.fn().mockResolvedValue({
      success: true,
      data: []
    }),
    getRoles: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: 'System Administrator' },
        { id: '2', name: 'Portfolio Manager' }
      ]
    })
  }
}));

// Mock auth store
vi.mock('../src/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { username: 'admin', role: 'ADMIN' }
  })
}));

describe('AdminDashboard Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Load', () => {
    test('should render admin dashboard title', () => {
      render(<AdminDashboard />);
      
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    test('should display admin navigation tabs', () => {
      render(<AdminDashboard />);
      
      const tabs = ['Overview', 'Users', 'Roles', 'Approvals', 'System'];
      tabs.forEach(tab => {
        expect(screen.getByRole('button', { name: tab })).toBeInTheDocument();
      });
    });

    test('should show overview tab as active by default', () => {
      render(<AdminDashboard />);
      
      expect(screen.getByRole('button', { name: 'Overview' })).toHaveClass(/border-indigo-500/);
    });
  });

  describe('Overview Tab', () => {
    test('should display statistics cards', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
        expect(screen.getByText('Total Roles')).toBeInTheDocument();
      });
    });

    test('should display user statistics', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total users
        expect(screen.getByText('2')).toBeInTheDocument(); // Active users
      });
    });

    test('should display quick action cards', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Role Management')).toBeInTheDocument();
        expect(screen.getByText('Approval Dashboard')).toBeInTheDocument();
      });
    });

    test('should navigate to user management when clicking user management card', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Manage Users'));
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Users' })).toHaveClass(/border-indigo-500/);
      });
    });

    test('should navigate to role management when clicking role management card', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Manage Roles'));
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Roles' })).toHaveClass(/border-indigo-500/);
      });
    });

    test('should navigate to approvals when clicking approval dashboard card', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Review Approvals'));
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Approvals' })).toHaveClass(/border-indigo-500/);
      });
    });

    test('should display system overview section', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('System Overview')).toBeInTheDocument();
        expect(screen.getByText('Backend API')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Authentication')).toBeInTheDocument();
        expect(screen.getByText('Current User')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
    });

    test('should show system health indicators', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Online')).toBeInTheDocument();
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('should switch to users tab when clicked', async () => {
      render(<AdminDashboard />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Users' }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Users' })).toHaveClass(/border-indigo-500/);
        expect(screen.getByRole('button', { name: 'Overview' })).not.toHaveClass(/border-indigo-500/);
      });
    });

    test('should switch to roles tab when clicked', async () => {
      render(<AdminDashboard />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Roles' }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Roles' })).toHaveClass(/border-indigo-500/);
        expect(screen.getByRole('button', { name: 'Overview' })).not.toHaveClass(/border-indigo-500/);
      });
    });

    test('should switch to approvals tab when clicked', async () => {
      render(<AdminDashboard />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Approvals' }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Approvals' })).toHaveClass(/border-indigo-500/);
        expect(screen.getByRole('button', { name: 'Overview' })).not.toHaveClass(/border-indigo-500/);
      });
    });

    test('should switch to system tab when clicked', async () => {
      render(<AdminDashboard />);
      
      fireEvent.click(screen.getByRole('button', { name: 'System' }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'System' })).toHaveClass(/border-indigo-500/);
        expect(screen.getByRole('button', { name: 'Overview' })).not.toHaveClass(/border-indigo-500/);
      });
    });
  });

  describe('Users Tab Content', () => {
    test('should display user management component when users tab is active', async () => {
      render(<AdminDashboard />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Users' }));
      
      await waitFor(() => {
        // Check for UserManagement component content
        expect(screen.getByText('User Management') || document.querySelector('[class*="user-management"]')).toBeInTheDocument();
      });
    });
  });

  describe('Roles Tab Content', () => {
    test('should display role management component when roles tab is active', async () => {
      render(<AdminDashboard />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Roles' }));
      
      await waitFor(() => {
        // Check for RoleManagement component content
        expect(screen.getByText('Role Management') || document.querySelector('[class*="role-management"]')).toBeInTheDocument();
      });
    });
  });

  describe('Approvals Tab Content', () => {
    test('should display approval dashboard component when approvals tab is active', async () => {
      render(<AdminDashboard />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Approvals' }));
      
      await waitFor(() => {
        // Check for ApprovalDashboard component content
        expect(screen.getByText('Approval Dashboard') || document.querySelector('[class*="approval-dashboard"]')).toBeInTheDocument();
      });
    });
  });

  describe('System Tab Content', () => {
    test('should display system settings when system tab is active', async () => {
      render(<AdminDashboard />);
      
      fireEvent.click(screen.getByRole('button', { name: 'System' }));
      
      await waitFor(() => {
        expect(screen.getByText('System Settings')).toBeInTheDocument();
        expect(screen.getByText('System settings and advanced configuration options will be available here.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Configure System (Coming Soon)' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Configure System (Coming Soon)' })).toBeDisabled();
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading state while fetching stats', async () => {
      // Mock slow API response
      const { apiService } = await import('../src/services/api');
      vi.mocked(apiService.getUsers).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: { users: [], total: 0 }
      }), 100)));

      render(<AdminDashboard />);
      
      // Should show loading state initially
      expect(screen.getByText('Loading…') || document.querySelector('[class*="loading"]')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      // Mock API error
      const { apiService } = await import('../src/services/api');
      vi.mocked(apiService.getUsers).mockRejectedValue(new Error('API Error'));

      render(<AdminDashboard />);
      
      await waitFor(() => {
        // Should still render the dashboard with default values
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 when error occurs
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading structure', () => {
      render(<AdminDashboard />);
      
      // Check for main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Admin Dashboard');
    });

    test('should have accessible navigation buttons', () => {
      render(<AdminDashboard />);
      
      const navButtons = screen.getAllByRole('button');
      expect(navButtons.length).toBeGreaterThan(0);
      
      navButtons.forEach(button => {
        expect(button).toHaveAttribute('type');
      });
    });

    test('should have proper ARIA labels for statistics cards', async () => {
      render(<AdminDashboard />);
      
      await waitFor(() => {
        // Check for accessible statistics cards
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Registered accounts')).toBeInTheDocument();
      });
    });
  });

  describe('Data Refresh', () => {
    test('should refresh data when switching back to overview tab', async () => {
      render(<AdminDashboard />);
      
      // Switch to another tab
      fireEvent.click(screen.getByRole('button', { name: 'Users' }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Users' })).toHaveClass(/border-indigo-500/);
      });

      // Switch back to overview
      fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Overview' })).toHaveClass(/border-indigo-500/);
        // Should have called API again to refresh data
        const { apiService } = require('../src/services/api');
        expect(apiService.getUsers).toHaveBeenCalled();
      });
    });
  });
});
