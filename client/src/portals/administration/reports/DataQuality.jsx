import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, RefreshCw, AlertCircle, Database, ShieldCheck, FileText } from 'lucide-react';
import reportClientService from '../../../services/reportClientService';

export const DataQuality = () => {
  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    runAudit();
  }, []);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportClientService.getDataQualityAudit();
      setAuditResult(res.data?.data || null);
    } catch (err) {
      setError('Failed to execute automated data quality audit.');
    } finally {
      setLoading(false);
    }
  };

  const findings = auditResult?.findings || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-7 h-7 text-indigo-600" />
            Cross-Module Data Quality & Reconciliation
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Autonomous surveillance for orphan records, missing references, and total discrepancies.
          </p>
        </div>
        <button
          onClick={runAudit}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Run Quality Audit
        </button>
      </div>

      {/* Principle Notice */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Architectural Principle:</span> The Reports & Analytics module detects and
          flags cross-module data anomalies for human review. It never silently modifies operational records of truth.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs uppercase text-gray-500 font-semibold">Total Findings</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {auditResult?.totalFindings ?? 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50/20">
          <span className="text-xs uppercase text-rose-600 font-semibold">Critical Anomalies</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            {auditResult?.criticalCount ?? 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/20">
          <span className="text-xs uppercase text-amber-600 font-semibold">High Severity</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {auditResult?.highCount ?? 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
          <span className="text-xs uppercase text-emerald-600 font-semibold">Status</span>
          <div className="text-lg font-bold text-emerald-700 mt-1 flex items-center gap-1">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Integrity Checked
          </div>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Detailed Audit Exceptions
          </h3>
          <span className="text-xs text-gray-500">
            Audit Run: {auditResult?.auditTimestamp ? new Date(auditResult.auditTimestamp).toLocaleTimeString() : 'Recent'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Record Ref</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Scanning hospital data models for anomalies...
                  </td>
                </tr>
              ) : findings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-emerald-600 font-medium">
                    ✓ All operational databases passed integrity verification. No anomalies detected.
                  </td>
                </tr>
              ) : (
                findings.map((item, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/30 transition">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.module}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">{item.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-700'
                            : item.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">{item.recordId}</td>
                    <td className="px-4 py-3 text-gray-800 text-xs">{item.description}</td>
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

export default DataQuality;
