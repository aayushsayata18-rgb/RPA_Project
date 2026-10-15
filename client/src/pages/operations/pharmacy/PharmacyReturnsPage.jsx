import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  PackageX,
  X,
  RefreshCw,
  Layers,
  ChevronRight
} from 'lucide-react';
import pharmacyService from '../../../services/pharmacyService';
import { useAuth } from '../../../context/AuthContext';

export const PharmacyReturnsPage = () => {
  const { user } = useAuth();

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Approval Modal
  const [reviewingReturn, setReviewingReturn] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Disposition Modal
  const [dispositionReturn, setDispositionReturn] = useState(null);
  const [selectedDisposition, setSelectedDisposition] = useState('QUARANTINE');

  // New Return Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({
    patientId: 'P10045',
    dispensingRecordId: 'DISP-20261016-00001',
    reason: 'PATIENT_RETURN',
    reasonDetails: 'Patient brought back unopened blister strip',
    medicineId: 'MED-000001',
    quantity: 5,
    condition: 'UNOPENED'
  });

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await pharmacyService.getReturns({
        status: statusFilter
      });
      if (res.data?.returns) {
        setReturns(res.data.returns);
      }
    } catch (err) {
      console.error('Failed to load returns:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load returns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const handleReview = async (action) => {
    if (!reviewingReturn) return;
    try {
      setError(null);
      await pharmacyService.reviewReturn(reviewingReturn.returnId, {
        action,
        reviewNotes
      });
      setSuccessMsg(`Return '${reviewingReturn.returnId}' ${action}D successfully.`);
      setReviewingReturn(null);
      setReviewNotes('');
      fetchReturns();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Action failed.');
    }
  };

  const handleProcessDisposition = async () => {
    if (!dispositionReturn) return;
    try {
      setError(null);
      const itemDispositions = dispositionReturn.items.map((it) => ({
        medicineId: it.medicineId,
        disposition: selectedDisposition
      }));

      await pharmacyService.processReturn(dispositionReturn.returnId, { itemDispositions });
      setSuccessMsg(`Return disposition processed (${selectedDisposition}).`);
      setDispositionReturn(null);
      fetchReturns();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Disposition processing failed.');
    }
  };

  const handleCreateReturn = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const payload = {
        patientId: createData.patientId,
        dispensingRecordId: createData.dispensingRecordId,
        reason: createData.reason,
        reasonDetails: createData.reasonDetails,
        items: [
          {
            medicineId: createData.medicineId,
            quantity: createData.quantity,
            condition: createData.condition
          }
        ]
      };
      const res = await pharmacyService.createReturn(payload);
      setSuccessMsg(`Return '${res.data?.pharmacyReturn?.returnId}' requested successfully.`);
      setIsCreateModalOpen(false);
      fetchReturns();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create return.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">REQUESTED</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">APPROVED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">REJECTED</span>;
      case 'QUARANTINED':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">QUARANTINED (NON-SALEABLE)</span>;
      case 'PROCESSED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">PROCESSED</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-900">Pharmacy Returns & Quarantine Workflow</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Section 36 Compliance: Returned medicines are quarantined by default and cannot be sold without authorized review.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium text-sm rounded-lg hover:bg-purple-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Request New Return
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 font-bold">✕</button>
        </div>
      )}

      {/* Returns Queue Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
            <Layers className="w-4 h-4 text-slate-600" />
            Returns Queue
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All Statuses</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="QUARANTINED">QUARANTINED</option>
            <option value="PROCESSED">PROCESSED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Return ID</th>
                <th className="py-3 px-4">Dispensing ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Refund Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                    Loading returns...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No returns found.
                  </td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret.returnId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{ret.returnId}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">{ret.dispensingRecordId}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{ret.patientName}</div>
                      <div className="text-xs text-slate-400">{ret.patientId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
                        {ret.reason}
                      </span>
                      {ret.reasonDetails && <div className="text-[11px] text-slate-400 mt-0.5">{ret.reasonDetails}</div>}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{Number(ret.totalRefundAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(ret.status)}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {ret.status === 'REQUESTED' && (
                        <button
                          onClick={() => setReviewingReturn(ret)}
                          className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded"
                        >
                          Review & Approve
                        </button>
                      )}

                      {ret.status === 'APPROVED' && (
                        <button
                          onClick={() => setDispositionReturn(ret)}
                          className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded"
                        >
                          Process Disposition
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

      {/* Modal: Review Return (Senior Pharmacist Approval) */}
      {reviewingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-lg">Senior Pharmacist Review</h3>
              </div>
              <button onClick={() => setReviewingReturn(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="text-xs space-y-2">
              <div>Return ID: <span className="font-bold">{reviewingReturn.returnId}</span></div>
              <div>Patient: <span className="font-bold">{reviewingReturn.patientName}</span></div>
              <div>Reason: <span className="font-semibold text-slate-800">{reviewingReturn.reason}</span></div>
              <div>Refund Amount: <span className="font-bold text-emerald-700">₹{reviewingReturn.totalRefundAmount}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pharmacist Review Notes</label>
              <textarea
                rows="3"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Verify packaging seal, expiry, and patient circumstances..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleReview('REJECT')}
                className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg"
              >
                Reject Return
              </button>
              <button
                type="button"
                onClick={() => handleReview('APPROVE')}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
              >
                Approve Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Process Disposition (Section 36 Quarantine) */}
      {dispositionReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-lg">Stock Disposition Decision</h3>
              </div>
              <button onClick={() => setDispositionReturn(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Decide physical inventory disposition for approved return <span className="font-mono font-bold">{dispositionReturn.returnId}</span>:
            </p>

            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="disposition"
                  value="QUARANTINE"
                  checked={selectedDisposition === 'QUARANTINE'}
                  onChange={(e) => setSelectedDisposition(e.target.value)}
                  className="mt-0.5 text-amber-600"
                />
                <div>
                  <div className="font-bold text-slate-900">Quarantine (Non-Saleable)</div>
                  <div className="text-slate-500 text-[11px]">Keep isolated in pharmacy quarantine cage until further audit.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="disposition"
                  value="RETURN_TO_STOCK"
                  checked={selectedDisposition === 'RETURN_TO_STOCK'}
                  onChange={(e) => setSelectedDisposition(e.target.value)}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <div className="font-bold text-slate-900">Return to Saleable Stock</div>
                  <div className="text-slate-500 text-[11px]">Only permissible if medicine is unopened, unexpired, and temperature-verified.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="disposition"
                  value="DISPOSE"
                  checked={selectedDisposition === 'DISPOSE'}
                  onChange={(e) => setSelectedDisposition(e.target.value)}
                  className="mt-0.5 text-rose-600"
                />
                <div>
                  <div className="font-bold text-slate-900">Dispose / Biomedical Waste</div>
                  <div className="text-slate-500 text-[11px]">Send for safe biomedical destruction.</div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDispositionReturn(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessDisposition}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
              >
                Confirm Disposition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request New Return */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-lg">Request Pharmacy Return</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dispensing Record ID *</label>
                <input
                  type="text"
                  required
                  value={createData.dispensingRecordId}
                  onChange={(e) => setCreateData({ ...createData, dispensingRecordId: e.target.value })}
                  placeholder="e.g. DISP-20261016-00001"
                  className="w-full px-3 py-1.5 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient ID *</label>
                <input
                  type="text"
                  required
                  value={createData.patientId}
                  onChange={(e) => setCreateData({ ...createData, patientId: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine ID *</label>
                  <input
                    type="text"
                    required
                    value={createData.medicineId}
                    onChange={(e) => setCreateData({ ...createData, medicineId: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createData.quantity}
                    onChange={(e) => setCreateData({ ...createData, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Reason</label>
                  <select
                    value={createData.reason}
                    onChange={(e) => setCreateData({ ...createData, reason: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PATIENT_RETURN">PATIENT RETURN</option>
                    <option value="WRONG_MEDICINE">WRONG MEDICINE</option>
                    <option value="WRONG_QUANTITY">WRONG QUANTITY</option>
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="CANCELLED_ORDER">CANCELLED ORDER</option>
                    <option value="DISCHARGE_RETURN">DISCHARGE RETURN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
                  <select
                    value={createData.condition}
                    onChange={(e) => setCreateData({ ...createData, condition: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="UNOPENED">UNOPENED</option>
                    <option value="OPENED">OPENED</option>
                    <option value="DAMAGED">DAMAGED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason Details</label>
                <textarea
                  rows="2"
                  value={createData.reasonDetails}
                  onChange={(e) => setCreateData({ ...createData, reasonDetails: e.target.value })}
                  placeholder="Circumstances and explanation..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Submit Return Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyReturnsPage;
