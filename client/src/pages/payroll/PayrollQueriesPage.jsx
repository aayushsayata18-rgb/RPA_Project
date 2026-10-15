import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  PlusCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  Send,
  RefreshCw,
  Search
} from 'lucide-react';
import payrollService from '../../services/payrollService';

export const PayrollQueriesPage = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);

  const [formData, setFormData] = useState({
    category: 'OVERTIME_DISCREPANCY',
    subject: '',
    description: '',
    priority: 'MEDIUM',
    periodCode: ''
  });

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await payrollService.getMyQueries();
      setQueries(res?.queries || []);
    } catch (err) {
      console.error('Failed to load queries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await payrollService.submitMyQuery(formData);
      setShowSubmitModal(false);
      setFormData({
        category: 'OVERTIME_DISCREPANCY',
        subject: '',
        description: '',
        priority: 'MEDIUM',
        periodCode: ''
      });
      setNotification({ type: 'success', text: 'Payroll query submitted to HR & Finance team successfully!' });
      fetchQueries();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      OPEN: 'bg-blue-100 text-blue-800',
      ASSIGNED: 'bg-indigo-100 text-indigo-800',
      IN_REVIEW: 'bg-amber-100 text-amber-800',
      WAITING_FOR_INFORMATION: 'bg-purple-100 text-purple-800',
      RESOLVED: 'bg-emerald-100 text-emerald-800',
      REJECTED: 'bg-rose-100 text-rose-800',
      CLOSED: 'bg-slate-100 text-slate-700'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${map[status] || 'bg-gray-100 text-gray-700'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-purple-600" />
            Payroll Discrepancy & Support Queries
          </h1>
          <p className="text-sm text-slate-500">
            Submit questions regarding attendance, uncredited overtime, missing payslips, or deductions.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow transition"
        >
          <PlusCircle className="w-4 h-4" />
          Submit Query Ticket
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Queries List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {queries.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              {loading ? 'Loading queries...' : 'No payroll tickets submitted. Everything looks clear!'}
            </div>
          ) : (
            queries.map((q) => (
              <div
                key={q._id}
                onClick={() => setSelectedQuery(q)}
                className="p-5 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {q.queryId}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm">{q.subject}</span>
                  </div>
                  <p className="text-slate-500 line-clamp-1">{q.description}</p>
                  <div className="text-[11px] text-slate-400 space-x-2">
                    <span>Category: {q.category}</span>
                    <span>&bull;</span>
                    <span>Created: {new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(q.status)}
                  <span className="text-indigo-600 font-semibold text-xs hover:underline">
                    View Details &rarr;
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submit Ticket Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-base">Raise Payroll Query</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Query Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="OVERTIME_DISCREPANCY">Overtime Discrepancy / Missing Hours</option>
                  <option value="ATTENDANCE_DISCREPANCY">Attendance Punch Discrepancy</option>
                  <option value="LEAVE_DISCREPANCY">Leave Balance / Deduction Issue</option>
                  <option value="SALARY_DISCREPANCY">Salary Structure / Base Amount Question</option>
                  <option value="DEDUCTION_QUESTION">Deduction Explanation</option>
                  <option value="REIMBURSEMENT_QUESTION">Reimbursement Claim Question</option>
                  <option value="MISSING_PAYSLIP">Missing Payslip Request</option>
                  <option value="OTHER">Other General Query</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6 hours of weekend overtime not shown in draft"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Explanation</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide date, shift details, or supervisor approval context..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold shadow"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Query Detail Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-purple-300 block">{selectedQuery.queryId}</span>
                <h3 className="font-semibold text-sm">{selectedQuery.subject}</h3>
              </div>
              <button onClick={() => setSelectedQuery(null)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span>Status: {getStatusBadge(selectedQuery.status)}</span>
                <span className="text-slate-500">Priority: {selectedQuery.priority}</span>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Description:</span>
                <p className="text-slate-600 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  {selectedQuery.description}
                </p>
              </div>

              {selectedQuery.resolution && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 space-y-1">
                  <span className="font-semibold text-emerald-800 block flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Resolution:
                  </span>
                  <p className="text-emerald-900 text-xs">{selectedQuery.resolution}</p>
                </div>
              )}

              {/* Activity Log */}
              {selectedQuery.activityLog?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-700 block text-xs">Timeline:</span>
                  <div className="space-y-1">
                    {selectedQuery.activityLog.map((log, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-500">
                        <span>{log.action}: {log.comment}</span>
                        <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedQuery(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollQueriesPage;
