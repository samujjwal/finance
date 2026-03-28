import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

interface Role {
  id: string;
  name: string;
  description: string;
  status: string;
  isSystem: boolean;
  userType: { name: string };
  roleFunctions: Array<{
    function: {
      id: string;
      name: string;
      description: string;
      module: string;
    };
  }>;
}

interface Function {
  id: string;
  name: string;
  description: string;
  module: string;
}

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [functions, setFunctions] = useState<Function[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const { hasFunction, isLoading: permissionsLoading } = usePermissions();

  const canCreate = hasFunction('ROLE_CREATE');
  const canView = hasFunction('ROLE_VIEW');
  const canAssign = hasFunction('ROLE_ASSIGN');
  const canSuspend = hasFunction('ROLE_SUSPEND');

  useEffect(() => {
    if (canView && !permissionsLoading) {
      loadRoles();
      loadFunctions();
    }
  }, [canView, permissionsLoading]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRoles();
      if (response.success) {
        const payload = (response.data as any) || {};
        setRoles(payload.roles || []);
      } else {
        setError(response.error || 'Failed to load roles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const loadFunctions = async () => {
    try {
      const response = await apiService.getAllFunctions();
      if (response.success) {
        setFunctions((response.data as Function[]) || []);
      }
    } catch (err) {
      console.error('Failed to load functions:', err);
    }
  };

  const handleApprove = async (roleId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const response = await apiService.approveRole(roleId, action);
      if (response.success) {
        loadRoles();
      } else {
        setError(response.error || 'Failed to approve role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve role');
    }
  };

  const handleSuspend = async (roleId: string) => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    try {
      const response = await apiService.suspendRole(roleId, reason);
      if (response.success) {
        loadRoles();
      } else {
        setError(response.error || 'Failed to suspend role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend role');
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await apiService.deleteRole(roleId);
      if (response.success) {
        loadRoles();
      } else {
        setError(response.error || 'Failed to delete role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const openAssignModal = (role: Role) => {
    setSelectedRole(role);
    setSelectedFunctions(role.roleFunctions.map(rf => rf.function.id));
    setShowAssignModal(true);
  };

  const handleAssignFunctions = async () => {
    if (!selectedRole) return;

    try {
      const response = await apiService.assignFunctionsToRole(selectedRole.id, selectedFunctions);
      if (response.success) {
        setShowAssignModal(false);
        loadRoles();
      } else {
        setError(response.error || 'Failed to assign functions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign functions');
    }
  };

  const toggleFunction = (funcId: string) => {
    setSelectedFunctions(prev =>
      prev.includes(funcId)
        ? prev.filter(id => id !== funcId)
        : [...prev, funcId]
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      SUSPENDED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const groupedFunctions = functions.reduce((acc, func) => {
    if (!acc[func.module]) acc[func.module] = [];
    acc[func.module].push(func);
    return acc;
  }, {} as Record<string, Function[]>);

  if (permissionsLoading) {
    return <div className="p-6">Loading permissions...</div>;
  }

  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-800">You do not have permission to view roles.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading roles...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Role Management</h2>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Role
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Functions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {role.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {role.name}
                  {role.isSystem && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                      System
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {role.userType?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(role.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {role.roleFunctions?.length || 0} functions
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {role.status === 'PENDING_APPROVAL' && (
                    <>
                      <button
                        onClick={() => handleApprove(role.id, 'APPROVE')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(role.id, 'REJECT')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {role.status === 'ACTIVE' && canAssign && (
                    <button
                      onClick={() => openAssignModal(role)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Assign Functions
                    </button>
                  )}
                  {role.status === 'ACTIVE' && canSuspend && !role.isSystem && (
                    <button
                      onClick={() => handleSuspend(role.id)}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      Suspend
                    </button>
                  )}
                  {['PENDING_APPROVAL', 'REJECTED'].includes(role.status) && !role.isSystem && (
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Functions Modal */}
      {showAssignModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              Assign Functions to {selectedRole.name}
            </h3>

            <div className="space-y-4">
              {Object.entries(groupedFunctions).map(([module, moduleFunctions]) => (
                <div key={module} className="border rounded p-4">
                  <h4 className="font-semibold mb-2">{module}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {moduleFunctions.map((func) => (
                      <label key={func.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedFunctions.includes(func.id)}
                          onChange={() => toggleFunction(func.id)}
                          className="rounded"
                        />
                        <span className="text-sm">{func.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignFunctions}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Assign Functions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadRoles}
        />
      )}
    </div>
  );
}

// CreateRoleModal Component
function CreateRoleModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
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
      const response = await apiService.createRole(formData);
      if (response.success) {
        onSuccess();
        onClose();
        setFormData({ id: '', name: '', description: '', userTypeId: 'ADMIN' });
      } else {
        setError(response.error || 'Failed to create role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Create Role</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role ID *</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
              maxLength={50}
              placeholder="e.g., PORTFOLIO_MANAGER"
            />
            <p className="text-xs text-gray-500 mt-1">Max 50 characters, alphanumeric with hyphens/underscores</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
              placeholder="e.g., Portfolio Manager"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Role description..."
            />
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
              {loading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
