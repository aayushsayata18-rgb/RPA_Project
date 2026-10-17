import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Play, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import reportClientService from '../../../services/reportClientService';
import { ReportFilterPanel } from '../../../components/reports/ReportFilterPanel';

export const ReportFilters = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeFilters, setActiveFilters] = useState({ period: 'THIS_MONTH' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await reportClientService.getCatalog();
      const list = res.data?.data || [];
      setCatalog(list);
      if (list.length > 0) {
        setSelectedReport(list[0]);
      }
    } catch (err) {
      console.error('Failed to load report catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (filters) => {
    setActiveFilters(filters);
  };

  const handleRun = () => {
    if (!selectedReport) return;
    navigate(`/reports/viewer/${selectedReport.reportCode || selectedReport.reportId}`, {
      state: { filters: activeFilters }
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Filter className="w-7 h-7 text-indigo-600" />
            Report Filter Configuration Console
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Pre-configure date boundaries, department scopes, and query filters before execution.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selector */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Select Target Report
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {catalog.map((rpt) => (
              <div
                key={rpt.reportCode || rpt.reportId}
                onClick={() => setSelectedReport(rpt)}
                className={`p-3 rounded-lg border cursor-pointer text-xs transition ${
                  selectedReport?.reportCode === rpt.reportCode
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div>{rpt.name}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{rpt.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Panel & Runner */}
        <div className="lg:col-span-2 space-y-4">
          {selectedReport && (
            <>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-900">{selectedReport.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{selectedReport.description}</p>
              </div>

              <ReportFilterPanel
                filters={activeFilters}
                availableFilters={selectedReport.filters || []}
                onApply={handleApply}
                onReset={setActiveFilters}
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleRun}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
                >
                  <Play className="w-4 h-4" />
                  Execute With Selected Filters
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
