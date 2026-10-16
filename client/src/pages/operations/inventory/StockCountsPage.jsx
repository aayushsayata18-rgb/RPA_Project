import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  Sliders,
  Eye,
  Check
} from 'lucide-react';
import inventoryService from '../../../services/inventoryService';

export const StockCountsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Count entry modal
  const [activeSession, setActiveSession] = useState(null);
  const [countItems, setCountItems] = useState([]);
  const [actionNotes, setActionNotes] = useState('');
  const [savingCounts, setSavingCounts] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Start new count session modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [startForm, setStartForm] = useState({
    locationId: 'LOC-MAIN-001',
    countType: 'CYCLE',
    blindCount: false,
    freezeMovements: false
  });
  const [startingSession, setStartingSession] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await inventoryService.getStockCounts(params);
      if (res?.data) {
        setSessions(res.data.sessions || []);
      }
    } catch (err) {
      console.error('Error fetching stock counts:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load stock count sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [statusFilter]);

  const handleStartSession = async (e) => {
    e.preventDefault();
    setStartingSession(true);
    setActionMessage(null);
    try {
      const res = await inventoryService.startStockCount(startForm);
      setShowStartModal(false);
      setActionMessage({ type: 'success', text: `Stock count session ${res.data.session.countSessionId} started with system snapshot!` });
      fetchSessions();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to start session.' });
    } finally {
      setStartingSession(false);
    }
  };

  const handleOpenSheet = (session) => {
    setActiveSession(session);
    setCountItems(
      (session.items || []).map((it) => ({
        ...it,
        countedQuantity: it.countedQuantity ?? it.systemSnapshotQuantity
      }))
    );
  };

  const handleCountQtyChange = (idx, val) => {
    const updated = [...countItems];
    const counted = Number(val);
    updated[idx].countedQuantity = counted;
    updated[idx].varianceQuantity = counted - updated[idx].systemSnapshotQuantity;
    setCountItems(updated);
  };

  const handleSubmitCounts = async () => {
    if (!activeSession) return;
    setSavingCounts(true);
    setActionMessage(null);
    try {
      const payloadCounts = countItems.map((it) => ({
        batchId: it.batchId,
        countedQuantity: it.countedQuantity
      }));
      await inventoryService.submitCountSheet(activeSession.countSessionId, payloadCounts);
      setActionMessage({ type: 'success', text: `Count entries saved for ${activeSession.countSessionId}!` });
      setActiveSession(null);
      fetchSessions();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Saving counts failed.' });
    } finally {
      setSavingCounts(false);
    }
  };

  const handleCompleteSession = async (session) => {
    setActionMessage(null);
    try {
      await inventoryService.completeStockCount(session.countSessionId, 'Completed and reconciled by audit team');
      setActionMessage({ type: 'success', text: `Session ${session.countSessionId} completed successfully!` });
      fetchSessions();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Completion failed.' });
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
            <BarChart3 style={{ color: '#0284c7' }} />
            Physical Stock Count & Audit Sessions
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Cycle count sheets, blind counting audits, system vs physical variance reporting, and posting.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowStartModal(true)}
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
            <Plus size={16} /> Start New Count Session
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
          <option value="">All Sessions</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Sessions Table */}
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
                <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                <th style={{ padding: '0.75rem 1rem' }}>Count Type</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Items</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Variances</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading count sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No stock count sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => {
                  const varCount = (s.items || []).filter((it) => it.varianceQuantity !== 0).length;
                  return (
                    <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#0284c7' }}>
                        {s.countSessionId}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{s.locationId}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{s.countType}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{(s.items || []).length}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700', color: varCount > 0 ? '#dc2626' : '#16a34a' }}>
                        {varCount}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor:
                              s.status === 'COMPLETED'
                                ? '#dcfce7'
                                : s.status === 'IN_PROGRESS'
                                ? '#eff6ff'
                                : '#fef3c7',
                            color:
                              s.status === 'COMPLETED'
                                ? '#166534'
                                : s.status === 'IN_PROGRESS'
                                ? '#1d4ed8'
                                : '#d97706'
                          }}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                          <button
                            onClick={() => handleOpenSheet(s)}
                            style={{
                              padding: '3px 8px',
                              background: '#0284c7',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Count Sheet
                          </button>

                          {s.status === 'PENDING_REVIEW' && (
                            <button
                              onClick={() => handleCompleteSession(s)}
                              style={{
                                padding: '3px 8px',
                                background: '#16a34a',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Count Sheet Modal */}
      {activeSession && (
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
              maxWidth: '850px',
              width: '95%',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                  Physical Count Sheet: {activeSession.countSessionId}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Location: {activeSession.locationId} • Status: {activeSession.status}
                </span>
              </div>
              <button
                onClick={() => setActiveSession(null)}
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
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>System Snapshot</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', width: '140px' }}>Physical Count</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {countItems.map((it, idx) => {
                    const variance = (it.countedQuantity ?? it.systemSnapshotQuantity) - it.systemSnapshotQuantity;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.5rem' }}>
                          <div style={{ fontWeight: '600' }}>{it.itemName || it.inventoryItemId}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch: {it.batchNumber || it.batchId}</div>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600' }}>
                          {it.systemSnapshotQuantity}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                          <input
                            type="number"
                            value={it.countedQuantity ?? ''}
                            onChange={(e) => handleCountQtyChange(idx, e.target.value)}
                            style={{
                              width: '90px',
                              padding: '0.3rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              textAlign: 'right',
                              fontWeight: '700'
                            }}
                          />
                        </td>
                        <td
                          style={{
                            padding: '0.5rem',
                            textAlign: 'right',
                            fontWeight: '700',
                            color: variance === 0 ? '#16a34a' : '#dc2626'
                          }}
                        >
                          {variance > 0 ? `+${variance}` : variance}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveSession(null)}
                style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSubmitCounts}
                disabled={savingCounts}
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
                {savingCounts ? 'Submitting...' : 'Save Physical Counts'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Session Modal */}
      {showStartModal && (
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
              maxWidth: '450px',
              width: '90%'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} style={{ color: '#0284c7' }} />
                Initiate Stock Count Session
              </h3>
              <button
                onClick={() => setShowStartModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStartSession}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Target Storage Location *
                  </label>
                  <select
                    value={startForm.locationId}
                    onChange={(e) => setStartForm({ ...startForm, locationId: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="LOC-MAIN-001">Main Store (LOC-MAIN-001)</option>
                    <option value="LOC-PHARM-001">Central Pharmacy (LOC-PHARM-001)</option>
                    <option value="LOC-OT-001">Operation Theatre (LOC-OT-001)</option>
                    <option value="LOC-ICU-001">ICU Sub-Store (LOC-ICU-001)</option>
                    <option value="LOC-COLD-001">Cold Storage (LOC-COLD-001)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Count Type *
                  </label>
                  <select
                    value={startForm.countType}
                    onChange={(e) => setStartForm({ ...startForm, countType: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="CYCLE">Cycle Count (ABC Rotation)</option>
                    <option value="FULL">Wall-to-Wall Complete Physical Audit</option>
                    <option value="SPOT">Spot Check / Discrepancy Verification</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={startForm.blindCount}
                      onChange={(e) => setStartForm({ ...startForm, blindCount: e.target.checked })}
                    />
                    Blind Count (Hide system snapshot quantity from counters)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={startForm.freezeMovements}
                      onChange={(e) => setStartForm({ ...startForm, freezeMovements: e.target.checked })}
                    />
                    Freeze Location Stock Movements during count
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={startingSession}
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
                  {startingSession ? 'Freezing Snapshot...' : 'Start Count'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
