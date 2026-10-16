import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  DollarSign,
  Package,
  FileText,
  RotateCw,
  Plus,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Send,
  Building
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const InvoiceMatchingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [approvingInProgress, setApprovingInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Register Invoice Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [regForm, setRegForm] = useState({
    invoiceNumber: 'INV-APEX-2026-9001',
    poNumber: 'PO-2026-0001',
    grnNumber: 'GRN-2026-0001',
    vendorId: 'VND-MED-001',
    vendorName: 'Apex Healthcare Diagnostics',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 23000,
    taxAmount: 2760,
    shippingAmount: 0,
    totalAmount: 25760,
    items: [
      {
        inventoryItemId: 'INV-LAB-101',
        itemName: 'Specimen Collection Tubes 10ml Pack',
        quantityBilled: 100,
        unitPrice: 230,
        taxPercent: 12,
        lineTotal: 25760
      }
    ]
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ProcurementService.getInvoices();
      if (res.data?.success && res.data?.data) {
        setInvoices(res.data.data);
        if (res.data.data.length > 0 && !selectedInvoice) {
          setSelectedInvoice(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching supplier invoices:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load supplier invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleRunMatch = async () => {
    if (!selectedInvoice) return;
    try {
      setMatchingInProgress(true);
      setError(null);
      const res = await ProcurementService.performMatch(
        selectedInvoice._id || selectedInvoice.supplierInvoiceId
      );
      setSuccessMsg('Three-Way Matching algorithm executed against PO and GRN records.');
      await fetchInvoices();
      if (res.data?.data) {
        setSelectedInvoice(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Matching failed');
    } finally {
      setMatchingInProgress(false);
    }
  };

  const handleApproveMatch = async () => {
    if (!selectedInvoice) return;
    try {
      setApprovingInProgress(true);
      setError(null);
      await ProcurementService.approveInvoiceMatch(
        selectedInvoice._id || selectedInvoice.supplierInvoiceId
      );
      setSuccessMsg('Invoice match approved and formally handed off to Finance Accounts Payable.');
      await fetchInvoices();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Approval handoff failed');
    } finally {
      setApprovingInProgress(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.invoiceNumber.trim() || !regForm.poNumber.trim()) {
      setError('Invoice Number and PO Number are required.');
      return;
    }
    try {
      setRegisterSubmitting(true);
      setError(null);
      const res = await ProcurementService.registerInvoice(regForm);
      setSuccessMsg('Supplier invoice registered. Ready for 3-way reconciliation.');
      setShowRegisterModal(false);
      await fetchInvoices();
      if (res.data?.data) {
        setSelectedInvoice(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invoice registration failed');
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const getMatchBadge = (status) => {
    switch (status) {
      case 'MATCHED':
        return <span className="badge badge-success"><CheckCircle size={13} className="mr-1" /> Reconciled &amp; Matched</span>;
      case 'DISCREPANCY':
        return <span className="badge badge-danger"><AlertTriangle size={13} className="mr-1" /> Discrepancy Found</span>;
      case 'APPROVED_FOR_PAYMENT':
        return <span className="badge badge-info"><CheckCircle size={13} className="mr-1" /> Handed off to Finance</span>;
      default:
        return <span className="badge badge-warning"><Clock size={13} className="mr-1" /> Pending Reconciliation</span>;
    }
  };

  return (
    <div className="page-container p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-main flex items-center gap-2">
            <FileCheck className="text-primary" size={26} /> Three-Way Invoice Matching
          </h1>
          <p className="text-sm text-secondary">
            Cross-validation of Purchase Order (PO), Physical Goods Receipt (GRN), and Supplier Invoice.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowRegisterModal(true)} className="btn btn-primary btn-sm">
            <Plus size={16} className="mr-1.5" /> Register Supplier Invoice
          </button>
        </div>
      </div>

      {/* Segregation of Duties Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="text-primary mt-0.5 shrink-0" size={20} />
        <div className="text-xs text-secondary leading-relaxed">
          <strong>Finance Segregation of Duties:</strong> Procurement validates commercial terms and goods receipt
          through automated three-way matching. Once authorized, the verified invoice is handed off to Hospital Finance
          (Accounts Payable) for scheduled disbursement. Procurement officers cannot release financial payments directly.
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

      {/* Layout Grid: Invoice List & Interactive Matcher */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Invoice List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-main text-sm flex items-center gap-2">
            <FileText size={16} /> Supplier Invoices ({invoices.length})
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-xs text-secondary p-4 text-center">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="text-xs text-secondary p-4 text-center">No invoices registered yet.</div>
            ) : (
              invoices.map((inv) => (
                <button
                  key={inv._id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedInvoice?._id === inv._id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-surface hover:border-border/80'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-main">{inv.invoiceNumber}</span>
                    <span className="text-[10px] font-mono text-secondary">
                      ₹{(inv.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-secondary mt-1">{inv.vendorName}</div>
                  <div className="text-[11px] text-primary font-mono mt-0.5">PO: {inv.poNumber}</div>
                  <div className="mt-1">{getMatchBadge(inv.matchStatus)}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Interactive 3-Way Match Dossier */}
        <div className="lg:col-span-3">
          {selectedInvoice ? (
            <div className="space-y-6">
              {/* Top Dossier Card */}
              <div className="card p-5 bg-surface border border-border rounded-xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-main">{selectedInvoice.invoiceNumber}</h2>
                      {getMatchBadge(selectedInvoice.matchStatus)}
                    </div>
                    <p className="text-xs text-secondary mt-1">
                      Vendor: <strong>{selectedInvoice.vendorName}</strong> • Billed{' '}
                      {new Date(selectedInvoice.invoiceDate).toLocaleDateString()} • Due{' '}
                      {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunMatch}
                      disabled={matchingInProgress}
                      className="btn btn-outline btn-sm flex items-center gap-1.5"
                    >
                      <RotateCw className={matchingInProgress ? 'animate-spin' : ''} size={14} />
                      {matchingInProgress ? 'Reconciling...' : 'Run 3-Way Match'}
                    </button>

                    {selectedInvoice.matchStatus === 'MATCHED' && (
                      <button
                        onClick={handleApproveMatch}
                        disabled={approvingInProgress}
                        className="btn btn-success btn-sm flex items-center gap-1.5"
                      >
                        <Send size={14} />
                        {approvingInProgress ? 'Processing...' : 'Handoff to Finance'}
                      </button>
                    )}
                  </div>
                </div>

                {/* 3-Pillar References */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                  <div className="bg-subtle p-3 rounded-lg text-xs">
                    <div className="text-secondary font-semibold mb-1 flex items-center gap-1">
                      <FileText size={14} /> 1. Purchase Order (PO)
                    </div>
                    <div className="font-mono font-bold text-main">{selectedInvoice.poNumber}</div>
                    <div className="text-secondary mt-0.5">Commercial authorization</div>
                  </div>

                  <div className="bg-subtle p-3 rounded-lg text-xs">
                    <div className="text-secondary font-semibold mb-1 flex items-center gap-1">
                      <Package size={14} /> 2. Goods Receipt (GRN)
                    </div>
                    <div className="font-mono font-bold text-main">{selectedInvoice.grnNumber || 'Auto-linked'}</div>
                    <div className="text-secondary mt-0.5">Physical warehouse check</div>
                  </div>

                  <div className="bg-subtle p-3 rounded-lg text-xs">
                    <div className="text-secondary font-semibold mb-1 flex items-center gap-1">
                      <DollarSign size={14} /> 3. Supplier Invoice
                    </div>
                    <div className="font-mono font-bold text-main">₹{(selectedInvoice.totalAmount || 0).toLocaleString()}</div>
                    <div className="text-secondary mt-0.5">Vendor claim for payment</div>
                  </div>
                </div>
              </div>

              {/* Discrepancies Alert Box if any */}
              {selectedInvoice.discrepancies && selectedInvoice.discrepancies.length > 0 && (
                <div className="card p-4 bg-danger/5 border border-danger/30 rounded-xl space-y-2">
                  <h4 className="font-bold text-danger text-sm flex items-center gap-2">
                    <AlertTriangle size={18} /> Reconciliation Discrepancies Detected ({selectedInvoice.discrepancies.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedInvoice.discrepancies.map((d, i) => (
                      <div key={i} className="text-xs text-danger bg-surface p-2 rounded border border-danger/20 flex justify-between">
                        <span>• {d.description || d.type} ({d.field})</span>
                        <span className="font-mono">
                          Diff: Expected {d.expected} vs Claimed {d.actual}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-secondary mt-2">
                    Payment is automatically blocked until discrepancy is investigated and resolved via procurement exception queue.
                  </div>
                </div>
              )}

              {/* Line Items Reconciled Table */}
              <div className="card bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <h3 className="font-semibold text-main text-sm">
                    Line Item Breakdown (Invoice vs PO vs GRN)
                  </h3>
                  <span className="text-xs text-secondary">Tolerance allowed: ±1% price / 0% qty</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="bg-subtle text-left text-xs uppercase text-secondary">
                        <th className="py-3 px-4">Item Details</th>
                        <th className="py-3 px-4 text-center">Billed Qty</th>
                        <th className="py-3 px-4 text-right">Billed Unit ₹</th>
                        <th className="py-3 px-4 text-right">Billed Total ₹</th>
                        <th className="py-3 px-4 text-center">Reconciliation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {selectedInvoice.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-subtle/50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-main">{item.itemName}</div>
                            <div className="text-xs text-secondary font-mono">{item.inventoryItemId || 'N/A'}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-medium">
                            {item.quantityBilled}
                          </td>
                          <td className="py-3 px-4 text-right text-secondary">
                            ₹{(item.unitPrice || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-main">
                            ₹{(item.lineTotal || (item.quantityBilled * item.unitPrice)).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {selectedInvoice.matchStatus === 'MATCHED' || selectedInvoice.matchStatus === 'APPROVED_FOR_PAYMENT' ? (
                              <span className="text-success text-xs font-semibold flex items-center justify-center gap-1">
                                <CheckCircle size={14} /> Verified
                              </span>
                            ) : selectedInvoice.matchStatus === 'DISCREPANCY' ? (
                              <span className="text-danger text-xs font-semibold flex items-center justify-center gap-1">
                                <AlertTriangle size={14} /> Mismatch
                              </span>
                            ) : (
                              <span className="text-secondary text-xs">Unchecked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center bg-surface border border-border rounded-xl text-secondary">
              <FileCheck className="inline-block mb-3" size={36} />
              <p>Select a supplier invoice from the left or register a new invoice to reconcile.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Register Supplier Invoice */}
      {showRegisterModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card bg-surface max-w-2xl w-full p-6 rounded-2xl shadow-xl border border-border space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-main flex items-center gap-2">
                <FileCheck className="text-primary" size={20} /> Register Inbound Supplier Invoice
              </h3>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="btn btn-sm btn-ghost"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Invoice Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input w-full p-2 text-sm"
                    value={regForm.invoiceNumber}
                    onChange={(e) => setRegForm({ ...regForm, invoiceNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Matched PO Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input w-full p-2 text-sm"
                    value={regForm.poNumber}
                    onChange={(e) => setRegForm({ ...regForm, poNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Vendor Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input w-full p-2 text-sm"
                    value={regForm.vendorName}
                    onChange={(e) => setRegForm({ ...regForm, vendorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Matched GRN Reference (Optional)
                  </label>
                  <input
                    type="text"
                    className="input w-full p-2 text-sm"
                    value={regForm.grnNumber}
                    onChange={(e) => setRegForm({ ...regForm, grnNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Invoice Subtotal ₹ <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    className="input w-full p-2 text-sm"
                    value={regForm.subtotal}
                    onChange={(e) => {
                      const sub = parseFloat(e.target.value) || 0;
                      setRegForm({
                        ...regForm,
                        subtotal: sub,
                        totalAmount: sub + regForm.taxAmount + regForm.shippingAmount
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">Tax Amount ₹</label>
                  <input
                    type="number"
                    className="input w-full p-2 text-sm"
                    value={regForm.taxAmount}
                    onChange={(e) => {
                      const tax = parseFloat(e.target.value) || 0;
                      setRegForm({
                        ...regForm,
                        taxAmount: tax,
                        totalAmount: regForm.subtotal + tax + regForm.shippingAmount
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">Total Amount ₹</label>
                  <input
                    type="number"
                    required
                    className="input w-full p-2 text-sm font-bold text-primary"
                    value={regForm.totalAmount}
                    onChange={(e) => setRegForm({ ...regForm, totalAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="btn btn-outline"
                  disabled={registerSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={registerSubmitting}
                >
                  {registerSubmitting ? 'Registering...' : 'Register Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceMatchingPage;
