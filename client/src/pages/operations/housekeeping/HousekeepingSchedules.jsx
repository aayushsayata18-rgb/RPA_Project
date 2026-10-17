import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  Layers, 
  RefreshCw,
  Edit3
} from 'lucide-react';
import housekeepingService from '../../../services/housekeepingService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const HousekeepingSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [areas, setAreas] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    scheduleCode: '',
    title: '',
    areaId: '',
    frequency: 'DAILY',
    shiftType: 'MORNING',
    priority: 'ROUTINE',
    defaultChecklistId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, areaRes, chkRes] = await Promise.all([
        housekeepingService.listSchedules(),
        housekeepingService.listAreas({ active: true }),
        housekeepingService.listChecklists()
      ]);

      if (schedRes.data?.data) {
        setSchedules(Array.isArray(schedRes.data.data) ? schedRes.data.data : []);
      }
      if (areaRes.data?.data) {
        setAreas(Array.isArray(areaRes.data.data) ? areaRes.data.data : []);
      }
      if (chkRes.data?.data) {
        setChecklists(Array.isArray(chkRes.data.data) ? chkRes.data.data : []);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await housekeepingService.createSchedule(formData);
      setShowModal(false);
      setFormData({
        scheduleCode: '',
        title: '',
        areaId: '',
        frequency: 'DAILY',
        shiftType: 'MORNING',
        priority: 'ROUTINE',
        defaultChecklistId: ''
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to create schedule:', err);
      alert(err.response?.data?.message || 'Failed to create schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (scheduleId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await housekeepingService.updateScheduleStatus(scheduleId, { status: nextStatus });
      await fetchData();
    } catch (err) {
      console.error('Failed to toggle schedule status:', err);
    }
  };

  const filtered = schedules.filter((s) =>
    (s.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.scheduleCode || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Calendar className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Routine Cleaning Schedules & Shift Rotas
            </h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Configure automated daily, shift-based, and periodic facility sanitation cadences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm border border-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            New Recurring Schedule
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by title or schedule code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-900/40 border border-gray-800 rounded-xl text-gray-500">
            No recurring housekeeping schedules configured.
          </div>
        ) : (
          filtered.map((sched) => (
            <div
              key={sched._id}
              className="bg-gray-900/80 border border-gray-800 hover:border-blue-500/40 rounded-xl p-5 backdrop-blur transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white text-base">
                    {sched.title}
                  </span>
                  <StatusBadge status={sched.status} />
                </div>

                <div className="text-xs font-mono text-blue-400 mb-2">
                  {sched.scheduleCode}
                </div>

                <div className="space-y-1 text-xs text-gray-400 mb-4 bg-gray-800/40 p-3 rounded-lg border border-gray-800">
                  <div className="flex items-center justify-between">
                    <span>Cadence:</span>
                    <span className="text-gray-200 font-medium">{sched.frequency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shift Type:</span>
                    <span className="text-gray-200 font-medium">{sched.shiftType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Priority:</span>
                    <span className="text-gray-200 font-medium">{sched.priority}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <button
                  onClick={() => handleStatusToggle(sched._id, sched.status)}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                    sched.status === 'ACTIVE'
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {sched.status === 'ACTIVE' ? 'Pause Schedule' : 'Activate Schedule'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Recurring Cleaning Schedule"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Schedule Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SCH-CORR-DAILY"
                value={formData.scheduleCode}
                onChange={(e) => setFormData({ ...formData, scheduleCode: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Frequency *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="HOURLY">Hourly Sanitation</option>
                <option value="PER_SHIFT">Every Shift</option>
                <option value="DAILY">Daily Morning/Evening</option>
                <option value="WEEKLY">Weekly Deep Clean</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Schedule Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Daily Trauma Corridor Floor Sanitation"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Assigned Facility Area *
              </label>
              <select
                required
                value={formData.areaId}
                onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Area</option>
                {areas.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.areaCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Shift Type
              </label>
              <select
                value={formData.shiftType}
                onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="MORNING">Morning Shift</option>
                <option value="EVENING">Evening Shift</option>
                <option value="NIGHT">Night Shift</option>
                <option value="ALL">All Shifts</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Linked Checklist (Optional)
            </label>
            <select
              value={formData.defaultChecklistId}
              onChange={(e) => setFormData({ ...formData, defaultChecklistId: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">No Default Checklist</option>
              {checklists.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} ({c.checklistCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-600/20"
            >
              {submitting ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HousekeepingSchedules;
