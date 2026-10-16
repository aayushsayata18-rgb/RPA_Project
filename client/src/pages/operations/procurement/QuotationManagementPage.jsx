import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
  Building,
  Truck,
  X,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const QuotationManagementPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialRfqFilter = searchParams.get('rfqId') || '';

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rfqFilter, setRfqFilter] = useState(initialRfqFilter);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Intake Modal
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);
  const [rfqs, setRfqs] = useState([]);
  const [formData, setFormData] = useState({
    rfqId: initialRfqFilter || 'RFQ-2026-0001',
    vendorId: 'VND-MED-001',
    vendorName: 'Apex Healthcare Diagnostics',
    quoteReference: 'QUO-APEX-8901',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    leadTimeDays: 7,
    paymentTerms: 'Net 30 Days',
    warrantyTerms: '1 Year Manufacturer Standard Warranty',
    items: [
      {
        itemName: 'Specimen Collection Tubes 10ml Pack',
        specification: 'Borosilicate Glass ISO 13485',
        quantity: 100,
        unit: 'PACK',
        unitPrice: 230,
        taxPercent: 12,
        discountPercent: 0
      }
    ]
  });

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (rfqFilter) params.rfqId = rfqFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await ProcurementService.getQuotations(params);
      if (res.data?.success && res.data?.data) {
        setQuotations(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load quotations');
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
      console.warn('Could not load RFQs for quotation intake:', err);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [search, rfqFilter, statusFilter]);

  const handleOpenIntake = () => {
    loadRfqs();
    setShowIntakeModal(true);
  };

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quoteReference.trim()) {
      setError('Vendor quotation reference number is required.');
      return;
    }
    try {
      setIntakeSubmitting(true);
      setError(null);
      await ProcurementService.recordQuotation(formData);
      setSuccessMsg('Vendor quotation recorded successfully.');
      setShowIntakeModal(false);
      await fetchQuotations();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record quotation');
    } finally {
      setIntakeSubmitting(false);
    }
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          itemName: '',
          specification: '',
          quantity: 1,
          unit: 'UNIT',
          unitPrice: 0,
          taxPercent: 12,
          discountPercent: 0
        }
      ]
    });
  };

  const updateItemRow = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const removeItemRow = (index) => {
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updated });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="badge badge-success"><CheckCircle size={12} className="mr-1" /> Accepted</span>;
      case 'REJECTED':
        return <span className="badge badge-danger"><XCircle size={12} className="mr-1" /> Rejected</span>;
      case 'EVALUATED':
        return <span className="badge badge-info"><FileCheck size={12} className="mr-1" /> Evaluated</span>;
      case 'SUBMITTED':
        return <span className="badge badge-primary">Active Bid</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="page-container p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-main flex items-center gap-2">
            <FileSpreadsheet className="text-primary" size={26} /> Vendor Quotation Registry
          </h1>
          <p className="text-sm text-secondary">
            Multi-vendor bid intake, price breakdown, lead times, and validity terms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/operations/procurement/comparisons" className="btn btn-outline btn-sm">
            <FileCheck size={16} className="mr-1.5" /> Objective Comparison Matrix
          </Link>
          <button onClick={handleOpenIntake} className="btn btn-primary btn-sm">
            <Plus size={16} className="mr-1.5" /> Record Vendor Quotation
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
              placeholder="Search by quote #, vendor name, or ref..."
              className="input pl-9 pr-4 py-2 w-full text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {rfqFilter && (
            <button
              onClick={() => setRfqFilter('')}
              className="btn btn-xs btn-outline text-secondary flex items-center gap-1"
            >
              Clear RFQ Filter: {rfqFilter} <X size={12} />
            </button>
          )}

          <select
            className="input py-2 px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Active Bid</option>
            <option value="EVALUATED">Evaluated</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="card bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase text-secondary">
                <th className="py-3 px-4">Quotation ID &amp; Ref</th>
                <th className="py-3 px-4">Linked RFQ</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4 text-center">Lead Time</th>
                <th className="py-3 px-4 text-right">Total Bid (₹)</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-secondary">
                    <Clock className="animate-spin inline-block mr-2" size={20} /> Loading quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-secondary">
                    No vendor quotations recorded yet.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q._id} className="hover:bg-subtle/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-main">{q.quotationId}</div>
                      <div className="text-xs text-secondary font-mono">{q.quoteReference}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-primary text-xs">
                        {q.rfqId || 'DIRECT'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-main">{q.vendorName}</div>
                      <div className="text-xs text-secondary">{q.vendorId}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-secondary font-medium">
                        <Truck size={13} /> {q.leadTimeDays || '—'} days
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-main">
                      ₹{(q.totalAmount || 0).toLocaleString()}
                      {q.taxAmount > 0 && (
                        <div className="text-[11px] text-secondary font-normal">
                          incl. ₹{q.taxAmount.toLocaleString()} tax
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {new Date(q.validUntil).toLocaleDateString()}
                      </div>
                      {new Date(q.validUntil) < new Date() && (
                        <span className="text-[11px] text-danger font-semibold">Expired</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(q.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Quotation Intake */}
      {showIntakeModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card bg-surface max-w-2xl w-full p-6 rounded-2xl shadow-xl border border-border space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-main flex items-center gap-2">
                <FileSpreadsheet className="text-primary" size={20} /> Record Vendor Quotation Intake
              </h3>
              <button
                type="button"
                onClick={() => setShowIntakeModal(false)}
                className="btn btn-sm btn-ghost"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Linked RFQ <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input w-full p-2 text-sm"
                    placeholder="e.g., RFQ-2026-0001"
                    value={formData.rfqId}
                    onChange={(e) => setFormData({ ...formData, rfqId: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Vendor Quote Reference # <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input w-full p-2 text-sm"
                    placeholder="e.g., QUO-APEX-2026-104"
                    value={formData.quoteReference}
                    onChange={(e) => setFormData({ ...formData, quoteReference: e.target.value })}
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
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Vendor ID / Code
                  </label>
                  <input
                    type="text"
                    className="input w-full p-2 text-sm"
                    value={formData.vendorId}
                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Validity Deadline <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="input w-full p-2 text-sm"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Lead Time (Days) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input w-full p-2 text-sm"
                    value={formData.leadTimeDays}
                    onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">Payment Terms</label>
                  <input
                    type="text"
                    className="input w-full p-2 text-sm"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-secondary">
                    Quotation Line Items &amp; Pricing
                  </label>
                  <button type="button" onClick={addItemRow} className="btn btn-xs btn-outline">
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formData.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 bg-subtle p-2 rounded-lg items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Item Name"
                          className="input p-1.5 text-xs w-full"
                          value={item.itemName}
                          onChange={(e) => updateItemRow(i, 'itemName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          className="input p-1.5 text-xs w-full text-center"
                          value={item.quantity}
                          onChange={(e) => updateItemRow(i, 'quantity', parseFloat(e.target.value) || 1)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Unit ₹"
                          className="input p-1.5 text-xs w-full text-right"
                          value={item.unitPrice}
                          onChange={(e) => updateItemRow(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Tax %"
                          className="input p-1.5 text-xs w-full text-right"
                          value={item.taxPercent}
                          onChange={(e) => updateItemRow(i, 'taxPercent', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(i)}
                            className="btn btn-xs btn-ghost text-danger p-0"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="btn btn-outline"
                  disabled={intakeSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={intakeSubmitting}
                >
                  {intakeSubmitting ? 'Recording...' : 'Record Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationManagementPage;
