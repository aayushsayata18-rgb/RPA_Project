import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  PlusCircle,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Cpu,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import maintenanceService from '../../../services/maintenanceService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const PreventiveMaintenance = () => {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [checklists, setChecklists] = useState([]);

  // New PM Plan Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    assetId: '',
    maintenanceType: 'PREVENTIVE',
    frequencyType: 'MONTHLY',
    intervalValue: 1,
    nextDueDate: '',
    checklistId: '',
    instructions: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getPlans();
      setPlans(res.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [astRes, chkRes] = await Promise.all([
        maintenanceService.getAssets({ limit: 100 }),
        maintenanceService.getChecklists()
      ]);
      setAssets(astRes.data?.items || []);
      setChecklists(chkRes.data?.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchPlans();
    loadDependencies();
  }, []);

  const handleGenerateWO = async (planId) => {
    try {
      const res = await maintenanceService.generateWorkOrderFromPlan(planId);
      alert(`Work order generated successfully: ${res.data?.data?.workOrderId}`);
      fetchPlans();
      navigate(`/operations/maintenance/work-orders/${res.data?.data?._id}`);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Generation failed');
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await maintenanceService.createPlan(formData);
      setShowModal(false);
      setFormData({
        title: '',
        assetId: '',
        maintenanceType: 'PREVENTIVE',
        frequencyType: 'MONTHLY',
        intervalValue: 1,
        nextDueDate: '',
        checklistId: '',
        instructions: ''
      });
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="preventive-maintenance-page p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            Preventive Maintenance (PM) Schedules & Plans
          </h1>
          <p className="text-sm text-gray-500">
            Automated recurring maintenance cycles, due date tracking, and work order generation
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New PM Plan
        </button>
      </div>

      {/* Plans List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Plan ID</th>
                <th className="py-3 px-4">Routine Title</th>
                <th className="py-3 px-4">Target Asset</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4">Checklist</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Loading PM plans...</td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">No preventive maintenance plans configured.</td>
                </tr>
              ) : (
                plans.map((p) => {
                  const isOverdue = p.nextDueDate && new Date(p.nextDueDate) < new Date();
                  return (
                    <tr key={p._id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{p.planId}</td>

                      <td className="py-3.5 px-4 font-semibold text-gray-900">{p.title}</td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">{p.assetId?.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{p.assetId?.assetTag}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs px-2 py-0.5 rounded font-bold bg-gray-100 text-gray-700">
                          {p.frequencyType} ({p.intervalValue}x)
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-semibold ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                          {p.nextDueDate ? new Date(p.nextDueDate).toLocaleDateString() : 'N/A'}
                        </span>
                        {isOverdue && (
                          <span className="ml-1.5 text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                            OVERDUE
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {p.checklistId?.name || 'Standard Routine'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleGenerateWO(p._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold text-xs transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Generate WO
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New PM Plan */}
      {showModal && (
        <Modal title="Configure Preventive Maintenance Plan" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Plan Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Monthly Dialysis Filter Sanitization"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Asset *</label>
              <select
                required
                value={formData.assetId}
                onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="">-- Choose Equipment --</option>
                {assets.map((a) => (
                  <option key={a._id} value={a._id}>{a.name} ({a.assetTag})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Frequency Cycle</label>
                <select
                  value={formData.frequencyType}
                  onChange={(e) => setFormData({ ...formData, frequencyType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="DAILY">DAILY</option>
                  <option value="WEEKLY">WEEKLY</option>
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="QUARTERLY">QUARTERLY</option>
                  <option value="HALF_YEARLY">HALF YEARLY</option>
                  <option value="YEARLY">YEARLY</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">First / Next Due Date</label>
                <input
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Standard Checklist</label>
              <select
                value={formData.checklistId}
                onChange={(e) => setFormData({ ...formData, checklistId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="">-- Select Checklist Template --</option>
                {checklists.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({c.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Standard Operating Instructions</label>
              <textarea
                rows={3}
                placeholder="Detailed OEM maintenance guidelines, tools required..."
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm"
              >
                {submitting ? 'Creating...' : 'Save Plan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PreventiveMaintenance;
