import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Building,
  Users,
  Calendar,
  X,
  FileSpreadsheet,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const RfqsPage = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [availablePRs, setAvailablePRs] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    category: 'LABORATORY_SUPPLY',
    submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    termsAndConditions: 'Standard 30-day payment term upon verified GRN and three-way invoice matching.',
    purchaseRequestIds: [],
    invitedVendors: [
      { vendorId: 'VND-MED-001', vendorName: 'Apex Healthcare Diagnostics', contactEmail: 'bids@apexmed.com' },
      { vendorId: 'VND-MED-002', vendorName: 'BioShield Pharma Solutions', contactEmail: 'tenders@bioshield.com' }
    ],
    items: [
      {
        itemName: 'Specimen Collection Tubes 10ml Pack',
        specification: 'Borosilicate Glass ISO 13485',
        quantity: 100,
        unit: 'PACK'
      }
    ]
  });

  const fetchRfqs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await ProcurementService.getRfqs(params);
      if (res.data?.success && res.data?.data) {
        setRfqs(res.data.data);
        setTotal(res.data.total || res.data.data.length);
      }
    } catch (err) {
      console.error('Error fetching RFQs:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load RFQs');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedPRs = async () => {
    try {
      const res = await ProcurementService.getRequests({ status: 'APPROVED', limit: 30 });
      if (res.data?.success && res.data?.data) {
        setAvailablePRs(res.data.data);
      }
    } catch (err) {
      console.warn('Could not load approved PRs for RFQ builder:', err);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, [search, statusFilter]);

  const handleOpenCreateModal = () => {
    loadApprovedPRs();
    setShowCreateModal(true);
  };

  const handleIssueRfq = async (rfqId) => {
    try {
      setError(null);
      await ProcurementService.issueRfq(rfqId);
      setSuccessMsg(`RFQ ${rfqId} has been formally issued to vendors.`);
      await fetchRfqs();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to issue RFQ');
    }
  };

  const handleCloseRfq = async (rfqId) => {
    try {
      setError(null);
      await ProcurementService.closeRfq(rfqId);
      setSuccessMsg(`RFQ ${rfqId} has been closed for bidding.`);
      await fetchRfqs();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to close RFQ');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a descriptive title for this RFQ.');
      return;
    }
    if (formData.invitedVendors.length < 2) {
      setError('Multi-vendor RFQ requires at least 2 invited vendors for competitive bidding.');
      return;
    }
    try {
      setCreateSubmitting(true);
      setError(null);
      await ProcurementService.createRfq(formData);
      setSuccessMsg('Request for Quotation created successfully.');
      setShowCreateModal(false);
      await fetchRfqs();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create RFQ');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const addVendor = () => {
    setFormData({
      ...formData,
      invitedVendors: [
        ...formData.invitedVendors,
        { vendorId: `VND-MED-00${formData.invitedVendors.length + 1}`, vendorName: '', contactEmail: '' }
      ]
    });
  };

  const updateVendor = (index, field, value) => {
    const updated = [...formData.invitedVendors];
    updated[index][field] = value;
    setFormData({ ...formData, invitedVendors: updated });
  };

  const removeVendor = (index) => {
    const updated = formData.invitedVendors.filter((_, i) => i !== index);
    setFormData({ ...formData, invitedVendors: updated });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ISSUED':
        return <span className="badge badge-primary"><Send size={12} className="mr-1" /> Issued</span>;
      case 'CLOSED':
        return <span className="badge badge-neutral"><Clock size={12} className="mr-1" /> Closed</span>;
      case 'DRAFT':
        return <span className="badge badge-warning">Draft</span>;
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
            <Layers className="text-primary" size={26} /> Requests for Quotation (RFQs)
          </h1>
          <p className="text-sm text-secondary">
            Competitive multi-vendor sourcing packages, bidding deadlines, and quote solicitation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/operations/procurement/comparisons" className="btn btn-outline btn-sm">
            <FileSpreadsheet size={16} className="mr-1.5" /> Quotation Comparisons
          </Link>
          <button onClick={handleOpenCreateModal} className="btn btn-primary btn-sm">
            <Plus size={16} className="mr-1.5" /> Create RFQ Package
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
              placeholder="Search by RFQ #, title, or category..."
              className="input pl-9 pr-4 py-2 w-full text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="input py-2 px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued / Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* RFQ Directory Table */}
      <div className="card bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase text-secondary">
                <th className="py-3 px-4">RFQ Number &amp; Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Invited Vendors</th>
                <th className="py-3 px-4 text-center">Quotes In</th>
                <th className="py-3 px-4">Bidding Deadline</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-secondary">
                    <Clock className="animate-spin inline-block mr-2" size={20} /> Loading RFQs...
                  </td>
                </tr>
              ) : rfqs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-secondary">
                    No RFQs found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                rfqs.map((rfq) => (
                  <tr key={rfq._id} className="hover:bg-subtle/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-main">{rfq.rfqId}</div>
                      <div className="text-xs text-secondary">{rfq.title}</div>
                      {rfq.purchaseRequestIds?.length > 0 && (
                        <div className="text-[11px] text-primary mt-0.5">
                          Linked PRs: {rfq.purchaseRequestIds.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-secondary font-medium">
                      {rfq.category?.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="badge badge-neutral text-xs">
                        <Users size={12} className="mr-1" /> {rfq.invitedVendors?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-main">
                        {rfq.quotationsReceivedCount || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {new Date(rfq.submissionDeadline).toLocaleDateString()}
                      </div>
                      {new Date(rfq.submissionDeadline) < new Date() && rfq.status === 'ISSUED' && (
                        <span className="text-[11px] text-danger font-semibold">Deadline Passed</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(rfq.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rfq.status === 'DRAFT' && (
                          <button
                            onClick={() => handleIssueRfq(rfq._id || rfq.rfqId)}
                            className="btn btn-xs btn-primary"
                            title="Issue RFQ to Invited Vendors"
                          >
                            <Send size={12} className="mr-1" /> Issue
                          </button>
                        )}
                        {rfq.status === 'ISSUED' && (
                          <button
                            onClick={() => handleCloseRfq(rfq._id || rfq.rfqId)}
                            className="btn btn-xs btn-outline"
                            title="Close Bidding"
                          >
                            Close
                          </button>
                        )}
                        <Link
                          to={`/operations/procurement/quotations?rfqId=${rfq.rfqId}`}
                          className="btn btn-xs btn-ghost text-primary"
                          title="View Vendor Quotations"
                        >
                          Quotes
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create RFQ */}
      {showCreateModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card bg-surface max-w-2xl w-full p-6 rounded-2xl shadow-xl border border-border space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-main flex items-center gap-2">
                <Layers className="text-primary" size={20} /> Create Competitive RFQ Package
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-sm btn-ghost"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">
                  RFQ Title / Scope <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input w-full p-2 text-sm"
                  placeholder="e.g., Sourcing Specimen Collection Tubes & Culture Media for Central Lab"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">Category</label>
                  <select
                    className="input w-full p-2 text-sm"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="LABORATORY_SUPPLY">Laboratory Supply</option>
                    <option value="SURGICAL_CONSUMABLE">Surgical Consumable</option>
                    <option value="PHARMACEUTICAL">Pharmaceutical</option>
                    <option value="BIOMEDICAL_EQUIPMENT">Biomedical Equipment</option>
                    <option value="GENERAL_HOSPITAL_STORE">General Hospital Store</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Bidding Deadline <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="input w-full p-2 text-sm"
                    value={formData.submissionDeadline}
                    onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                  />
                </div>
              </div>

              {/* Invited Vendors (Minimum 2 for competitive multi-vendor RFQ) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-secondary">
                    Invited Vendors (Min. 2 Required for Competitive Sourcing)
                  </label>
                  <button
                    type="button"
                    onClick={addVendor}
                    className="btn btn-xs btn-outline"
                  >
                    + Add Vendor
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formData.invitedVendors.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 bg-subtle p-2 rounded-lg">
                      <input
                        type="text"
                        placeholder="Vendor Name"
                        className="input p-1.5 text-xs flex-1"
                        value={v.vendorName}
                        onChange={(e) => updateVendor(i, 'vendorName', e.target.value)}
                        required
                      />
                      <input
                        type="email"
                        placeholder="Contact Email"
                        className="input p-1.5 text-xs flex-1"
                        value={v.contactEmail}
                        onChange={(e) => updateVendor(i, 'contactEmail', e.target.value)}
                        required
                      />
                      {formData.invitedVendors.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeVendor(i)}
                          className="btn btn-xs btn-ghost text-danger"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">
                  Standard Commercial Terms &amp; Conditions
                </label>
                <textarea
                  rows={2}
                  className="input w-full p-2 text-xs"
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                  disabled={createSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? 'Creating RFQ...' : 'Create RFQ Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RfqsPage;
