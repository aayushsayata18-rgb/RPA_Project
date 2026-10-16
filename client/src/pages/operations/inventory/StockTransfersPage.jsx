import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  Truck,
  ArrowRight,
  Send,
  Eye,
  Sliders,
  AlertCircle
} from 'lucide-react';
import inventoryService from '../../../services/inventoryService';

export const StockTransfersPage = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE', 'DISPATCH', 'RECEIVE', 'VIEW'
  const [actionNotes, setActionNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [receivedQtyInput, setReceivedQtyInput] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // New transfer form
  const [createForm, setCreateForm] = useState({
    sourceLocationId: 'LOC-MAIN-001',
    destinationLocationId: 'LOC-PHARM-001',
    priority: 'ROUTINE',
    reason: 'Routine ward/pharmacy stock replenishment',
    items: [
      {
        inventoryItemId: 'INV-000001',
        requestedQuantity: 50,
        approvedQuantity: 50
      }
    ]
  });

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await inventoryService.getTransfers(params);
      if (res?.data) {
        setTransfers(res.data.transfers || []);
      }
    } catch (err) {
      console.error('Error loading transfers:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load stock transfers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionSubmitting(true);
    setActionMessage(null);
    try {
      await inventoryService.createTransfer(createForm);
      setShowCreateModal(false);
      setActionMessage({ type: 'success', text: 'Transfer request submitted successfully!' });
      fetchTransfers();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Transfer creation failed.' });
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransfer) return;
    setActionSubmitting(true);
    setActionMessage(null);
    try {
      if (actionType === 'APPROVE') {
        await inventoryService.approveTransfer(selectedTransfer.transferId, actionNotes);
        setActionMessage({ type: 'success', text: `Transfer ${selectedTransfer.transferId} approved!` });
      } else if (actionType === 'DISPATCH') {
        await inventoryService.dispatchTransfer(selectedTransfer.transferId, trackingNumber, actionNotes);
        setActionMessage({ type: 'success', text: `Transfer ${selectedTransfer.transferId} dispatched!` });
      } else if (actionType === 'RECEIVE') {
        const receivedItems = (selectedTransfer.items || []).map((it) => ({
          inventoryItemId: it.inventoryItemId,
          receivedQuantity: receivedQtyInput !== '' ? Number(receivedQtyInput) : it.dispatchedQuantity || it.approvedQuantity
        }));
        const res = await inventoryService.receiveTransfer(selectedTransfer.transferId, receivedItems, actionNotes);
        if (res.data.transfer.mismatchFlag) {
          setActionMessage({
            type: 'error',
            text: `Transfer received with quantity MISMATCH! Exception case raised for human review.`
          });
        } else {
          setActionMessage({ type: 'success', text: `Transfer ${selectedTransfer.transferId} received successfully!` });
        }
      }
      setSelectedTransfer(null);
      setActionType(null);
      fetchTransfers();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Action failed.' });
    } finally {
      setActionSubmitting(false);
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.transferId?.toLowerCase().includes(q) ||
      t.sourceLocationId?.toLowerCase().includes(q) ||
      t.destinationLocationId?.toLowerCase().includes(q)
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
            <RotateCcw style={{ color: '#0284c7' }} />
            Inter-Store Stock Transfers & Requisitions
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Two-step transfer lifecycle: Requisition → Approval → Dispatch → Secure Receipt & Mismatch Guard.
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
            <Plus size={16} /> New Requisition
          </button>
          <button
            onClick={fetchTransfers}
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
            placeholder="Search by transfer ID or location..."
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
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="DISPATCHED">Dispatched (In Transit)</option>
            <option value="RECEIVED">Received</option>
            <option value="PARTIALLY_RECEIVED">Partially Received (Mismatch)</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Transfers Table */}
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
                <th style={{ padding: '0.75rem 1rem' }}>Transfer ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Source → Destination</th>
                <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Items</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading stock transfers...
                  </td>
                </tr>
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No stock transfers match the criteria.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#0284c7' }}>
                      {t.transferId}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '500' }}>
                        <span>{t.sourceLocationId}</span>
                        <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: '#0284c7' }}>{t.destinationLocationId}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: t.priority === 'URGENT' || t.priority === 'STAT' ? '#fee2e2' : '#f1f5f9',
                          color: t.priority === 'URGENT' || t.priority === 'STAT' ? '#dc2626' : '#475569'
                        }}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{(t.items || []).length}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor:
                            t.status === 'RECEIVED'
                              ? '#dcfce7'
                              : t.status === 'DISPATCHED'
                              ? '#eff6ff'
                              : t.status === 'PARTIALLY_RECEIVED'
                              ? '#fee2e2'
                              : '#fef3c7',
                          color:
                            t.status === 'RECEIVED'
                              ? '#166534'
                              : t.status === 'DISPATCHED'
                              ? '#1d4ed8'
                              : t.status === 'PARTIALLY_RECEIVED'
                              ? '#991b1b'
                              : '#d97706'
                        }}
                      >
                        {t.status}
                      </span>
                      {t.mismatchFlag && (
                        <span style={{ marginLeft: '4px', color: '#dc2626', fontSize: '0.75rem', fontWeight: '700' }}>
                          (MISMATCH)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                        {t.status === 'REQUESTED' && (
                          <button
                            onClick={() => {
                              setSelectedTransfer(t);
                              setActionType('APPROVE');
                            }}
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
                            Approve
                          </button>
                        )}

                        {t.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setSelectedTransfer(t);
                              setActionType('DISPATCH');
                            }}
                            style={{
                              padding: '3px 8px',
                              background: '#059669',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Dispatch
                          </button>
                        )}

                        {t.status === 'DISPATCHED' && (
                          <button
                            onClick={() => {
                              setSelectedTransfer(t);
                              setActionType('RECEIVE');
                              setReceivedQtyInput(t.items?.[0]?.dispatchedQuantity || t.items?.[0]?.approvedQuantity || '');
                            }}
                            style={{
                              padding: '3px 8px',
                              background: '#2563eb',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Receive
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedTransfer(t);
                            setActionType('VIEW');
                          }}
                          style={{
                            padding: '3px 8px',
                            background: '#f8fafc',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal (Approve / Dispatch / Receive / View) */}
      {selectedTransfer && actionType && (
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
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                {actionType} Transfer: {selectedTransfer.transferId}
              </h3>
              <button
                onClick={() => {
                  setSelectedTransfer(null);
                  setActionType(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {actionType === 'VIEW' ? (
              <div>
                <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div><strong>From:</strong> {selectedTransfer.sourceLocationId} → <strong>To:</strong> {selectedTransfer.destinationLocationId}</div>
                  <div><strong>Status:</strong> {selectedTransfer.status} {selectedTransfer.mismatchFlag && '(MISMATCH DETECTED)'}</div>
                  <div><strong>Reason:</strong> {selectedTransfer.reason}</div>
                  {selectedTransfer.trackingNumber && <div><strong>Tracking #:</strong> {selectedTransfer.trackingNumber}</div>}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.4rem' }}>Item</th>
                      <th style={{ padding: '0.4rem', textAlign: 'right' }}>Req</th>
                      <th style={{ padding: '0.4rem', textAlign: 'right' }}>Appr</th>
                      <th style={{ padding: '0.4rem', textAlign: 'right' }}>Disp</th>
                      <th style={{ padding: '0.4rem', textAlign: 'right' }}>Recv</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedTransfer.items || []).map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.4rem' }}>{it.itemName || it.inventoryItemId}</td>
                        <td style={{ padding: '0.4rem', textAlign: 'right' }}>{it.requestedQuantity}</td>
                        <td style={{ padding: '0.4rem', textAlign: 'right' }}>{it.approvedQuantity}</td>
                        <td style={{ padding: '0.4rem', textAlign: 'right' }}>{it.dispatchedQuantity || '-'}</td>
                        <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: '700', color: it.receivedQuantity !== it.dispatchedQuantity ? '#dc2626' : '#16a34a' }}>
                          {it.receivedQuantity ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => {
                      setSelectedTransfer(null);
                      setActionType(null);
                    }}
                    style={{ padding: '0.45rem 1rem', background: '#f1f5f9', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleActionSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {actionType === 'DISPATCH' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        Tracking / Waybill Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g. TRK-2026-0091"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      />
                    </div>
                  )}

                  {actionType === 'RECEIVE' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        Actual Physically Received Quantity *
                      </label>
                      <input
                        type="number"
                        value={receivedQtyInput}
                        onChange={(e) => setReceivedQtyInput(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        required
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Dispatched was {selectedTransfer.items?.[0]?.dispatchedQuantity || selectedTransfer.items?.[0]?.approvedQuantity} units. If different, mismatch exception will be triggered.
                      </span>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      Audit Notes / Remarks
                    </label>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Add any supervisor comments..."
                      rows="2"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTransfer(null);
                      setActionType(null);
                    }}
                    style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionSubmitting}
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
                    {actionSubmitting ? 'Processing...' : `Confirm ${actionType}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Requisition Modal */}
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
              maxWidth: '600px',
              width: '90%'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} style={{ color: '#0284c7' }} />
                New Inter-Store Requisition
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Source Store *</label>
                  <select
                    value={createForm.sourceLocationId}
                    onChange={(e) => setCreateForm({ ...createForm, sourceLocationId: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="LOC-MAIN-001">Main Store (LOC-MAIN-001)</option>
                    <option value="LOC-PHARM-001">Central Pharmacy (LOC-PHARM-001)</option>
                    <option value="LOC-COLD-001">Cold Storage (LOC-COLD-001)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Destination *</label>
                  <select
                    value={createForm.destinationLocationId}
                    onChange={(e) => setCreateForm({ ...createForm, destinationLocationId: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="LOC-PHARM-001">Central Pharmacy (LOC-PHARM-001)</option>
                    <option value="LOC-OT-001">Operation Theatre (LOC-OT-001)</option>
                    <option value="LOC-ICU-001">ICU Sub-Store (LOC-ICU-001)</option>
                    <option value="LOC-EMER-001">Emergency Store (LOC-EMER-001)</option>
                    <option value="LOC-WARD-001">General Ward (LOC-WARD-001)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Item ID *</label>
                  <input
                    type="text"
                    value={createForm.items[0].inventoryItemId}
                    onChange={(e) => {
                      const updated = [...createForm.items];
                      updated[0].inventoryItemId = e.target.value;
                      setCreateForm({ ...createForm, items: updated });
                    }}
                    placeholder="e.g. INV-000001"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Quantity *</label>
                  <input
                    type="number"
                    value={createForm.items[0].requestedQuantity}
                    onChange={(e) => {
                      const updated = [...createForm.items];
                      updated[0].requestedQuantity = Number(e.target.value);
                      updated[0].approvedQuantity = Number(e.target.value);
                      setCreateForm({ ...createForm, items: updated });
                    }}
                    min="1"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="URGENT">Urgent</option>
                    <option value="STAT">STAT / Emergency</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Requisition Purpose</label>
                  <input
                    type="text"
                    value={createForm.reason}
                    onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
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
                  disabled={actionSubmitting}
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
                  {actionSubmitting ? 'Submitting...' : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
