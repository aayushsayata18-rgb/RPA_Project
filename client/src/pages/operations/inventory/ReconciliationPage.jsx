import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Plus,
  RefreshCw,
  Search,
  AlertTriangle,
  X,
  FileText,
  Sliders,
  Eye,
  Check,
  ShieldCheck
} from 'lucide-react';
import inventoryService from '../../../services/inventoryService';

export const ReconciliationPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Selected session detail
  const [selectedSession, setSelectedSession] = useState(null);
  const [resolutionAction, setResolutionAction] = useState('AUTO_CORRECT');
  const [resolutionReason, setResolutionReason] = useState('Auditor verified and accepted difference');
  const [resolving, setResolving] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // New reconciliation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    reconciliationSource: 'PHYSICAL_COUNT',
    sourceReference: 'AUDIT-2026-Q4',
    locationId: 'LOC-MAIN-001',
    discrepancyThreshold: 1,
    externalStockFeed: [
      {
        inventoryItemId: 'INV-000001',
        batchNumber: 'BAT-20001',
        externalQuantity: 175
      }
    ]
  });
  const [creating, setCreating] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await inventoryService.getReconciliations(params);
      if (res?.data) {
        setSessions(res.data.reconciliations || []);
      }
    } catch (err) {
      console.error('Error fetching reconciliations:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load reconciliation sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setActionMessage(null);
    try {
      const res = await inventoryService.createReconciliation(createForm);
      setShowCreateModal(false);
      setActionMessage({
        type: 'success',
        text: `Reconciliation session ${res.data.reconciliation.reconciliationId} generated! Discrepancies flagged.`
      });
      fetchSessions();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Creation failed.' });
    } finally {
      setCreating(false);
    }
  };

  const handleResolveSession = async (session) => {
    setResolving(true);
    setActionMessage(null);
    try {
      const res = await inventoryService.resolveReconciliation(
        session.reconciliationId,
        resolutionAction,
        resolutionReason
      );
      setActionMessage({
        type: 'success',
        text: `Reconciliation ${session.reconciliationId} resolved! Adjustment created: ${res.data.adjustmentId || 'Yes'}`
      });
      setSelectedSession(null);
      fetchSessions();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Resolution failed.' });
    } finally {
      setResolving(false);
    }
  };

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
            <CheckCircle style={{ color: '#0284c7' }} />
            Stock Reconciliation & Discrepancy Resolution
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Automated reconciliation between system ledger, physical audit counts, and external supplier feeds.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowCreateModal(true)}
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
            <Plus size={16} /> New Reconciliation Run
          </button>
          <button
            onClick={fetchSessions}
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
            backgroundColor: actionMessage.type === 'error' ? '#fee2e2' : '#f0fdf4',
            color: actionMessage.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${actionMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}`
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          background: 'var(--bg-card, #fff)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
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
          <option value="">All Reconciliations</option>
          <option value="PENDING_REVIEW">Pending Review (Discrepant)</option>
          <option value="RESOLVED">Resolved</option>
          <option value="AUTO_RECONCILED">Auto-Reconciled (Matched)</option>
        </select>
      </div>

      {/* Reconciliations Table */}
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
                <th style={{ padding: '0.75rem 1rem' }}>Session ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Source & Location</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Total Checked</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Discrepancies</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading reconciliations...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No reconciliation runs found.
                  </td>
                </tr>
              ) : (
                sessions.map((rec) => (
                  <tr key={rec._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#0284c7' }}>
                      {rec.reconciliationId}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: '500' }}>{rec.reconciliationSource}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {rec.sourceReference} • {rec.locationId}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{rec.totalItemsChecked || (rec.items || []).length}</td>
                    <td
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'center',
                        fontWeight: '700',
                        color: rec.totalDiscrepancies > 0 ? '#dc2626' : '#16a34a'
                      }}
                    >
                      {rec.totalDiscrepancies}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {new Date(rec.reconciliationDate || rec.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor:
                            rec.overallStatus === 'RESOLVED' || rec.overallStatus === 'AUTO_RECONCILED'
                              ? '#dcfce7'
                              : '#fee2e2',
                          color:
                            rec.overallStatus === 'RESOLVED' || rec.overallStatus === 'AUTO_RECONCILED'
                              ? '#166534'
                              : '#991b1b'
                        }}
                      >
                        {rec.overallStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedSession(rec)}
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
                        {rec.overallStatus === 'PENDING_REVIEW' ? 'Resolve' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discrepancy Detail & Resolution Modal */}
      {selectedSession && (
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
              maxWidth: '800px',
              width: '95%',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                  Reconciliation: {selectedSession.reconciliationId}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Source: {selectedSession.reconciliationSource} • Status: {selectedSession.overallStatus}
                </span>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Item & Batch</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>System Qty</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>External Feed</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Variance</th>
                    <th style={{ padding: '0.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedSession.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem' }}>
                        <div style={{ fontWeight: '600' }}>{it.itemName || it.inventoryItemId}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch: {it.batchNumber || it.batchId}</div>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600' }}>
                        {it.systemQuantity}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600' }}>
                        {it.externalQuantity}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: it.discrepancyQuantity === 0 ? '#16a34a' : '#dc2626'
                        }}
                      >
                        {it.discrepancyQuantity > 0 ? `+${it.discrepancyQuantity}` : it.discrepancyQuantity}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            background: it.status === 'RESOLVED' || it.status === 'MATCHED' ? '#dcfce7' : '#fee2e2',
                            color: it.status === 'RESOLVED' || it.status === 'MATCHED' ? '#166534' : '#991b1b'
                          }}
                        >
                          {it.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedSession.overallStatus === 'PENDING_REVIEW' && (
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Discrepancy Resolution Action</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Resolution Strategy</label>
                    <select
                      value={resolutionAction}
                      onChange={(e) => setResolutionAction(e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    >
                      <option value="AUTO_CORRECT">AUTO_CORRECT (Generate & Post Stock Adjustment)</option>
                      <option value="MANUAL_OVERRIDE">MANUAL_OVERRIDE (Approve without inventory change)</option>
                      <option value="WRITE_OFF">WRITE_OFF (Post direct loss write-off)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Auditor Explanation</label>
                    <input
                      type="text"
                      value={resolutionReason}
                      onChange={(e) => setResolutionReason(e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
              >
                Close
              </button>

              {selectedSession.overallStatus === 'PENDING_REVIEW' && (
                <button
                  type="button"
                  onClick={() => handleResolveSession(selectedSession)}
                  disabled={resolving}
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
                  {resolving ? 'Executing...' : 'Resolve Discrepancies'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Reconciliation Modal */}
      {showCreateModal && (
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
                Initiate Reconciliation Run
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Reconciliation Source *</label>
                  <select
                    value={createForm.reconciliationSource}
                    onChange={(e) => setCreateForm({ ...createForm, reconciliationSource: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="PHYSICAL_COUNT">Physical Count Audit</option>
                    <option value="ERP_SYNC">ERP Stock Synchronization</option>
                    <option value="SUPPLIER_FEED">Vendor / Supplier Consignment Feed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Source Reference *</label>
                  <input
                    type="text"
                    value={createForm.sourceReference}
                    onChange={(e) => setCreateForm({ ...createForm, sourceReference: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Location *</label>
                  <select
                    value={createForm.locationId}
                    onChange={(e) => setCreateForm({ ...createForm, locationId: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="LOC-MAIN-001">LOC-MAIN-001</option>
                    <option value="LOC-PHARM-001">LOC-PHARM-001</option>
                    <option value="LOC-OT-001">LOC-OT-001</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Threshold</label>
                  <input
                    type="number"
                    value={createForm.discrepancyThreshold}
                    onChange={(e) => setCreateForm({ ...createForm, discrepancyThreshold: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>Feed Line Item Sample</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Item ID"
                    value={createForm.externalStockFeed[0].inventoryItemId}
                    onChange={(e) => {
                      const updated = [...createForm.externalStockFeed];
                      updated[0].inventoryItemId = e.target.value;
                      setCreateForm({ ...createForm, externalStockFeed: updated });
                    }}
                    style={{ width: '33%', padding: '0.35rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    placeholder="Batch #"
                    value={createForm.externalStockFeed[0].batchNumber}
                    onChange={(e) => {
                      const updated = [...createForm.externalStockFeed];
                      updated[0].batchNumber = e.target.value;
                      setCreateForm({ ...createForm, externalStockFeed: updated });
                    }}
                    style={{ width: '33%', padding: '0.35rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  />
                  <input
                    type="number"
                    placeholder="Count"
                    value={createForm.externalStockFeed[0].externalQuantity}
                    onChange={(e) => {
                      const updated = [...createForm.externalStockFeed];
                      updated[0].externalQuantity = Number(e.target.value);
                      setCreateForm({ ...createForm, externalStockFeed: updated });
                    }}
                    style={{ width: '33%', padding: '0.35rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
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
                  {creating ? 'Reconciling...' : 'Run Reconciliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
