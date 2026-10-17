import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Hash,
  Database
} from 'lucide-react';
import reportClientService from '../../../services/reportClientService';

export const ReportViewer = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [execution, setExecution] = useState(null);
  const [error, setError] = useState(null);
  const [tableSearch, setTableSearch] = useState('');

  useEffect(() => {
    loadExecution();
  }, [reportId]);

  const loadExecution = async () => {
    setLoading(true);
    setError(null);
    try {
      if (reportId.startsWith('EXEC-')) {
        const res = await reportClientService.getExecutionStatus(reportId);
        setExecution(res.data?.data);
      } else {
        // If it's a reportCode, execute it on the fly
        const res = await reportClientService.executeReport(reportId, { format: 'CSV' });
        setExecution(res.data?.data);
      }
    } catch (err) {
      console.error('Failed to load report execution:', err);
      setError(err.response?.data?.message || 'Failed to retrieve report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    if (!execution?.executionId) return;
    try {
      await reportClientService.downloadReportFile(execution.executionId, format);
    } catch (err) {
      alert('Download failed.');
    }
  };

  // Extract columns & rows from execution summary or parameters
  const rows = execution?.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  const filteredRows = rows.filter((r) => {
    if (!tableSearch) return true;
    return Object.values(r).some((val) =>
      String(val).toLowerCase().includes(tableSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 p-6">
      {/* Top Breadcrumb & Action Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reports/catalog')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Report Viewer: {execution?.reportCode || reportId}
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Execution ID: {execution?.executionId || 'Loading...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('csv')}
            disabled={!execution}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4 text-indigo-600" /> Download CSV
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            disabled={!execution}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">
          <RotateCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-sm">Fetching and rendering report dataset...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Unable to View Report
          </div>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => navigate('/reports/catalog')}
            className="mt-4 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold"
          >
            Back to Catalog
          </button>
        </div>
      ) : (
        <>
          {/* Metadata Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-500 block">Status:</span>
              <span className="font-semibold text-emerald-600 inline-flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {execution.status}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Row Count:</span>
              <span className="font-bold text-gray-900 mt-0.5 block text-sm">
                {execution.rowCount || rows.length} records
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Execution Time:</span>
              <span className="font-mono text-gray-700 mt-0.5 block">
                {execution.durationMs || 0} ms
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">SHA-256 Checksum:</span>
              <span className="font-mono text-gray-600 mt-0.5 block truncate" title={execution.fileChecksum}>
                {execution.fileChecksum ? `${execution.fileChecksum.substring(0, 14)}...` : 'Verified'}
              </span>
            </div>
          </div>

          {/* Tabular Data Grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Dataset Records ({filteredRows.length} displayed)</span>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter records in table..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No rows available in this execution snapshot</p>
                <p className="text-xs text-gray-400 mt-1">Try exporting or running with relaxed date filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/40 transition">
                        {columns.map((col) => (
                          <td key={col} className="px-4 py-2.5 text-gray-800 font-medium">
                            {row[col] !== undefined && row[col] !== null ? String(row[col]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportViewer;
