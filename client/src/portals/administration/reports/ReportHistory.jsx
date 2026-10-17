import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Download, RefreshCw, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import reportClientService from '../../../services/reportClientService';
import { ReportStatusBadge } from '../../../components/reports/ReportStatusBadge';

export const ReportHistory = () => {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExecutions();
  }, []);

  const fetchExecutions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportClientService.getExecutions({ limit: 50 });
      setExecutions(res.data?.data || []);
    } catch (err) {
      setError('Failed to load report execution history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (execId, format) => {
    try {
      await reportClientService.downloadReportFile(execId, format);
    } catch (err) {
      alert('Failed to download exported report.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-7 h-7 text-indigo-600" />
            Report Execution History & Audit Logs
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete audit trail of all generated, exported, and scheduled reports.
          </p>
        </div>
        <button
          onClick={fetchExecutions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Execution ID</th>
                <th className="px-4 py-3">Report Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Rows</th>
                <th className="px-4 py-3">Generated At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Loading executions...
                  </td>
                </tr>
              ) : executions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No report execution history available.
                  </td>
                </tr>
              ) : (
                executions.map((exec) => (
                  <tr key={exec.executionId || exec._id} className="hover:bg-indigo-50/30 transition">
                    <td className="px-4 py-3 font-mono font-medium text-indigo-600 text-xs">
                      {exec.executionId}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {exec.reportCode}
                    </td>
                    <td className="px-4 py-3">
                      <ReportStatusBadge status={exec.status} />
                    </td>
                    <td className="px-4 py-3 font-medium text-xs text-gray-600">
                      {exec.outputFormat || 'CSV'}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {exec.rowCount !== undefined ? exec.rowCount : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {exec.createdAt ? new Date(exec.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {exec.status === 'COMPLETED' ? (
                        <button
                          onClick={() => handleDownload(exec.executionId, exec.outputFormat || 'csv')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportHistory;
