import React, { useState, useEffect } from 'react';
import { housekeepingService } from '../../../services/housekeepingService';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Star,
  AlertTriangle
} from 'lucide-react';

export const HousekeepingInspections = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    taskId: '',
    score: 95,
    rating: 5,
    passed: true,
    findings: '',
    rectificationRequired: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inspRes, tasksRes] = await Promise.all([
        housekeepingService.listInspections(),
        housekeepingService.listTasks({ status: 'PENDING_INSPECTION' })
      ]);
      if (inspRes.data?.data) setInspections(inspRes.data.data);
      if (tasksRes.data?.data) setTasks(tasksRes.data.data);
    } catch (err) {
      console.error('Failed to load inspections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await housekeepingService.performInspection(formData);
      setShowModal(false);
      setFormData({
        taskId: '',
        score: 95,
        rating: 5,
        passed: true,
        findings: '',
        rectificationRequired: false
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Supervisor Quality Inspections</h1>
            <p className="text-sm text-slate-400">
              Sanitation verification audits, rating scorecards, and automated rework generation for failed inspections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Perform Audit
          </button>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Audit ID</th>
                <th className="px-4 py-3">Task Number</th>
                <th className="px-4 py-3">Inspector</th>
                <th className="px-4 py-3">Score / Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Findings / Notes</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                    Loading inspection records...
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No quality audits recorded yet.
                  </td>
                </tr>
              ) : (
                inspections.map((insp) => (
                  <tr key={insp._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-mono text-purple-400 font-medium">
                      {insp.inspectionId}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-white">{insp.taskNumber || 'TASK'}</td>
                    <td className="px-4 py-3.5 text-slate-300 font-medium">{insp.inspectorName}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 font-bold text-white">
                        <span>{insp.score ?? 100}%</span>
                        <span className="text-amber-400 text-[10px]">({insp.rating || 5}★)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          insp.status === 'PASSED' || insp.passed === true
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {insp.status === 'PASSED' || insp.passed === true ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> PASS
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> FAIL (REWORK)
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 max-w-xs truncate">
                      {insp.findings || insp.notes || 'Standards met.'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(insp.inspectionDate || insp.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Perform Inspection */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Record Quality Inspection</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Cleaning Task</label>
                <select
                  required
                  value={formData.taskId}
                  onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select task ready for inspection...</option>
                  {tasks.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.taskId} - {t.areaName || t.taskType} ({t.priority})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => {
                      const score = Number(e.target.value);
                      setFormData({
                        ...formData,
                        score,
                        passed: score >= 75
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Verdict</label>
                  <select
                    value={formData.passed ? 'PASS' : 'FAIL'}
                    onChange={(e) => {
                      const isPass = e.target.value === 'PASS';
                      setFormData({
                        ...formData,
                        passed: isPass,
                        rectificationRequired: !isPass
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="PASS">PASS (Release Area)</option>
                    <option value="FAIL">FAIL (Trigger Rework)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Findings & Observations</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record supervisor findings or defects..."
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition"
                >
                  Submit Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
