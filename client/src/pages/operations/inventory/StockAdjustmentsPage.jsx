import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  X,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Sliders
} from 'lucide-react';
import inventoryService from '../../../services/inventoryService';

export const StockAdjustmentsPage = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // New adjustment modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    inventoryItemId: '',
    batchId: '',
    locationId: 'LOC-MAIN-001',
    adjustmentType: 'DECREASE',
    quantity: 5,
    reason: 'BREAKAGE',
    notes: 'Glass ampoule shattered during transit in storage'
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Approval modal
  const [selectedAdj, setSelectedAdj] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approving, setApproving] = useState(false);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await inventoryService.getAdjustments(params);
      if (res?.data) {
        setAdjustments(res.data.adjustments || []);
      }
    } catch (err) {
      console.error('Error fetching adjustments:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load adjustments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, [statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setActionMessage(null);
    try {
      await inventoryService.createAdjustment({
        ...form,
        quantity: Number(form.quantity)
      });
      setShowModal(false);
      setActionMessage({ type: 'success', text: 'Adjustment request submitted and queued for approval!' });
      fetchAdjustments();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Creation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (approved) => {
    if (!selectedAdj) return;
    setApproving(true);
    setActionMessage(null);
    try {
      if (approved) {
        await inventoryService.approveAdjustment(selectedAdj.adjustmentId, approvalNotes);
        setActionMessage({ type: 'success', text: `Adjustment ${selectedAdj.adjustmentId} approved and stock ledger posted!` });
      } else {
        await inventoryService.rejectAdjustment(selectedAdj.adjustmentId, approvalNotes || 'Rejected by supervisor');
        setActionMessage({ type: 'info', text: `Adjustment ${selectedAdj.adjustmentId} rejected.` });
      }
      setSelectedAdj(null);
      setApprovalNotes('');
      fetchAdjustments();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Approval action failed.' });
    } finally {
      setApproving(false);
    }
  };

  const filteredAdjustments = adjustments.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.adjustmentId?.toLowerCase().includes(q) ||
      a.itemName?.toLowerCase().includes(q) ||
      a.batchNumber?.toLowerCase().includes(q) ||
      a.reason?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle style={{ color: '#d97706' }} />
            Stock Adjustments, Shrinkage & Write-Offs
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Audit variances, breakage, shrinkage write-downs, and supervisor approval controls.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Plus size={16} /> New Adjustment Request
          </button>
          <button
            onClick={fetchAdjustments}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            backgroundColor: actionMessage.type === 'error' ? '#fee2e2' : actionMessage.type === 'success' ? '#f0fdf4' : '#eff6ff',
            color: actionMessage.type === 'error' ? '#991b1b' : actionMessage.type === 'success' ? '#166534' : '#1e40af',
            border: `1px solid ${actionMessage.type === 'error' ? '#fecaca' : actionMessage.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-card, #fff)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by adjustment ID, item, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.5rem 0.5rem 2.2rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.65rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              background: '#fff'
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="PROCESSED">Processed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Adjustments Table */}
      <div
        style={{
          background: 'var(--bg-card, #fff)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Adjustment ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Item & Batch</th>
                <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Cost Impact</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading adjustments...
                  </td>
                </tr>
              ) : filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No stock adjustments found.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((adj) => (
                  <tr key={adj._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#0284c7' }}>
                      {adj.adjustmentId}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: '500' }}>{adj.itemName || adj.inventoryItemId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Batch: {adj.batchNumber || adj.batchId} • {adj.locationId}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: adj.adjustmentType === 'INCREASE' ? '#dcfce7' : '#fee2e2',
                          color: adj.adjustmentType === 'INCREASE' ? '#166534' : '#991b1b'
                        }}
                      >
                        {adj.adjustmentType === 'INCREASE' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {adj.adjustmentType}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'right',
                        fontWeight: '700',
                        color: adj.adjustmentType === 'INCREASE' ? '#16a34a' : '#dc2626'
                      }}
                    >
                      {adj.adjustmentType === 'INCREASE' ? `+${adj.quantity}` : `-${adj.quantity}`}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: '500' }}>{adj.reason}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{adj.notes}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600' }}>
                      ₹{(adj.costImpact || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor:
                            adj.status === 'PROCESSED'
                              ? '#dcfce7'
                              : adj.status === 'REJECTED'
                              ? '#fee2e2'
                              : '#fef3c7',
                          color:
                            adj.status === 'PROCESSED'
                              ? '#166534'
                              : adj.status === 'REJECTED'
                              ? '#991b1b'
                              : '#d97706'
                        }}
                      >
                        {adj.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {adj.status === 'PENDING_APPROVAL' ? (
                        <button
                          onClick={() => setSelectedAdj(adj)}
                          style={{
                            padding: '4px 8px',
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Review
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review / Approval Modal */}
      {selectedAdj && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '10px',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '90%'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                Review Adjustment: {selectedAdj.adjustmentId}
              </h3>
              <button
                onClick={() => setSelectedAdj(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div><strong>Item:</strong> {selectedAdj.itemName} ({selectedAdj.inventoryItemId})</div>
              <div><strong>Batch:</strong> {selectedAdj.batchNumber}</div>
              <div><strong>Type:</strong> {selectedAdj.adjustmentType} ({selectedAdj.quantity} units)</div>
              <div><strong>Reason:</strong> {selectedAdj.reason}</div>
              <div><strong>Notes:</strong> {selectedAdj.notes}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                Supervisor Review Notes
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Enter approval or rejection comments..."
                rows="2"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => handleApprove(false)}
                disabled={approving}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Reject Adjustment
              </button>
              <button
                onClick={() => handleApprove(true)}
                disabled={approving}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {approving ? 'Posting Ledger...' : 'Approve & Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Adjustment Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '10px',
              padding: '1.5rem',
              maxWidth: '550px',
              width: '90%'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} style={{ color: '#0284c7' }} />
                Submit Stock Adjustment
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Item ID *</label>
                  <input
                    type="text"
                    value={form.inventoryItemId}
                    onChange={(e) => setForm({ ...form, inventoryItemId: e.target.value })}
                    placeholder="e.g. INV-000001"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Batch ID / Number *</label>
                  <input
                    type="text"
                    value={form.batchId}
                    onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                    placeholder="e.g. BAT-20001"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Adjustment Type *</label>
                  <select
                    value={form.adjustmentType}
                    onChange={(e) => setForm({ ...form, adjustmentType: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="DECREASE">DECREASE (Shrinkage / Damage / Write-off)</option>
                    <option value="INCREASE">INCREASE (Found / Audit Surplus)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Quantity *</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    min="1"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Reason *</label>
                  <select
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="BREAKAGE">Breakage / Spillage</option>
                    <option value="EXPIRED">Expired Stock Disposal</option>
                    <option value="THEFT">Pilferage / Unaccounted</option>
                    <option value="AUDIT_SHORTAGE">Physical Count Shortage</option>
                    <option value="AUDIT_SURPLUS">Physical Count Surplus</option>
                    <option value="CORRECTION">Data Correction</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Location</label>
                  <select
                    value={form.locationId}
                    onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="LOC-MAIN-001">LOC-MAIN-001</option>
                    <option value="LOC-PHARM-001">LOC-PHARM-001</option>
                    <option value="LOC-OT-001">LOC-OT-001</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Audit Explanation</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Explain the circumstance requiring stock adjustment..."
                  rows="2"
                  style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Queue Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
