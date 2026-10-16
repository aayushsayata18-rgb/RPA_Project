import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Clock,
  X,
  Sliders,
  Warehouse
} from 'lucide-react';
import inventoryService from '../../../services/inventoryService';

export const BatchManagementPage = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Status change modal (Quarantine / Release)
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [statusAction, setStatusAction] = useState('QUARANTINED');
  const [actionNotes, setActionNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // New batch registration modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    inventoryItemId: '',
    batchNumber: '',
    lotNumber: '',
    manufacturer: '',
    manufacturingDate: '',
    expiryDate: '',
    locationId: 'LOC-MAIN-001',
    unitCost: 10,
    sellingPrice: 20,
    initialQuantity: 100
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await inventoryService.getBatches(params);
      if (res?.data) {
        setBatches(res.data.batches || []);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBatches();
  };

  const handleStatusChangeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setActionSubmitting(true);
    setActionMessage(null);
    try {
      await inventoryService.updateBatchStatus(selectedBatch.batchId, statusAction, actionNotes);
      setActionMessage({ type: 'success', text: `Batch ${selectedBatch.batchNumber} status updated to ${statusAction}!` });
      setSelectedBatch(null);
      setActionNotes('');
      fetchBatches();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Status update failed.' });
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      await inventoryService.createBatch(createForm);
      setShowCreateModal(false);
      setCreateForm({
        inventoryItemId: '',
        batchNumber: '',
        lotNumber: '',
        manufacturer: '',
        manufacturingDate: '',
        expiryDate: '',
        locationId: 'LOC-MAIN-001',
        unitCost: 10,
        sellingPrice: 20,
        initialQuantity: 100
      });
      fetchBatches();
    } catch (err) {
      setCreateError(err.response?.data?.message || err.message || 'Failed to register batch.');
    } finally {
      setCreateSubmitting(false);
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
            <Package style={{ color: '#0284c7' }} />
            Inventory Batch & Lot Registry
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Authoritative batch control, expiry enforcement, quarantine segregation, and FEFO tracking.
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
            <Plus size={16} /> Register New Batch
          </button>
          <button
            onClick={fetchBatches}
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
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1', minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by batch #, lot #, item name, or ID..."
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
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>

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
            <option value="AVAILABLE">Available</option>
            <option value="ACTIVE">Active</option>
            <option value="PARTIALLY_RESERVED">Partially Reserved</option>
            <option value="QUARANTINED">Quarantined</option>
            <option value="EXPIRED">Expired</option>
            <option value="DAMAGED">Damaged</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Batches Table */}
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
                <th style={{ padding: '0.75rem 1rem' }}>Batch Number</th>
                <th style={{ padding: '0.75rem 1rem' }}>Item & Code</th>
                <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                <th style={{ padding: '0.75rem 1rem' }}>Expiry Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Unit Cost</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>On Hand</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Available</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Reserved</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No batches match the selected criteria.
                  </td>
                </tr>
              ) : (
                batches.map((b) => {
                  const isExpired = new Date(b.expiryDate) < new Date();
                  return (
                    <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                        <div>{b.batchNumber || b.batchId}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.lotNumber || '-'}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{b.itemName || b.medicineName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.inventoryItemId || b.medicineId}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.85rem' }}>{b.storageLocation || b.locationId}</span>
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          fontWeight: isExpired ? '700' : 'normal',
                          color: isExpired ? '#dc2626' : 'inherit'
                        }}
                      >
                        {new Date(b.expiryDate).toLocaleDateString()}
                        {isExpired && ' (EXPIRED)'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>₹{b.unitCost || 0}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600' }}>{b.onHandQuantity}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                        {b.availableQuantity}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {b.reservedQuantity || 0}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor:
                              b.status === 'AVAILABLE' || b.status === 'ACTIVE'
                                ? '#dcfce7'
                                : b.status === 'EXPIRED'
                                ? '#fee2e2'
                                : b.status === 'QUARANTINED'
                                ? '#fef3c7'
                                : '#f1f5f9',
                            color:
                              b.status === 'AVAILABLE' || b.status === 'ACTIVE'
                                ? '#166534'
                                : b.status === 'EXPIRED'
                                ? '#991b1b'
                                : b.status === 'QUARANTINED'
                                ? '#d97706'
                                : '#475569'
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedBatch(b);
                            setStatusAction(b.status === 'QUARANTINED' ? 'AVAILABLE' : 'QUARANTINED');
                          }}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid var(--border-color)',
                            background: '#fff',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: b.status === 'QUARANTINED' ? '#16a34a' : '#d97706'
                          }}
                        >
                          {b.status === 'QUARANTINED' ? 'Release' : 'Quarantine'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Status Modal */}
      {selectedBatch && (
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
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                Batch Status: {selectedBatch.batchNumber}
              </h3>
              <button
                onClick={() => setSelectedBatch(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStatusChangeSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    New Target Status *
                  </label>
                  <select
                    value={statusAction}
                    onChange={(e) => setStatusAction(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="AVAILABLE">AVAILABLE (Normal Dispense)</option>
                    <option value="QUARANTINED">QUARANTINED (Hold for Inspection)</option>
                    <option value="BLOCKED">BLOCKED (Regulatory Freeze)</option>
                    <option value="RECALLED">RECALLED (Manufacturer Recall)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Reason / Audit Notes *
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Enter reason for quarantine/status transition..."
                    rows="3"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
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
                  {actionSubmitting ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register New Batch Modal */}
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
              width: '95%',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} style={{ color: '#0284c7' }} />
                Register New Inventory Batch
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Item ID *</label>
                  <input
                    type="text"
                    value={createForm.inventoryItemId}
                    onChange={(e) => setCreateForm({ ...createForm, inventoryItemId: e.target.value })}
                    placeholder="e.g. INV-000001"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Batch Number *</label>
                  <input
                    type="text"
                    value={createForm.batchNumber}
                    onChange={(e) => setCreateForm({ ...createForm, batchNumber: e.target.value })}
                    placeholder="e.g. BAT-2026-X01"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Lot Number</label>
                  <input
                    type="text"
                    value={createForm.lotNumber}
                    onChange={(e) => setCreateForm({ ...createForm, lotNumber: e.target.value })}
                    placeholder="e.g. LOT-A01"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Storage Location *</label>
                  <select
                    value={createForm.locationId}
                    onChange={(e) => setCreateForm({ ...createForm, locationId: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="LOC-MAIN-001">Main Store (LOC-MAIN-001)</option>
                    <option value="LOC-PHARM-001">Central Pharmacy (LOC-PHARM-001)</option>
                    <option value="LOC-COLD-001">Cold Storage (LOC-COLD-001)</option>
                    <option value="LOC-OT-001">Operation Theatre (LOC-OT-001)</option>
                    <option value="LOC-EMER-001">Emergency Store (LOC-EMER-001)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Initial Quantity *</label>
                  <input
                    type="number"
                    value={createForm.initialQuantity}
                    onChange={(e) => setCreateForm({ ...createForm, initialQuantity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Expiry Date *</label>
                  <input
                    type="date"
                    value={createForm.expiryDate}
                    onChange={(e) => setCreateForm({ ...createForm, expiryDate: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Unit Cost (₹)</label>
                  <input
                    type="number"
                    value={createForm.unitCost}
                    onChange={(e) => setCreateForm({ ...createForm, unitCost: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    step="0.01"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Manufacturer</label>
                  <input
                    type="text"
                    value={createForm.manufacturer}
                    onChange={(e) => setCreateForm({ ...createForm, manufacturer: e.target.value })}
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
                  disabled={createSubmitting}
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
                  {createSubmitting ? 'Registering...' : 'Register Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
