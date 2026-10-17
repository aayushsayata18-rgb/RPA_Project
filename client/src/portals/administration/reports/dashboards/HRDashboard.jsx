import React, { useState, useEffect } from 'react';
import { Users, Clock, Calendar, CheckSquare, RotateCw, AlertTriangle } from 'lucide-react';
import reportClientService from '../../../../services/reportClientService';
import { KPIWidget } from '../../../../components/reports/KPIWidget';
import { ReportChart } from '../../../../components/reports/ReportChart';

export const HRDashboard = () => {
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
      const res = await reportClientService.getHRDashboard();
      setData(res.data?.data || null);
    } catch (err) {
      setError('Failed to fetch workforce & HR analytics.');
    } finally {
      setLoading(false);
    }
  };

  const attendance = data?.attendance || {};
  const shifts = data?.shifts || {};

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Workforce, Roster & Attendance Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Staff directory metrics, biometric punch reconciliation, and rota coverage tracking.
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
          title="Active Headcount"
          value={data?.totalEmployees || 0}
          subtext="Clinicians, nurses & operations"
          icon={Users}
          color="indigo"
        />
        <KPIWidget
          title="Present Today"
          value={attendance.present || 0}
          subtext={`${attendance.late || 0} recorded late punches`}
          icon={Clock}
          color="emerald"
        />
        <KPIWidget
          title="Approved Leaves Today"
          value={attendance.onLeave || 0}
          subtext="Scheduled medical & annual leaves"
          icon={Calendar}
          color="amber"
        />
        <KPIWidget
          title="Shift Coverage Rate"
          value={`${shifts.coveragePercent || 100}%`}
          subtext={`${shifts.gapCount || 0} open shift slots`}
          icon={CheckSquare}
          color="blue"
        />
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChart
          type="BAR"
          title="Daily Attendance Breakdown"
          data={[
            { label: 'Present', value: attendance.present || 0 },
            { label: 'Late', value: attendance.late || 0 },
            { label: 'On Leave', value: attendance.onLeave || 0 },
            { label: 'Absent', value: attendance.absent || 0 }
          ]}
          color="indigo"
        />
        <ReportChart
          type="DONUT"
          title="Shift Roster Fulfillment"
          data={[
            { label: 'Assigned Shifts', value: shifts.assignedShifts || 0 },
            { label: 'Coverage Gaps', value: shifts.gapCount || 0 },
            { label: 'Swaps Pending', value: shifts.pendingSwaps || 0 }
          ]}
          color="purple"
        />
      </div>
    </div>
  );
};

export default HRDashboard;
