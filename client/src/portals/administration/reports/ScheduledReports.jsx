import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, CheckCircle2, XCircle, RotateCw, AlertTriangle } from 'lucide-react';
import reportClientService from '../../../services/reportClientService';

export const ScheduledReports = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [reportCode, setReportCode] = useState('BED_OCCUPANCY');
  const [frequency, setFrequency] = useState('DAILY');
  const [format, setFormat] = useState('CSV');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportClientService.listSchedules();
      setSchedules(res.data?.data || []);
    } catch (err) {
      setError('Failed to fetch recurring report schedules.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (scheduleId, currentStatus) => {
    try {
      await reportClientService.updateSchedule(scheduleId, { enabled: !currentStatus });
      fetchSchedules();
    } catch (err) {
      alert('Failed to update schedule status.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await reportClientService.createSchedule({
        reportCode,
        frequency,
        format
      });
      setShowModal(false);
      fetchSchedules();
    } catch (err) {
      alert('Failed to create report schedule.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600" />
            Recurring & Scheduled Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Automate periodic report generation and notification dispatch.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSchedules}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Schedule
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Schedules Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Schedule ID</th>
                <th className="px-4 py-3">Report Code</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Run</th>
                <th className="px-4 py-3">Next Run</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Loading schedules...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No active recurring report schedules configured.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.scheduleId || s._id} className="hover:bg-indigo-50/30 transition">
                    <td className="px-4 py-3 font-mono font-medium text-indigo-600 text-xs">
                      {s.scheduleId}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {s.reportCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-xs text-gray-700">
                      {s.frequency}
                    </td>
                    <td className="px-4 py-3 font-medium text-xs text-gray-600">
                      {s.outputFormat || 'CSV'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          s.enabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {s.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {s.lastRunAt ? new Date(s.lastRunAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">
                      {s.nextRunAt ? new Date(s.nextRunAt).toLocaleDateString() : 'Pending'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggle(s.scheduleId, s.enabled)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                          s.enabled
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-indigo-600 hover:bg-indigo-50'
                        }`}
                      >
                        {s.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Configure Report Schedule</h3>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  value={reportCode}
                  onChange={(e) => setReportCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="BED_OCCUPANCY">Bed Occupancy Report</option>
                  <option value="BILLING_SUMMARY">Billing Summary Report</option>
                  <option value="PATIENT_REGISTRATION_SUMMARY">Patient Registration Summary</option>
                  <option value="APPOINTMENT_SUMMARY">Appointment Summary Report</option>
                  <option value="INVENTORY_STOCK_SUMMARY">Inventory Stock Report</option>
                  <option value="RPA_EXECUTION">RPA Execution Report</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Recurrence Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DAILY">Daily (Every 24 hours)</option>
                  <option value="WEEKLY">Weekly (Every Monday)</option>
                  <option value="MONTHLY">Monthly (1st of month)</option>
                  <option value="QUARTERLY">Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Export Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CSV">CSV (.csv)</option>
                  <option value="PDF">PDF (.pdf)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledReports;
