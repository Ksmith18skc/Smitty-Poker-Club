import React, { useState, useEffect } from 'react';
import { useAdminAudit } from '../../hooks/useAdminAudit';
import { formatTime } from '../../utils/formatters';

export function AdminAuditLog() {
  const { getAuditLogs } = useAdminAudit();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const result = await getAuditLogs();
        setLogs(result);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        setError('Failed to load audit logs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 max-w-md text-red-200">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-medium text-white">Admin Audit Log</h3>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-gray-900 rounded-lg border border-gray-700">
          <div className="grid grid-cols-5 gap-4 p-3 border-b border-gray-700 text-gray-300 font-medium">
            <div>Timestamp</div>
            <div>Admin</div>
            <div>Action</div>
            <div>Target</div>
            <div>Details</div>
          </div>
          
          {logs.map((log) => (
            <div key={log.id || `log-${log.timestamp}-${Math.random().toString(36).substr(2, 9)}`} className="grid grid-cols-5 gap-4 p-3 border-b border-gray-700 text-gray-400">
              <div>{formatTime(new Date(log.timestamp), '24h')}</div>
              <div>{log.admin_id ? log.admin_id.substring(0, 8) + '...' : 'System'}</div>
              <div>{log.action}</div>
              <div>{log.target_id ? log.target_id.substring(0, 8) + '...' : 'N/A'}</div>
              <div>{log.details}</div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              No audit logs found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}