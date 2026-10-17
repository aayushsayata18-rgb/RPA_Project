import React, { useState, useEffect } from 'react';
import { housekeepingService } from '../../../services/housekeepingService';
import {
  Boxes,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  PackageCheck
} from 'lucide-react';

export const HousekeepingSupplies = () => {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    requestedBy: 'Housekeeping Staff',
    shiftType: 'MORNING',
    items: [{ itemName: 'Hospital Surface Disinfectant Tabs', quantityRequested: 5, unit: 'BOX' }],
    notes: ''
  });

  const fetchSupplies = async () => {
    setLoading(true);
    try {
      const res = await housekeepingService.listSupplies();
      if (res.data?.data) {
        setSupplies(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load supplies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplies();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await housekeepingService.requestSupplies(formData);
      setShowModal(false);
      setFormData({
        requestedBy: 'Housekeeping Staff',
        shiftType: 'MORNING',
        items: [{ itemName: 'Hospital Surface Disinfectant Tabs', quantityRequested: 5, unit: 'BOX' }],
        notes: ''
      });
      fetchSupplies();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      await housekeepingService.approveSupply(id, { approvalNotes: 'Approved for shift' });
      fetchSupplies();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleIssue = async (id) => {
    try {
      await housekeepingService.issueSupply(id, {});
      fetchSupplies();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Cleaning Consumables Requisition</h1>
            <p className="text-sm text-slate-400">
              Manage disinfectants, cloths, gloves, biohazard bags, and supply inventory integration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSupplies}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-cyan-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Request Supplies
          </button>
        </div>
      </div>

      {/* Supplies Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3">Items & Quantities</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading requisitions...
                  </td>
                </tr>
              ) : supplies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No consumable requests found.
                  </td>
                </tr>
              ) : (
                supplies.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-mono text-cyan-400 font-medium">{req.requestId}</td>
                    <td className="px-4 py-3.5 font-medium text-white">{req.requestedBy || 'Staff'}</td>
                    <td className="px-4 py-3.5 text-slate-300">{req.shiftType || 'MORNING'}</td>
                    <td className="px-4 py-3.5 space-y-0.5">
                      {req.items?.map((it, idx) => (
                        <div key={idx} className="text-slate-300">
                          {it.itemName}: <span className="text-white font-semibold">{it.quantityRequested} {it.unit}</span>
                          {it.quantityIssued ? <span className="text-emerald-400 ml-1">(Issued: {it.quantityIssued})</span> : null}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.status === 'ISSUED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : req.status === 'APPROVED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      {req.status === 'PENDING' && (
                        <button
                          onClick={() => handleApprove(req._id)}
                          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded text-[11px] font-semibold transition"
                        >
                          Approve
                        </button>
                      )}
                      {req.status === 'APPROVED' && (
                        <button
                          onClick={() => handleIssue(req._id)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-semibold transition"
                        >
                          Issue Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Request Supplies */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Requisition Cleaning Consumables</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chlorine Surface Disinfectant Tabs"
                  value={formData.items[0].itemName}
                  onChange={(e) => {
                    const items = [...formData.items];
                    items[0].itemName = e.target.value;
                    setFormData({ ...formData, items });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantity Requested</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.items[0].quantityRequested}
                    onChange={(e) => {
                      const items = [...formData.items];
                      items[0].quantityRequested = Number(e.target.value);
                      setFormData({ ...formData, items });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit</label>
                  <select
                    value={formData.items[0].unit}
                    onChange={(e) => {
                      const items = [...formData.items];
                      items[0].unit = e.target.value;
                      setFormData({ ...formData, items });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="BOX">Box</option>
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="BOTTLE">Bottle</option>
                    <option value="PACK">Pack</option>
                    <option value="ROLL">Roll</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Shift</label>
                <select
                  value={formData.shiftType}
                  onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="MORNING">Morning Shift</option>
                  <option value="EVENING">Evening Shift</option>
                  <option value="NIGHT">Night Shift</option>
                </select>
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
