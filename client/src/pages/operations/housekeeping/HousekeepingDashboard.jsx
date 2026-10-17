import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bed, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  CheckSquare, 
  Layers, 
  ShieldCheck, 
  Package, 
  Play, 
  PlusCircle, 
  ExternalLink 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import housekeepingService from '../../../services/housekeepingService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const HousekeepingDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedToday: 0,
    openTurnovers: 0,
    inspectionPassRate: 100,
    criticalExceptions: 0
  });
  const [turnoverTasks, setTurnoverTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Action Modal State
  const [showTurnoverModal, setShowTurnoverModal] = useState(false);
  const [turnoverForm, setTurnoverForm] = useState({
    bedId: '',
    bedNumber: '',
    ward: '',
    priority: 'STAT',
    notes: ''
  });
  const [submittingTurnover, setSubmittingTurnover] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [dashRes, boardRes, tasksRes] = await Promise.all([
        housekeepingService.getDashboardMetrics().catch(() => ({ data: { data: {} } })),
        housekeepingService.getTurnoverBoard().catch(() => ({ data: { data: [] } })),
        housekeepingService.listTasks({ limit: 8, sort: '-createdAt' }).catch(() => ({ data: { data: [] } }))
      ]);

      if (dashRes.data?.data) {
        setMetrics(dashRes.data.data);
      }
      if (boardRes.data?.data) {
        setTurnoverTasks(Array.isArray(boardRes.data.data) ? boardRes.data.data : []);
      }
      if (tasksRes.data?.data) {
        setRecentTasks(Array.isArray(tasksRes.data.data) ? tasksRes.data.data : []);
      }
    } catch (err) {
      console.error('Failed to load housekeeping dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateTurnover = async (e) => {
    e.preventDefault();
    try {
      setSubmittingTurnover(true);
      await housekeepingService.triggerBedTurnover(turnoverForm);
      setShowTurnoverModal(false);
      setTurnoverForm({ bedId: '', bedNumber: '', ward: '', priority: 'STAT', notes: '' });
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to trigger bed turnover:', err);
      alert(err.response?.data?.message || 'Failed to trigger turnover');
    } finally {
      setSubmittingTurnover(false);
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      await housekeepingService.startTask(taskId, {});
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to start task:', err);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await housekeepingService.completeTask(taskId, {
        completionNotes: 'Cleaned and sanitized to hospital hygiene protocols.'
      });
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Housekeeping & Facility Hygiene Command
            </h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Real-time patient room turnover, terminal disinfection workflows, SLA compliance, and facility sanitation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm transition-colors border border-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowTurnoverModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Trigger Bed Turnover
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-4 backdrop-blur">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span>Active Tasks</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {metrics.inProgressTasks || 0}
          </div>
          <div className="text-xs text-cyan-400/80 mt-1">Under execution</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-4 backdrop-blur">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span>Bed Turnovers</span>
            <Bed className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {metrics.openTurnovers || turnoverTasks.length}
          </div>
          <div className="text-xs text-amber-400/80 mt-1">Discharge turnover queue</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-4 backdrop-blur">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span>Pending Allocation</span>
            <CheckSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {metrics.pendingTasks || 0}
          </div>
          <div className="text-xs text-purple-400/80 mt-1">Awaiting dispatch</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-4 backdrop-blur">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span>Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {metrics.completedToday || 0}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">Terminal disinfections</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-4 backdrop-blur">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span>Quality Pass Rate</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">
            {metrics.inspectionPassRate || 100}%
          </div>
          <div className="text-xs text-blue-400/80 mt-1">Audit compliance</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800/80 rounded-xl p-4 backdrop-blur">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span>Exceptions</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {metrics.criticalExceptions || 0}
          </div>
          <div className="text-xs text-rose-400/80 mt-1">Biohazard / spills</div>
        </div>
      </div>

      {/* Bed Turnover Live Board */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden backdrop-blur">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Discharge Room Turnover Worklist</h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Flow
            </span>
          </div>
          <Link
            to="/operations/housekeeping/turnover"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
          >
            Open Full Turnover Board <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6">
          {turnoverTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <CheckCircle2 className="w-10 h-10 mx-auto text-gray-600 mb-2" />
              All discharge beds have been turned over and disinfected. No pending turnover tasks.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {turnoverTasks.slice(0, 6).map((item) => (
                <div
                  key={item._id}
                  className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-emerald-400" />
                        {item.bedNumber || item.areaCode || 'Bed Unit'}
                      </span>
                      <StatusBadge status={item.priority || 'STAT'} />
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {item.areaName || 'Patient Room'}
                    </div>
                    <div className="text-xs text-gray-300 bg-gray-900/60 p-2 rounded border border-gray-800 mb-3 line-clamp-2">
                      {item.description || 'Terminal cleaning and bed turnover requisition.'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-700/40 flex items-center justify-between">
                    <StatusBadge status={item.status} />
                    <div className="flex items-center gap-2">
                      {item.status === 'PENDING' || item.status === 'UNASSIGNED' || item.status === 'ASSIGNED' ? (
                        <button
                          onClick={() => handleStartTask(item._id)}
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Start
                        </button>
                      ) : item.status === 'IN_PROGRESS' ? (
                        <button
                          onClick={() => handleCompleteTask(item._id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Complete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Housekeeping Tasks Stream & Quick Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks List */}
        <div className="lg:col-span-2 bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden backdrop-blur">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Operational Tasks Feed</h2>
            </div>
            <Link
              to="/operations/housekeeping/tasks"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
            >
              View All Tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-800/80">
            {recentTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No active housekeeping tasks logged.
              </div>
            ) : (
              recentTasks.map((t) => (
                <div key={t._id} className="p-4 hover:bg-gray-800/30 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-gray-800 text-gray-300 rounded-lg mt-0.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </span>
                    <div>
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        <span>{t.taskNumber || t.taskId}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300">{t.areaName || t.areaCode || 'Facility Area'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {t.description || t.taskType}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <span>Type: {t.taskType}</span>
                        <span>•</span>
                        <span>Assigned: {t.assignedToName || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={t.status} />
                    <span className="text-[10px] text-gray-400">
                      Priority: {t.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Operations Links */}
        <div className="space-y-4">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 backdrop-blur">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-3">
              Housekeeping Modules
            </h3>
            <div className="space-y-2">
              <Link
                to="/operations/housekeeping/turnover"
                className="flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 text-gray-200 rounded-lg text-sm border border-gray-800 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Bed className="w-4 h-4 text-emerald-400" />
                  <span>Bed Turnover Board</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/operations/housekeeping/areas"
                className="flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 text-gray-200 rounded-lg text-sm border border-gray-800 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Facility Areas & Rooms</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/operations/housekeeping/checklists"
                className="flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 text-gray-200 rounded-lg text-sm border border-gray-800 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                  <span>Cleaning Checklists</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/operations/housekeeping/inspections"
                className="flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 text-gray-200 rounded-lg text-sm border border-gray-800 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Quality Inspections</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/operations/housekeeping/supplies"
                className="flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 text-gray-200 rounded-lg text-sm border border-gray-800 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Consumable Supplies</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/operations/housekeeping/exceptions"
                className="flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 text-gray-200 rounded-lg text-sm border border-gray-800 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Exceptions & Spills</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/operations/housekeeping/analytics"
                className="flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 text-gray-200 rounded-lg text-sm border border-gray-800 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-teal-400" />
                  <span>Hygiene Analytics & SLA</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Bed Turnover Modal */}
      <Modal
        isOpen={showTurnoverModal}
        onClose={() => setShowTurnoverModal(false)}
        title="Trigger Patient Room / Bed Turnover"
      >
        <form onSubmit={handleCreateTurnover} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Bed Number / Room Identifier *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BED-101-A or Room 102"
              value={turnoverForm.bedNumber}
              onChange={(e) => setTurnoverForm({ ...turnoverForm, bedNumber: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Ward / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Ward A / Floor 3"
                value={turnoverForm.ward}
                onChange={(e) => setTurnoverForm({ ...turnoverForm, ward: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={turnoverForm.priority}
                onChange={(e) => setTurnoverForm({ ...turnoverForm, priority: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="STAT">STAT (Immediate 30m SLA)</option>
                <option value="URGENT">URGENT (60m SLA)</option>
                <option value="ROUTINE">ROUTINE (3h SLA)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Clinical Turnover Notes / Isolation Precautions
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Contact isolation precautions. Enhanced chlorine disinfection required."
              value={turnoverForm.notes}
              onChange={(e) => setTurnoverForm({ ...turnoverForm, notes: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowTurnoverModal(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingTurnover}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20"
            >
              {submittingTurnover ? 'Dispatching...' : 'Dispatch Turnover Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HousekeepingDashboard;
