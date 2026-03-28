import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

interface Workflow {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  status: string;
  requestedAt: string;
  requestedBy: string;
  approver?: string;
  approvedAt?: string;
  rejectionReason?: string;
  requester: {
    userId: string;
    username: string;
    firstName: string;
    surname: string;
  };
}

interface Stats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  todayPending: number;
  total: number;
}

export function ApprovalDashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { hasFunction, isLoading: permissionsLoading } = usePermissions();

  const canView = hasFunction('APPROVAL_VIEW');
  const canProcess = hasFunction('APPROVAL_PROCESS');

  useEffect(() => {
    if (canView && !permissionsLoading) {
      loadData();
    }
  }, [canView, permissionsLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workflowsRes, statsRes] = await Promise.all([
        apiService.getPendingApprovals(),
        apiService.getApprovalStats(),
      ]);

      if (workflowsRes.success) {
        setWorkflows(((workflowsRes.data as Workflow[]) || []));
      }
      if (statsRes.success) {
        setStats((statsRes.data as Stats) || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (workflowId: string) => {
    try {
      const response = await apiService.approveWorkflow(workflowId);
      if (response.success) {
        loadData();
      } else {
        setError(response.error || 'Failed to approve');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleReject = async (workflowId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await apiService.rejectWorkflow(workflowId, reason);
      if (response.success) {
        loadData();
      } else {
        setError(response.error || 'Failed to reject');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  const getEntityTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      USER: '👤',
      ROLE: '🔐',
      ROLE_FUNCTION: '⚙️',
      USER_ROLE: '🎭',
    };
    return icons[type] || '📄';
  };

  if (permissionsLoading) {
    return <div className="p-6">Loading permissions...</div>;
  }

  if (!canView) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-800">You do not have permission to view approvals.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading approval dashboard...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Approval Dashboard</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-sm text-yellow-600">Pending Approvals</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.totalPending}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="text-sm text-green-600">Approved Today</p>
            <p className="text-2xl font-bold text-green-800">{stats.todayPending}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-600">Total Approved</p>
            <p className="text-2xl font-bold text-blue-800">{stats.totalApproved}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-sm text-red-600">Total Rejected</p>
            <p className="text-2xl font-bold text-red-800">{stats.totalRejected}</p>
          </div>
        </div>
      )}

      {/* Pending Approvals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Pending Approvals</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workflows.map((workflow) => (
              <tr key={workflow.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-2xl mr-2">{getEntityTypeIcon(workflow.entityType)}</span>
                  <span className="text-sm text-gray-900">{workflow.entityType.replace('_', ' ')}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {workflow.action}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {workflow.requester?.firstName} {workflow.requester?.surname}
                  <br />
                  <span className="text-xs text-gray-400">@{workflow.requester?.username}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(workflow.requestedAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {canProcess && (
                    <>
                      <button
                        onClick={() => handleApprove(workflow.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(workflow.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {workflows.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No pending approvals
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workflows.map((workflow) => (
                <tr key={workflow.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-2xl mr-2">{getEntityTypeIcon(workflow.entityType)}</span>
                    <span className="text-sm text-gray-900">{workflow.entityType.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workflow.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {workflow.requester?.firstName} {workflow.requester?.surname}
                    <br />
                    <span className="text-xs text-gray-400">@{workflow.requester?.username}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(workflow.requestedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {canProcess && (
                      <>
                        <button
                          onClick={() => handleApprove(workflow.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(workflow.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
