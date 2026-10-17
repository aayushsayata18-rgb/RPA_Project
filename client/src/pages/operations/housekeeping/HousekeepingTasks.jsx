import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  PlusCircle, 
  Play, 
  Pause, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import housekeepingService from '../../../services/housekeepingService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const HousekeepingTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Create Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    areaId: '',
    taskType: 'ROUTINE_CLEANING',
    priority: 'ROUTINE',
    description: '',
    notes: ''
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Assign Task Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedStaffName, setAssignedStaffName] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const fetchTasksAndAreas = async () => {
    try {
      setLoading(true);
      const [taskRes, areaRes] = await Promise.all([
        housekeepingService.listTasks({
          search,
          status: statusFilter,
          taskType: typeFilter,
          limit: 50
        }),
        housekeepingService.listAreas({ active: true })
      ]);

      if (taskRes.data?.data) {
        setTasks(Array.isArray(taskRes.data.data) ? taskRes.data.data : []);
      }
      if (areaRes.data?.data) {
        setAreas(Array.isArray(areaRes.data.data) ? areaRes.data.data : []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndAreas();
  }, [statusFilter, typeFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingCreate(true);
      const selectedArea = areas.find((a) => a._id === createForm.areaId);
      await housekeepingService.createTask({
        ...createForm,
        areaCode: selectedArea?.areaCode || '',
        areaName: selectedArea?.name || ''
      });
      setShowCreateModal(false);
      setCreateForm({
        areaId: '',
        taskType: 'ROUTINE_CLEANING',
        priority: 'ROUTINE',
        description: '',
        notes: ''
      });
      await fetchTasksAndAreas();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask || !assignedStaffName) return;

    try {
      setSubmittingAssign(true);
      await housekeepingService.assignTask(selectedTask._id, {
        assignedToName: assignedStaffName,
        assignedToId: 'EMP-HK-' + Math.floor(100 + Math.random() * 900)
      });
      setShowAssignModal(false);
      setSelectedTask(null);
      setAssignedStaffName('');
      await fetchTasksAndAreas();
    } catch (err) {
      console.error('Failed to assign task:', err);
      alert(err.response?.data?.message || 'Failed to assign staff');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleStart = async (taskId) => {
    try {
      await housekeepingService.startTask(taskId, {});
      await fetchTasksAndAreas();
    } catch (err) {
      console.error('Failed to start task:', err);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await housekeepingService.completeTask(taskId, {
        completionNotes: 'Cleaned and sanitized per hygiene protocols.'
      });
      await fetchTasksAndAreas();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const handleClose = async (taskId) => {
    try {
      await housekeepingService.closeTask(taskId, {
        closingNotes: 'Verified and closed by supervisor.'
      });
      await fetchTasksAndAreas();
    } catch (err) {
      console.error('Failed to close task:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTasksAndAreas();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <CheckSquare className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Housekeeping Tasks Management
            </h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Dispatch, track, and monitor daily hospital cleaning orders, terminal turnovers, and ad-hoc sanitations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasksAndAreas}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm border border-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            New Cleaning Task
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Task ID, Location, or Description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="UNASSIGNED">Unassigned</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Task Types</option>
          <option value="ROUTINE_CLEANING">Routine Cleaning</option>
          <option value="DISCHARGE_TURNOVER">Discharge Turnover</option>
          <option value="SPILL_CLEANUP">Spill Cleanup</option>
          <option value="DEEP_CLEAN">Deep Clean</option>
          <option value="BIOHAZARD">Biohazard</option>
          <option value="REWORK">Rework</option>
        </select>
      </form>

      {/* Tasks Table */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/60 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Task Details</th>
                <th className="px-6 py-4">Location / Area</th>
                <th className="px-6 py-4">Type & Priority</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No housekeeping tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{task.taskNumber || task.taskId}</div>
                      <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{task.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{task.areaName || task.areaCode || 'Facility Area'}</div>
                      {task.bedNumber && (
                        <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                          Bed: {task.bedNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-200">{task.taskType}</div>
                      <div className="mt-1">
                        <StatusBadge status={task.priority} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {task.assignedToName ? (
                        <div className="text-white text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {task.assignedToName}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowAssignModal(true);
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          + Assign Staff
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {task.status === 'UNASSIGNED' || task.status === 'ASSIGNED' || task.status === 'PENDING' ? (
                          <button
                            onClick={() => handleStart(task._id)}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" /> Start
                          </button>
                        ) : task.status === 'IN_PROGRESS' ? (
                          <button
                            onClick={() => handleComplete(task._id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Complete
                          </button>
                        ) : task.status === 'COMPLETED' ? (
                          <button
                            onClick={() => handleClose(task._id)}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs font-medium border border-gray-700 transition-colors flex items-center gap-1"
                          >
                            <CheckSquare className="w-3 h-3" /> Close
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Housekeeping Task"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Location / Area *
            </label>
            <select
              required
              value={createForm.areaId}
              onChange={(e) => setCreateForm({ ...createForm, areaId: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select Facility Area</option>
              {areas.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.areaCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Task Type
              </label>
              <select
                value={createForm.taskType}
                onChange={(e) => setCreateForm({ ...createForm, taskType: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="ROUTINE_CLEANING">Routine Cleaning</option>
                <option value="DISCHARGE_TURNOVER">Discharge Turnover</option>
                <option value="SPILL_CLEANUP">Spill Cleanup</option>
                <option value="DEEP_CLEAN">Deep Clean / Terminal</option>
                <option value="BIOHAZARD">Biohazard Sanitation</option>
                <option value="RESTOCK">Restock Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="ROUTINE">ROUTINE (3h SLA)</option>
                <option value="HIGH">HIGH (1h SLA)</option>
                <option value="URGENT">URGENT (60m SLA)</option>
                <option value="STAT">STAT (30m Immediate)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Task Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sanitize patient bathroom and washroom tiles"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Special Handling Instructions / Precautions
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Wet floor sign mandatory. Use neutral detergent."
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingCreate}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-600/20"
            >
              {submittingCreate ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Staff — ${selectedTask?.taskNumber || 'Task'}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Housekeeping Staff Member Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maria Gonzalez or John Doe"
              value={assignedStaffName}
              onChange={(e) => setAssignedStaffName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAssign}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-600/20"
            >
              {submittingAssign ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HousekeepingTasks;
