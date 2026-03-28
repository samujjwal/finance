import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { usePermissions, PermissionGuard } from '@/hooks/usePermissions';

// CreateUserModal Component
function CreateUserModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    userId: '',
    username: '',
    email: '',
    firstName: '',
    surname: '',
    password: '',
    branchId: 'BRANCH_MAIN',
    userTypeId: 'ADMIN',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createUser(formData);
      if (response.success) {
        onSuccess();
        onClose();
        setFormData({
          userId: '',
          username: '',
          email: '',
          firstName: '',
          surname: '',
          password: '',
          branchId: 'BRANCH_MAIN',
          userTypeId: 'ADMIN',
        });
      } else {
        setError(response.error || 'Failed to create user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Create User</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">User ID *</label>
            <input
              type="text"
              name="userId"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
              maxLength={15}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Surname *</label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
              maxLength={128}
            />
            <p className="text-xs text-gray-500 mt-1">8-128 characters, must contain letters and numbers</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface User {
  id: string;
  userId: string;
  username: string;
  email: string;
  firstName: string;
  surname: string;
  status: string;
  isActive: boolean;
  branch: { name: string };
  userType: { name: string };
  userRoles: Array<{ role: { name: string } }>;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { hasFunction, isLoading: permissionsLoading } = usePermissions();

  const canCreate = hasFunction('USER_CREATE');
  const canView = hasFunction('USER_VIEW');
  const canModify = hasFunction('USER_MODIFY');
  const canSuspend = hasFunction('USER_SUSPEND');
  const canUnlock = hasFunction('USER_UNLOCK');

  useEffect(() => {
    if (canView && !permissionsLoading) {
      loadUsers();
    }
  }, [canView, permissionsLoading]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      if (response.success) {
        const payload = (response.data as any) || {};
        setUsers(payload.users || []);
      } else {
        setError(response.error || 'Failed to load users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const response = await apiService.approveUser(userId, action);
      if (response.success) {
        loadUsers();
      } else {
        setError(response.error || 'Failed to approve user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    }
  };

  const handleSuspend = async (userId: string) => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    try {
      const response = await apiService.suspendUser(userId, reason);
      if (response.success) {
        loadUsers();
      } else {
        setError(response.error || 'Failed to suspend user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend user');
    }
  };

  const handleUnlock = async (userId: string) => {
    try {
      const response = await apiService.unlockUser(userId);
      if (response.success) {
        loadUsers();
      } else {
        setError(response.error || 'Failed to unlock user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock user');
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      REJECTED: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {status.replace('_', ' ')}
        {!isActive && ' (Locked)'}
      </span>
    );
  };

  if (permissionsLoading) {
    return <div className="p-6">Loading permissions...</div>;
  }

  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-800">You do not have permission to view users.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create User
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.userId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.firstName} {user.surname}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.branch?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.userType?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.status, user.isActive)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {user.status === 'PENDING_APPROVAL' && canModify && (
                    <>
                      <button
                        onClick={() => handleApprove(user.id, 'APPROVE')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(user.id, 'REJECT')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {user.status === 'ACTIVE' && canSuspend && (
                    <button
                      onClick={() => handleSuspend(user.id)}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      Suspend
                    </button>
                  )}
                  {!user.isActive && canUnlock && (
                    <button
                      onClick={() => handleUnlock(user.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Unlock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadUsers}
      />
    </div>
  );
}
