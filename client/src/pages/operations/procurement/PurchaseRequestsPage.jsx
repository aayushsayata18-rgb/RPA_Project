import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Eye,
  Send,
  X,
  Trash2
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const PurchaseRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    departmentId: 'DEP-LAB',
    departmentName: 'Central Pathology Laboratory',
    category: 'LABORATORY_SUPPLY',
    priority: 'NORMAL',
    requiredByDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: '',
    justification: '',
    items: [
      {
        inventoryItemId: 'INV-LAB-101',
        itemNameSnapshot: 'Test Tubes 10ml Pack',
        description: 'Sterile specimen collection tubes',
        quantity: 100,
        unit: 'PACK',
        estimatedUnitPrice: 250,
        preferredSpecification: 'Borosilicate Glass ISO 13485'
      }
    ]
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await ProcurementService.getRequests(params);
      setRequests(res.requests || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Error fetching purchase requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search, statusFilter, priorityFilter]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          inventoryItemId: `INV-${formData.category.substring(0, 3)}-${Date.now().toString().slice(-3)}`,
          itemNameSnapshot: '',
          description: '',
          quantity: 10,
          unit: 'PACK',
          estimatedUnitPrice: 100,
          preferredSpecification: ''
        }
      ]
    });
  };

  const handleRemoveItem = (idx) => {
    if (formData.items.length <= 1) return;
    const newItems = formData.items.filter((_, i) => i !== idx);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (idx, field, val) => {
    const newItems = [...formData.items];
    newItems[idx][field] = val;
    setFormData({ ...formData, items: newItems });
  };

  const calculateFormTotal = () => {
    return formData.items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.estimatedUnitPrice) || 0), 0);
  };

  const handleCreateSubmit = async (isDraft = false) => {
    try {
      setSubmitting(true);
      setFormError(null);
      if (!formData.reason.trim()) {
        throw new Error('Requirement reason is required');
      }

      await ProcurementService.createRequest({
        ...formData,
        isDraft
      });

      setShowCreateModal(false);
      fetchRequests();
    } catch (err) {
      setFormError(err.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'Approved' },
      PENDING_APPROVAL: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'Pending Approval' },
      SUBMITTED: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', label: 'Submitted' },
      DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', label: 'Draft' },
      REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'Rejected' },
      RETURNED_FOR_CORRECTION: { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', label: 'Needs Correction' },
      PO_CREATED: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', label: 'PO Created' },
      ORDERED: { bg: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', label: 'Ordered' },
      FULFILLED: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'Fulfilled' },
      CANCELLED: { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748b', label: 'Cancelled' }
    };
    const s = styles[status] || { bg: 'rgba(255,255,255,0.1)', color: '#fff', label: status };
    return (
      <span style={{ padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', background: s.bg, color: s.color, fontSize: '0.75rem', fontWeight: 600 }}>
        {s.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      URGENT: '#ef4444',
      HIGH: '#f59e0b',
      NORMAL: '#38bdf8',
      LOW: '#94a3b8'
    };
    return (
      <span style={{ color: colors[priority] || '#94a3b8', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[priority] || '#94a3b8' }} />
        {priority}
      </span>
    );
  };

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={26} color="#38bdf8" />
            Purchase Requests
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Department requisitions, demand validation, and managerial authorizations.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            background: '#0284c7',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
          }}
        >
          <Plus size={18} />
          Create Purchase Request
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by ID, department, item name, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.25rem',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="PO_CREATED">PO Created</option>
            <option value="REJECTED">Rejected</option>
            <option value="RETURNED_FOR_CORRECTION">Needs Correction</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Request ID</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Department</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Items & Est. Cost</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Priority</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading purchase requests...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No purchase requests found matching the current filters.
                </td>
              </tr>
            ) : (
              requests.map((pr) => (
                <tr key={pr.purchaseRequestId} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#38bdf8' }}>
                    <Link to={`/operations/procurement/requests/${pr.purchaseRequestId}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>
                      {pr.purchaseRequestId}
                    </Link>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                    <div style={{ fontWeight: 500 }}>{pr.departmentName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By: {pr.requesterName}</div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {pr.category.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{pr.estimatedTotal?.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pr.items?.length || 0} line item(s)</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {getPriorityBadge(pr.priority)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {getStatusBadge(pr.status)}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(pr.requestDate || pr.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <Link
                      to={`/operations/procurement/requests/${pr.purchaseRequestId}`}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Eye size={14} />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                New Hospital Purchase Request
              </h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Department</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => {
                    const depts = {
                      'DEP-LAB': 'Central Pathology Laboratory',
                      'DEP-SURGERY': 'Operation Theatre & Surgery',
                      'DEP-EMERGENCY': 'Emergency & Trauma Desk',
                      'DEP-ICU': 'Intensive Care Unit (ICU)',
                      'DEP-PHARMACY': 'Central Hospital Pharmacy',
                      'DEP-RADIOLOGY': 'Radiology & Imaging',
                      'DEP-GENERAL': 'General Inpatient Wards'
                    };
                    setFormData({ ...formData, departmentId: e.target.value, departmentName: depts[e.target.value] || e.target.value });
                  }}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                >
                  <option value="DEP-LAB">Central Pathology Laboratory</option>
                  <option value="DEP-SURGERY">Operation Theatre & Surgery</option>
                  <option value="DEP-EMERGENCY">Emergency & Trauma Desk</option>
                  <option value="DEP-ICU">Intensive Care Unit (ICU)</option>
                  <option value="DEP-PHARMACY">Central Hospital Pharmacy</option>
                  <option value="DEP-RADIOLOGY">Radiology & Imaging</option>
                  <option value="DEP-GENERAL">General Inpatient Wards</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                >
                  <option value="LABORATORY_SUPPLY">Laboratory Supply</option>
                  <option value="SURGICAL_SUPPLY">Surgical Supply</option>
                  <option value="MEDICINE">Medicine / Pharmaceutical</option>
                  <option value="MEDICAL_CONSUMABLE">Medical Consumable</option>
                  <option value="PPE">PPE / Protective Equipment</option>
                  <option value="EQUIPMENT">Biomedical Equipment</option>
                  <option value="GENERAL_SUPPLIES">General Hospital Supplies</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent (Clinical Escalation)</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Required By Date</label>
                <input
                  type="date"
                  value={formData.requiredByDate}
                  onChange={(e) => setFormData({ ...formData, requiredByDate: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Requirement Reason</label>
              <input
                type="text"
                placeholder="e.g. Monthly buffer restocking for pathology blood tube consumables"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Line Items Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Requested Line Items ({formData.items.length})
                </h3>
                <button
                  onClick={handleAddItem}
                  type="button"
                  style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: 'none', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {formData.items.map((it, idx) => (
                  <div key={idx} style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr auto', gap: '0.75rem', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Item Name / Spec</label>
                      <input
                        type="text"
                        placeholder="Item name"
                        value={it.itemNameSnapshot}
                        onChange={(e) => handleItemChange(idx, 'itemNameSnapshot', e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Unit</label>
                      <select
                        value={it.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                      >
                        <option value="PACK">PACK</option>
                        <option value="BOX">BOX</option>
                        <option value="UNIT">UNIT</option>
                        <option value="VIAL">VIAL</option>
                        <option value="BOTTLE">BOTTLE</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Est. Unit (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={it.estimatedUnitPrice}
                        onChange={(e) => handleItemChange(idx, 'estimatedUnitPrice', e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Specification</label>
                      <input
                        type="text"
                        placeholder="e.g. ISO 13485"
                        value={it.preferredSpecification}
                        onChange={(e) => handleItemChange(idx, 'preferredSpecification', e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={formData.items.length <= 1}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: formData.items.length > 1 ? 'pointer' : 'not-allowed', opacity: formData.items.length > 1 ? 1 : 0.4, padding: '0.5rem 0.25rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                Estimated Total: ₹{calculateFormTotal().toLocaleString()}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateSubmit(true)}
                disabled={submitting}
                style={{ padding: '0.6rem 1.25rem', background: 'rgba(148, 163, 184, 0.2)', border: 'none', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleCreateSubmit(false)}
                disabled={submitting}
                style={{ padding: '0.6rem 1.5rem', background: '#0284c7', border: 'none', color: '#fff', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequestsPage;
