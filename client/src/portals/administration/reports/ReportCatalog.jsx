import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Play,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RotateCw,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import reportClientService from '../../../services/reportClientService';

const CATEGORIES = [
  'ALL',
  'CLINICAL',
  'FINANCIAL',
  'OPERATIONAL',
  'INVENTORY',
  'HR',
  'RPA',
  'EXECUTIVE'
];

export const ReportCatalog = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal execution state
  const [executingReport, setExecutingReport] = useState(null);
  const [format, setFormat] = useState('CSV');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportClientService.getCatalog();
      setReports(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load report catalog:', err);
      setError('Failed to fetch report definitions.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesCategory =
      selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchesSearch =
      !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.reportCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenExecutionModal = (report) => {
    setExecutingReport(report);
    setFormat(report.defaultFormat || 'CSV');
    setStartDate('');
    setEndDate('');
    setExecutionResult(null);
  };

  const handleExecute = async () => {
    if (!executingReport) return;
    setIsExecuting(true);
    setError(null);
    try {
      const payload = {
        format,
        parameters: {
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      };
      const res = await reportClientService.executeReport(
        executingReport.reportCode,
        payload
      );
      setExecutionResult(res.data?.data);
    } catch (err) {
      console.error('Execution error:', err);
      alert(err.response?.data?.message || 'Report execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownload = async (executionId, downloadFormat) => {
    try {
      await reportClientService.downloadReportFile(
        executionId,
        downloadFormat || format
      );
    } catch (err) {
      alert('Failed to download exported file.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Standard Report Catalog
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse and execute 24 cross-departmental operational, financial, and clinical reports.
          </p>
        </div>
        <button
          onClick={loadCatalog}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports by title, code (e.g. BED_OCCUPANCY), or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">
          <RotateCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-sm">Loading standard report catalog...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">No matching reports found</h3>
          <p className="text-sm text-gray-500 mt-1">
            Try adjusting your search criteria or category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => (
            <div
              key={report._id || report.reportCode}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition duration-200 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                    {report.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-400">
                    {report.reportCode}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  {report.name}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  {report.description}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <span>Formats:</span>
                  {(report.supportedFormats || ['CSV', 'PDF']).map((fmt) => (
                    <span
                      key={fmt}
                      className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 text-[10px] font-bold"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleOpenExecutionModal(report)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" /> Run Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execution Modal */}
      {executingReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Execute: {executingReport.name}
                </h3>
                <p className="text-xs font-mono text-gray-500">
                  {executingReport.reportCode} ({executingReport.category})
                </p>
              </div>
              <button
                onClick={() => setExecutingReport(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!executionResult ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Export Output Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CSV', 'PDF', 'JSON'].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setFormat(fmt)}
                        className={`py-2 text-xs font-semibold rounded-lg border text-center transition ${
                          format === fmt
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t">
                  <button
                    onClick={() => setExecutingReport(null)}
                    disabled={isExecuting}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    {isExecuting ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Execute Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Report Generated Successfully!
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-emerald-900">
                    <div>
                      <span className="text-gray-500">Execution ID:</span>{' '}
                      <span className="font-mono font-bold">
                        {executionResult.executionId}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Row Count:</span>{' '}
                      <span className="font-bold">
                        {executionResult.rowCount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>{' '}
                      <span className="font-mono">
                        {executionResult.durationMs}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Format:</span>{' '}
                      <span className="font-bold">
                        {executionResult.outputFormat || format}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t">
                  <button
                    onClick={() => {
                      const execId = executionResult.executionId;
                      setExecutingReport(null);
                      navigate(`/reports/viewer/${execId}`);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Eye className="w-4 h-4 text-indigo-600" />
                    Open in Viewer
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleDownload(executionResult.executionId, 'csv')
                      }
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
                    >
                      <Download className="w-4 h-4" /> CSV
                    </button>
                    <button
                      onClick={() =>
                        handleDownload(executionResult.executionId, 'pdf')
                      }
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                    >
                      <Download className="w-4 h-4" /> PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCatalog;
