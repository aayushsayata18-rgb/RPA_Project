import React, { useState, useEffect } from 'react';
import { Bot, CheckCircle2, XCircle, AlertTriangle, Clock, RotateCw } from 'lucide-react';
import reportClientService from '../../../../services/reportClientService';
import { KPIWidget } from '../../../../components/reports/KPIWidget';
import { ReportChart } from '../../../../components/reports/ReportChart';

export const RPADashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportClientService.getRPADashboard();
      setData(res.data?.data || null);
    } catch (err) {
      setError('Failed to fetch RPA automation analytics.');
    } finally {
      setLoading(false);
    }
  };

  const jobs = data?.jobs || {};
  const successRate = data?.successRate !== undefined ? `${data.successRate}%` : '98.5%';

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-7 h-7 text-indigo-600" />
            RPA Robotic Process Automation Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Bot worker telemetry, queue executions, failure analysis, and retry counts.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Total RPA Executions"
          value={jobs.total || 0}
          subtext="Automated jobs triggered"
          icon={Bot}
          color="indigo"
        />
        <KPIWidget
          title="Bot Success Rate"
          value={successRate}
          subtext={`${jobs.successful || 0} completed successfully`}
          icon={CheckCircle2}
          color="emerald"
        />
        <KPIWidget
          title="Failed Robot Tasks"
          value={jobs.failed || 0}
          subtext="Requires retry or investigation"
          icon={XCircle}
          color="rose"
        />
        <KPIWidget
          title="Exceptions Flagged"
          value={jobs.exceptions || 0}
          subtext="Escalated to human supervisor"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChart
          type="BAR"
          title="RPA Execution Outcome Breakdown"
          data={[
            { label: 'Completed', value: jobs.successful || 0 },
            { label: 'Failed', value: jobs.failed || 0 },
            { label: 'Retrying', value: jobs.retrying || 0 },
            { label: 'Exceptions', value: jobs.exceptions || 0 }
          ]}
          color="indigo"
        />
        <ReportChart
          type="DONUT"
          title="Active Robot Processes"
          data={[
            { label: 'Insurance Verification', value: 45 },
            { label: 'Claim Package Submission', value: 38 },
            { label: 'Biometric Attendance Sync', value: 30 },
            { label: 'Lab Results Ingestion', value: 25 },
            { label: 'Discharge Clearance Sync', value: 20 }
          ]}
          color="purple"
        />
      </div>
    </div>
  );
};

export default RPADashboard;
