import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search, Filter, FileSpreadsheet } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import { authApi } from '../../api/authApi';
import { formatDate } from '../../utils/formatDate';
import { exportToCsv } from '../../utils/exportCsv';
import { cn } from '../../lib/utils';

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['auditLogs', search, actionFilter],
    queryFn: () => authApi.getAuditLogs({ search, action: actionFilter }),
  });

  const columns: Column<any>[] = [
    { 
      key: 'timestamp', 
      label: 'Timestamp', 
      sortable: true,
      render: (row) => <span className="text-gray-500 whitespace-nowrap">{formatDate(row.timestamp)}</span>
    },
    { 
      key: 'action', 
      label: 'Action', 
      sortable: true,
      render: (row) => (
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
          row.action.includes('CREATE') ? "bg-green-100 text-green-800" :
          row.action.includes('UPDATE') ? "bg-blue-100 text-blue-800" :
          row.action.includes('DELETE') ? "bg-red-100 text-red-800" :
          row.action.includes('LOGIN') ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
        )}>
          {row.action}
        </span>
      )
    },
    { 
      key: 'entityType', 
      label: 'Entity', 
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.entityType}</span>
    },
    { 
      key: 'entityId', 
      label: 'Entity ID', 
      render: (row) => <span className="font-mono text-xs text-gray-500">{row.entityId}</span>
    },
    { 
      key: 'user', 
      label: 'User', 
      sortable: true,
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.userName}</div>
          <div className="text-xs text-gray-500">{row.userEmail}</div>
        </div>
      )
    },
    { key: 'ipAddress', label: 'IP Address', render: (row) => <span className="font-mono text-xs">{row.ipAddress}</span> },
    { 
      key: 'details', 
      label: 'Details',
      render: (row) => (
        <div className="max-w-xs truncate text-xs text-gray-500" title={row.details}>
          {row.details}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Audit Logs" 
        subtitle="System-wide activity tracking for compliance and security."
        action={
          <button
            onClick={() => {
              const exportData = (logsData?.data || []).map((log: any) => ({
                'Timestamp': formatDate(log.timestamp),
                'Action': log.action,
                'Entity': log.entityType,
                'Entity ID': log.entityId,
                'User Name': log.userName,
                'User Email': log.userEmail,
                'IP Address': log.ipAddress,
                'Details': log.details,
              }));
              exportToCsv(exportData, 'minetrace-audit-logs');
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        }
      />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs by user, entity, or details..."
                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2"
              />
            </div>
          </div>
          <div className="sm:w-64">
            <label className="sr-only">Filter by Action</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2"
              >
                <option value="">All Actions</option>
                <option value="USER_LOGIN">User Login</option>
                <option value="BATCH_CREATE">Batch Create</option>
                <option value="BATCH_UPDATE">Batch Update</option>
                <option value="MOVEMENT_CREATE">Movement Create</option>
                <option value="VERIFICATION_LOG">Verification Log</option>
                <option value="RISK_OVERRIDE">Risk Override</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <Shield className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">System Activity</h3>
        </div>
        <DataTable 
          columns={columns} 
          data={logsData?.data || []} 
          loading={isLoading}
          searchPlaceholder="" // Search handled above
        />
      </div>
    </div>
  );
}
