import React, { useState, useEffect } from 'react';
import { Activity, Bed, Users, Calendar, Stethoscope, RotateCw, AlertTriangle } from 'lucide-react';
import reportClientService from '../../../../services/reportClientService';
import { KPIWidget } from '../../../../components/reports/KPIWidget';
import { ReportChart } from '../../../../components/reports/ReportChart';

export const OperationsDashboard = () => {
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
      const res = await reportClientService.getOperationsDashboard();
      setData(res.data?.data || null);
    } catch (err) {
      setError('Failed to fetch operations dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const beds = data?.beds || {};
  const bedChartData = [
    { label: 'Occupied', value: beds.occupied || 0 },
    { label: 'Available', value: beds.available || 0 },
    { label: 'Cleaning', value: beds.cleaning || 0 },
    { label: 'Maintenance', value: beds.maintenance || 0 }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" />
            Clinical & Facility Operations Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time bed census, live OPD queues, and pending diagnostic orders.
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
          title="Total Bed Capacity"
          value={beds.total || 0}
          subtext={`${beds.occupied || 0} occupied • ${beds.available || 0} ready`}
          icon={Bed}
          color="indigo"
        />
        <KPIWidget
          title="Active OPD Queue"
          value={data?.activeOpdQueueTokens || 0}
          subtext="Tokens in waiting & consultation"
          icon={Users}
          color="blue"
        />
        <KPIWidget
          title="Pending Lab Tests"
          value={data?.pendingDiagnosticLabs || 0}
          subtext="Unprocessed laboratory samples"
          icon={Stethoscope}
          color="amber"
        />
        <KPIWidget
          title="Pending Radiology"
          value={data?.pendingRadiologyOrders || 0}
          subtext="Awaiting scan or reporting"
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChart
          type="BAR"
          title="Bed Distribution Census"
          data={bedChartData}
          color="indigo"
        />
        <ReportChart
          type="DONUT"
          title="Diagnostic & Queue Backlog"
          data={[
            { label: 'OPD Queue Tokens', value: data?.activeOpdQueueTokens || 0 },
            { label: 'Lab Orders Pending', value: data?.pendingDiagnosticLabs || 0 },
            { label: 'Radiology Orders Pending', value: data?.pendingRadiologyOrders || 0 }
          ]}
          color="blue"
        />
      </div>
    </div>
  );
};

export default OperationsDashboard;
