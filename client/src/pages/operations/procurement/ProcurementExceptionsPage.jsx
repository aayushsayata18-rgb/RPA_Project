import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  RotateCcw,
  FileText,
  DollarSign,
  Truck,
  CheckSquare,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const ProcurementExceptionsPage = () => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Resolution modal
  const [selectedException, setSelectedException] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionAction, setResolutionAction] = useState('PO_AMENDMENT');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await ProcurementService.getExceptions(params);
      if (res.data?.success && res.data?.data) {
        setExceptions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching procurement exceptions:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load exceptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [search, typeFilter, statusFilter]);

  const handleResolve = async () => {
    if (!selectedException || !resolutionNotes.trim()) {
      setError('A mandatory resolution explanation is required.');
      return;
    }
    try {
      setResolving(true);
      setError(null);
      await ProcurementService.resolveException(
        selectedException._id || selectedException.exceptionId,
        {
          resolution: resolutionAction,
          notes: resolutionNotes.trim()
        }
      );
      setSuccessMsg(`Exception ${selectedException.exceptionId} marked as RESOLVED.`);
      setShowResolveModal(false);
      setSelectedException(null);
      setResolutionNotes('');
      await fetchExceptions();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Resolution failed');
    } finally {
      setResolving(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="badge badge-danger">Critical</span>;
      case 'HIGH':
        return <span className="badge badge-warning">High</span>;
      case 'MEDIUM':
        return <span className="badge badge-info">Medium</span>;
      default:
        return <span className="badge badge-neutral">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="badge badge-success"><CheckCircle size={12} className="mr-1" /> Resolved</span>;
      case 'UNDER_INVESTIGATION':
        return <span className="badge badge-warning"><Clock size={12} className="mr-1" /> Investigating</span>;
      case 'WAIVED':
        return <span className="badge badge-secondary">Waived</span>;
      default:
        return <span className="badge badge-danger"><AlertTriangle size={12} className="mr-1" /> Open</span>;
    }
  };

  return (
    <div className="page-container p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-main flex items-center gap-2">
            <AlertTriangle className="text-danger" size={26} /> Procurement Discrepancy &amp; Exceptions
          </h1>
          <p className="text-sm text-secondary">
            Price mismatches, short deliveries, delivery delays, and audit anomalies requiring intervention.
          </p>
        </div>
        <div>
          <button onClick={fetchExceptions} className="btn btn-outline btn-sm">
            Refresh Queue
          </button>
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

      {/* Filters Bar */}
      <div className="card p-4 bg-surface border border-border rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-secondary" size={16} />
            <input
              type="text"
              placeholder="Search by exception #, PO, or description..."
              className="input pl-9 pr-4 py-2 w-full text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="input py-2 px-3 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="PRICE_MISMATCH">Price Mismatch</option>
            <option value="QUANTITY_MISMATCH">Quantity Mismatch</option>
            <option value="DELIVERY_DELAY">Delivery Delay</option>
            <option value="DUPLICATE_PR">Duplicate PR</option>
            <option value="VENDOR_NON_COMPLIANCE">Vendor Non-Compliance</option>
          </select>

          <select
            className="input py-2 px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Exceptions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-secondary">
            <Clock className="animate-spin inline-block mr-2" size={24} /> Loading exceptions...
          </div>
        ) : exceptions.length === 0 ? (
          <div className="card p-12 text-center bg-surface border border-border rounded-xl text-secondary">
            <CheckCircle className="text-success inline-block mb-3" size={36} />
            <h3 className="text-lg font-bold text-main mb-1">No Active Exceptions</h3>
            <p className="text-sm">All procurement transactions are fully reconciled and aligned with policy.</p>
          </div>
        ) : (
          exceptions.map((ex) => (
            <div
              key={ex._id}
              className={`card p-5 bg-surface border rounded-xl shadow-sm transition-all ${
                ex.status === 'OPEN'
                  ? 'border-danger/40 hover:border-danger'
                  : 'border-border'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-[300px]">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-main text-base font-mono">{ex.exceptionId}</span>
                    {getSeverityBadge(ex.severity)}
                    {getStatusBadge(ex.status)}
                    <span className="badge badge-neutral text-xs">
                      {ex.exceptionType?.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-main font-medium">{ex.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-secondary">
                    {ex.poNumber && <span>PO: <strong>{ex.poNumber}</strong></span>}
                    {ex.invoiceNumber && <span>Invoice: <strong>{ex.invoiceNumber}</strong></span>}
                    {ex.deliveryId && <span>Delivery: <strong>{ex.deliveryId}</strong></span>}
                    {ex.vendorName && <span>Vendor: <strong>{ex.vendorName}</strong></span>}
                    <span>Flagged: {new Date(ex.createdAt).toLocaleDateString()}</span>
                  </div>

                  {ex.resolutionNotes && (
                    <div className="bg-success/10 border border-success/30 rounded p-2 text-xs text-success mt-2">
                      <strong>Resolution ({ex.resolutionAction || 'RESOLVED'}): </strong>
                      {ex.resolutionNotes}
                    </div>
                  )}
                </div>

                <div>
                  {ex.status === 'OPEN' || ex.status === 'UNDER_INVESTIGATION' ? (
                    <button
                      onClick={() => {
                        setSelectedException(ex);
                        setShowResolveModal(true);
                      }}
                      className="btn btn-sm btn-primary"
                    >
                      Resolve Exception
                    </button>
                  ) : (
                    <span className="text-xs text-secondary font-medium flex items-center gap-1">
                      <CheckCircle size={14} className="text-success" /> Closed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Resolve Exception */}
      {showResolveModal && selectedException && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <CheckCircle className="text-success" size={20} /> Resolve Procurement Exception
            </h3>
            <p className="text-xs text-secondary">
              Exception: <strong>{selectedException.exceptionId}</strong> ({selectedException.exceptionType})
            </p>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">
                Resolution Action Method
              </label>
              <select
                className="input w-full p-2 text-sm"
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value)}
              >
                <option value="PO_AMENDMENT">Issue PO Revision / Amendment</option>
                <option value="SUPPLIER_CREDIT_NOTE">Request Supplier Credit Note</option>
                <option value="PRICE_CORRECTION">Accept Price Correction within Budget</option>
                <option value="GOODS_RETURNED">Goods Returned to Supplier</option>
                <option value="WAIVER_APPROVED">Formal Management Waiver Approved</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">
                Audit Resolution Justification <span className="text-danger">*</span>
              </label>
              <textarea
                rows={3}
                required
                className="input w-full p-2 text-sm"
                placeholder="State verified vendor communication, credit note number, or amendment approval details..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedException(null);
                }}
                className="btn btn-outline"
                disabled={resolving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolve}
                className="btn btn-success"
                disabled={resolving || !resolutionNotes.trim()}
              >
                {resolving ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementExceptionsPage;
