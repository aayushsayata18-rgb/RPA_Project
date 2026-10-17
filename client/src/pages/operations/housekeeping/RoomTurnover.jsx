import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Search, 
  PlusCircle, 
  Play, 
  RefreshCw,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';
import housekeepingService from '../../../services/housekeepingService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const RoomTurnover = () => {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Complete / Turnover Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [checklistResponses, setChecklistResponses] = useState([
    { itemCode: 'LINEN', label: 'Strip and bag all soiled bed linens', completed: true },
    { itemCode: 'SURF', label: 'Disinfect all horizontal & high-touch surfaces', completed: true },
    { itemCode: 'MOP', label: 'Wet mop floor with hospital-grade disinfectant', completed: true },
    { itemCode: 'RESTOCK', label: 'Restock sanitizers, soap, and paper products', completed: true }
  ]);
  const [submittingComplete, setSubmittingComplete] = useState(false);

  const fetchTurnoverBoard = async () => {
    try {
      setLoading(true);
      const res = await housekeepingService.getTurnoverBoard();
      if (res.data?.data) {
        setBoard(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error('Failed to load turnover board:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnoverBoard();
  }, []);

  const handleStartTurnover = async (taskId) => {
    try {
      await housekeepingService.startTask(taskId, {});
      await fetchTurnoverBoard();
    } catch (err) {
      console.error('Failed to start turnover:', err);
    }
  };

  const openCompleteModal = (task) => {
    setSelectedTask(task);
    setCompletionNotes('');
    setShowCompleteModal(true);
  };

  const handleCompleteTurnover = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      setSubmittingComplete(true);
      await housekeepingService.completeTask(selectedTask._id, {
        completionNotes: completionNotes || 'Terminal bed disinfection completed.',
        checklistResponses
      });
      setShowCompleteModal(false);
      setSelectedTask(null);
      await fetchTurnoverBoard();
    } catch (err) {
      console.error('Failed to complete turnover task:', err);
      alert(err.response?.data?.message || 'Failed to complete turnover task');
    } finally {
      setSubmittingComplete(false);
    }
  };

  const toggleChecklist = (index) => {
    const updated = [...checklistResponses];
    updated[index].completed = !updated[index].completed;
    setChecklistResponses(updated);
  };

  const filteredTasks = board.filter((t) => {
    const matchesSearch = 
      (t.bedNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.areaName || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.taskNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Bed className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Patient Room Turnover & Bed Readiness
            </h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Rapid terminal disinfection of discharged beds to restore availability for incoming inpatient admissions.
          </p>
        </div>

        <button
          onClick={fetchTurnoverBoard}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm border border-gray-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Board
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Bed Number, Area, or Task ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Priorities</option>
          <option value="STAT">STAT (30m Target)</option>
          <option value="URGENT">URGENT (60m Target)</option>
          <option value="ROUTINE">ROUTINE</option>
        </select>
      </div>

      {/* Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-900/40 border border-gray-800 rounded-xl text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/40 mb-3" />
            <div className="text-base font-medium text-gray-300">No Pending Bed Turnovers</div>
            <div className="text-sm mt-1">All patient discharge beds are disinfected and ready for admission.</div>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task._id}
              className="bg-gray-900/80 border border-gray-800 hover:border-emerald-500/40 rounded-xl p-5 backdrop-blur transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded">
                      <Bed className="w-4 h-4" />
                    </span>
                    <span className="font-semibold text-white text-base">
                      {task.bedNumber || task.areaCode || 'Bed Unit'}
                    </span>
                  </div>
                  <StatusBadge status={task.priority} />
                </div>

                <div className="text-xs text-gray-400 mb-2">
                  <span className="text-gray-500">Location:</span> {task.areaName || task.areaCode || 'Patient Inpatient Room'}
                </div>

                <div className="text-xs text-gray-300 bg-gray-800/60 p-2.5 rounded-lg border border-gray-700/50 mb-3">
                  {task.description || 'Terminal cleaning and bed turnover after patient discharge.'}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span>Assigned: {task.assignedToName || 'Unassigned'}</span>
                  <span>SLA: {task.slaDueAt ? new Date(task.slaDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '30 mins'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <StatusBadge status={task.status} />

                <div className="flex items-center gap-2">
                  {task.status === 'PENDING' || task.status === 'UNASSIGNED' || task.status === 'ASSIGNED' ? (
                    <button
                      onClick={() => handleStartTurnover(task._id)}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Clean
                    </button>
                  ) : task.status === 'IN_PROGRESS' ? (
                    <button
                      onClick={() => openCompleteModal(task)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete Turnover
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Room Released
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complete Turnover Modal with Checklist Verification */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title={`Complete Bed Turnover — ${selectedTask?.bedNumber || 'Patient Room'}`}
      >
        <form onSubmit={handleCompleteTurnover} className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-xs text-emerald-300">
            Complete the terminal disinfection checklist. Upon completion, this bed will be marked ready for patient admission.
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Terminal Cleaning Checklist Verification
            </label>
            <div className="space-y-2">
              {checklistResponses.map((item, idx) => (
                <label
                  key={item.itemCode}
                  className="flex items-center gap-3 p-2.5 bg-gray-800/60 hover:bg-gray-800 rounded-lg cursor-pointer border border-gray-700/60 text-xs text-gray-200 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklist(idx)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-gray-700 border-gray-600"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Sanitation Notes & Comments
            </label>
            <textarea
              rows="3"
              placeholder="e.g. UV decontamination run for 15 mins. Fresh linens fitted."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowCompleteModal(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingComplete}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20"
            >
              {submittingComplete ? 'Releasing Bed...' : 'Sign Off & Release Bed'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoomTurnover;
