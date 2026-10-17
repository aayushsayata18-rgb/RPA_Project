import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  RotateCw,
  Search,
  Filter,
  Activity,
  HardDrive,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import documentClientService from '../../../services/documentClientService';

export const DocumentReports = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadReports();
  }, [actionFilter]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, logsRes] = await Promise.all([
        documentClientService.getStats(),
        documentClientService.getAccessLogs({ action: actionFilter || undefined, limit: 50 })
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load report analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <BarChart3 className="w-7 h-7 text-primary-600" />
          <span>Document Analytics & Audit Reports</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed metrics, security access audit trail, and document generation volumes
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm">
          <RotateCw className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          Loading audit trails and system statistics...
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
          <AlertTriangle className="w-6 h-6 mb-2 text-rose-500" />
          {error}
        </div>
      ) : (
        <>
          {/* Categorical Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Volume by Category */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary-600" />
                Distribution by Document Category
              </h3>

              <div className="space-y-2.5">
                {stats?.byCategory?.map(item => {
                  const total = stats.totalGenerated || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{item._id || 'GENERAL'}</span>
                        <span>{item.count} docs ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Volume by Document Type */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <HardDrive className="w-4 h-4 mr-2 text-indigo-600" />
                Top Document Types
              </h3>

              <div className="space-y-2">
                {stats?.byType?.slice(0, 7).map(item => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <span className="font-mono font-medium text-slate-800">{item._id}</span>
                    <span className="font-bold text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded-full">
                      {item.count} files
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Document Access Audit Trail Table (Section 68, 97) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                  <UserCheck className="w-4 h-4 mr-2 text-emerald-600" />
                  Document Access & Download Audit Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time security log tracking every view, download, and permission denial attempt
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={actionFilter}
                  onChange={e => setActionFilter(e.target.value)}
                  className="text-xs font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="">All Actions</option>
                  <option value="VIEWED">VIEWED</option>
                  <option value="DOWNLOADED">DOWNLOADED</option>
                  <option value="ACCESS_DENIED">ACCESS_DENIED</option>
                  <option value="RELEASED">RELEASED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="UPLOADED">UPLOADED</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">User & Role</th>
                    <th className="py-2.5 px-4">Document ID</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">IP Address</th>
                    <th className="py-2.5 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {logs.map(log => (
                    <tr key={log.logId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="py-2.5 px-4 font-bold text-slate-800">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            log.action === 'ACCESS_DENIED'
                              ? 'bg-rose-100 text-rose-800'
                              : log.action === 'DOWNLOADED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{log.userName || log.userId}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{log.role}</div>
                      </td>

                      <td className="py-2.5 px-4 font-mono font-medium text-primary-700">
                        {log.documentId}
                      </td>

                      <td className="py-2.5 px-4">
                        <span
                          className={`font-semibold text-[10px] uppercase ${
                            log.status === 'DENIED' ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 font-mono text-slate-500">
                        {log.ipAddress}
                      </td>

                      <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentReports;
