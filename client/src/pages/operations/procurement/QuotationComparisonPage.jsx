import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Award,
  AlertTriangle,
  Clock,
  DollarSign,
  Truck,
  ShieldCheck,
  ChevronRight,
  Eye,
  Plus,
  X,
  FileCheck
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const QuotationComparisonPage = () => {
  const [comparisons, setComparisons] = useState([]);
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Selection Modal
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedVendorOption, setSelectedVendorOption] = useState(null);
  const [selectionReason, setSelectionReason] = useState('');
  const [submittingSelection, setSubmittingSelection] = useState(false);

  // New Comparison Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rfqs, setRfqs] = useState([]);
  const [createRfqId, setCreateRfqId] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchComparisons = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ProcurementService.getComparisons();
      if (res.data?.success && res.data?.data) {
        setComparisons(res.data.data);
        if (res.data.data.length > 0 && !selectedComparison) {
          setSelectedComparison(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching comparisons:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load quotation comparisons');
    } finally {
      setLoading(false);
    }
  };

  const loadRfqs = async () => {
    try {
      const res = await ProcurementService.getRfqs({ limit: 50 });
      if (res.data?.success && res.data?.data) {
        setRfqs(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load RFQs:', err);
    }
  };

  useEffect(() => {
    fetchComparisons();
  }, []);

  const handleSelectVendor = async () => {
    if (!selectionReason.trim()) {
      setError('A mandatory human justification is required when awarding a vendor.');
      return;
    }
    try {
      setSubmittingSelection(true);
      setError(null);
      await ProcurementService.selectVendor(
        selectedComparison._id || selectedComparison.comparisonId,
        {
          selectedVendorId: selectedVendorOption.vendorId,
          selectedVendorName: selectedVendorOption.vendorName,
          selectedQuotationId: selectedVendorOption.quotationId,
          selectionReason: selectionReason.trim()
        }
      );
      setSuccessMsg(`Vendor ${selectedVendorOption.vendorName} awarded successfully.`);
      setShowSelectModal(false);
      setSelectedVendorOption(null);
      setSelectionReason('');
      await fetchComparisons();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Vendor selection failed');
    } finally {
      setSubmittingSelection(false);
    }
  };

  const handleCreateComparison = async (e) => {
    e.preventDefault();
    if (!createRfqId.trim()) {
      setError('Please select or specify an RFQ ID.');
      return;
    }
    try {
      setCreating(true);
      setError(null);
      const res = await ProcurementService.createComparison({ rfqId: createRfqId.trim() });
      setSuccessMsg('Comparison matrix compiled successfully.');
      setShowCreateModal(false);
      setCreateRfqId('');
      await fetchComparisons();
      if (res.data?.data) {
        setSelectedComparison(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to compile comparison matrix');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-container p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-main flex items-center gap-2">
            <FileSpreadsheet className="text-primary" size={26} /> Quotation Comparison Matrix
          </h1>
          <p className="text-sm text-secondary">
            Objective side-by-side evaluation (Price, Lead Time, Quality Compliance) with mandatory human selection reason.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/operations/procurement/purchase-orders" className="btn btn-outline btn-sm">
            Purchase Orders Directory
          </Link>
          <button
            onClick={() => {
              loadRfqs();
              setShowCreateModal(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} className="mr-1.5" /> Compile New Comparison
          </button>
        </div>
      </div>

      {/* Zero Autonomous Selection Policy Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="text-primary mt-0.5 shrink-0" size={20} />
        <div className="text-xs text-secondary leading-relaxed">
          <strong>Zero Autonomous Vendor Awarding Policy:</strong> While the system calculates objective scores
          for pricing, delivery schedule, and compliance, final vendor selection requires human authorization with a
          documented justification reason (preventing kickbacks and ensuring hospital audit compliance).
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="btn btn-xs btn-ghost">Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="btn btn-xs btn-ghost">Dismiss</button>
        </div>
      )}

      {/* Main Grid: Comparison Selector & Matrix View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Comparison List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-main text-sm flex items-center gap-2">
            <FileCheck size={16} /> Comparison Sets ({comparisons.length})
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-xs text-secondary p-4 text-center">Loading comparisons...</div>
            ) : comparisons.length === 0 ? (
              <div className="text-xs text-secondary p-4 text-center">No comparisons compiled yet.</div>
            ) : (
              comparisons.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedComparison(c)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedComparison?._id === c._id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-surface hover:border-border/80'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-main">{c.comparisonId}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        c.status === 'COMPLETED'
                          ? 'bg-success/15 text-success'
                          : 'bg-warning/15 text-warning'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-xs text-secondary mt-1 font-mono">RFQ: {c.rfqId}</div>
                  <div className="text-[11px] text-secondary mt-1">
                    {c.vendors?.length || 0} vendors evaluated
                  </div>
                  {c.selectedVendorName && (
                    <div className="text-[11px] text-success font-semibold mt-1 flex items-center gap-1">
                      <Award size={12} /> Awarded: {c.selectedVendorName}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Selected Comparison Details & Matrix */}
        <div className="lg:col-span-3">
          {selectedComparison ? (
            <div className="space-y-6">
              {/* Top Summary Dossier */}
              <div className="card p-5 bg-surface border border-border rounded-xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-main">{selectedComparison.comparisonId}</h2>
                      <span className="badge badge-primary">{selectedComparison.status}</span>
                    </div>
                    <p className="text-xs text-secondary mt-1">
                      Linked RFQ: <strong>{selectedComparison.rfqId}</strong> • Compiled{' '}
                      {new Date(selectedComparison.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {selectedComparison.selectedVendorName ? (
                    <div className="bg-success/10 border border-success/30 rounded-xl p-3 text-right">
                      <div className="text-xs text-success font-bold flex items-center justify-end gap-1">
                        <Award size={16} /> Selected &amp; Awarded Vendor
                      </div>
                      <div className="font-bold text-main text-base">{selectedComparison.selectedVendorName}</div>
                      <div className="text-xs text-secondary mt-0.5 max-w-sm">
                        Justification: "{selectedComparison.selectionReason}"
                      </div>
                    </div>
                  ) : (
                    <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-xs text-warning font-medium">
                      Awaiting Human Selection &amp; Justification
                    </div>
                  )}
                </div>
              </div>

              {/* Matrix Table */}
              <div className="card bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <h3 className="font-semibold text-main text-sm">
                    Objective Side-by-Side Scoring Matrix
                  </h3>
                  <span className="text-xs text-secondary">
                    Formula: Price (50%) + Lead Time (30%) + Compliance (20%)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="bg-subtle text-left text-xs uppercase text-secondary">
                        <th className="py-3 px-4">Vendor &amp; Quote Ref</th>
                        <th className="py-3 px-4 text-right">Total Price</th>
                        <th className="py-3 px-4 text-center">Delivery Time</th>
                        <th className="py-3 px-4 text-center">Price Score</th>
                        <th className="py-3 px-4 text-center">Delivery Score</th>
                        <th className="py-3 px-4 text-center">Total Score</th>
                        <th className="py-3 px-4 text-right">Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {selectedComparison.vendors?.map((v, idx) => {
                        const isSelected = selectedComparison.selectedVendorId === v.vendorId;
                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-subtle/50 ${isSelected ? 'bg-success/5 font-medium' : ''}`}
                          >
                            <td className="py-3 px-4">
                              <div className="font-bold text-main flex items-center gap-2">
                                {v.vendorName}
                                {isSelected && (
                                  <span className="badge badge-success text-[10px]">Awarded</span>
                                )}
                              </div>
                              <div className="text-xs text-secondary font-mono">
                                {v.quotationId || v.quoteReference || v.vendorId}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-main">
                              ₹{(v.totalPrice || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-secondary">
                              <span className="inline-flex items-center gap-1 font-semibold text-main">
                                <Truck size={13} /> {v.deliveryDays || v.leadTimeDays || '—'} days
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-xs">
                              {v.priceScore || 0} / 50
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-xs">
                              {v.deliveryScore || 0} / 30
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="badge badge-primary font-bold">
                                {v.overallScore || v.totalScore || 0} pts
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {selectedComparison.status !== 'COMPLETED' ? (
                                <button
                                  onClick={() => {
                                    setSelectedVendorOption(v);
                                    setShowSelectModal(true);
                                  }}
                                  className="btn btn-xs btn-primary"
                                >
                                  Award Contract
                                </button>
                              ) : isSelected ? (
                                <span className="text-success text-xs font-bold flex items-center justify-end gap-1">
                                  <CheckCircle size={14} /> Awarded
                                </span>
                              ) : (
                                <span className="text-secondary text-xs">Not Selected</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center bg-surface border border-border rounded-xl text-secondary">
              <FileSpreadsheet className="inline-block mb-3" size={36} />
              <p>Select a quotation comparison from the left or compile a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Award Vendor (Mandatory Human Justification) */}
      {showSelectModal && selectedVendorOption && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <Award className="text-primary" size={20} /> Award Vendor Contract
            </h3>
            <p className="text-sm text-secondary">
              Awarding: <strong>{selectedVendorOption.vendorName}</strong> for ₹
              {(selectedVendorOption.totalPrice || 0).toLocaleString()} (Delivery:{' '}
              {selectedVendorOption.deliveryDays || selectedVendorOption.leadTimeDays} days).
            </p>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">
                Mandatory Selection Justification <span className="text-danger">*</span>
              </label>
              <textarea
                rows={3}
                required
                className="input w-full p-2 text-sm border-primary"
                placeholder="State clinical, quality, or financial rationale (e.g., Best combined score, fastest cold-chain lead time, proven ISO compliance)..."
                value={selectionReason}
                onChange={(e) => setSelectionReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSelectModal(false);
                  setSelectedVendorOption(null);
                }}
                className="btn btn-outline"
                disabled={submittingSelection}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSelectVendor}
                className="btn btn-primary"
                disabled={submittingSelection || !selectionReason.trim()}
              >
                {submittingSelection ? 'Awarding...' : 'Authorize Vendor Award'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Compile New Comparison */}
      {showCreateModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <Plus className="text-primary" size={20} /> Compile Quotation Comparison
            </h3>
            <p className="text-xs text-secondary">
              Select an RFQ with recorded vendor quotations to generate the objective evaluation matrix.
            </p>
            <form onSubmit={handleCreateComparison} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">
                  Select RFQ <span className="text-danger">*</span>
                </label>
                <select
                  required
                  className="input w-full p-2 text-sm"
                  value={createRfqId}
                  onChange={(e) => setCreateRfqId(e.target.value)}
                >
                  <option value="">-- Choose RFQ --</option>
                  {rfqs.map((r) => (
                    <option key={r._id} value={r.rfqId}>
                      {r.rfqId} — {r.title} ({r.quotationsReceivedCount || 0} quotes)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating || !createRfqId}
                >
                  {creating ? 'Compiling...' : 'Generate Matrix'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationComparisonPage;
