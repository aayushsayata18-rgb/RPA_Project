import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowLeft,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle,
  Clock,
  Warehouse,
  TrendingUp,
  RefreshCw,
  Plus,
  Send,
  X,
  FileText
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import inventoryService from '../../../services/inventoryService';

export const InventoryItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Issue stock modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    quantity: 10,
    issuedForType: 'DEPARTMENT_ISSUE',
    issuedForId: 'WARD-ICU-01',
    destinationLocationId: 'LOC-ICU-001',
    notes: ''
  });
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueMessage, setIssueMessage] = useState(null);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [itemRes, movRes] = await Promise.all([
        inventoryService.getItemById(id),
        inventoryService.getMovements({ inventoryItemId: id, limit: 20 })
      ]);

      if (itemRes?.data?.item) {
        setItem(itemRes.data.item);
      }
      if (movRes?.data?.movements) {
        setMovements(movRes.data.movements);
      }
    } catch (err) {
      console.error('Error loading item details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load inventory item.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchItemDetails();
  }, [id]);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setIssueSubmitting(true);
    setIssueMessage(null);
    try {
      await inventoryService.issueStock({
        inventoryItemId: item.inventoryItemId,
        quantity: Number(issueForm.quantity),
        issuedForType: issueForm.issuedForType,
        issuedForId: issueForm.issuedForId,
        destinationLocationId: issueForm.destinationLocationId,
        notes: issueForm.notes
      });
      setIssueMessage({ type: 'success', text: `Successfully issued ${issueForm.quantity} units!` });
      setShowIssueModal(false);
      fetchItemDetails();
    } catch (err) {
      setIssueMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Issue failed.' });
    } finally {
      setIssueSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary-color)' }} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: '#dc2626', marginBottom: '1rem' }} />
        <h2>Item Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error || `Unable to load item ${id}`}</p>
        <button
          onClick={() => navigate('/operations/inventory/items')}
          style={{
            padding: '0.5rem 1rem',
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const isLowStock = (item.availableStock || 0) <= (item.reorderLevel || 0);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/operations/inventory/items')}
            style={{
              padding: '0.4rem 0.75rem',
              border: '1px solid var(--border-color)',
              background: '#fff',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem'
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {item.name}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: item.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                  color: item.status === 'ACTIVE' ? '#166534' : '#991b1b'
                }}
              >
                {item.status}
              </span>
            </h1>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {item.inventoryItemId} • {item.genericName || item.brandName} • {item.category}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowIssueModal(true)}
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
              gap: '0.4rem'
            }}
          >
            <Send size={16} /> Issue Stock
          </button>
        </div>
      </div>

      {issueMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            backgroundColor: issueMessage.type === 'error' ? '#fee2e2' : '#f0fdf4',
            color: issueMessage.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${issueMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}`
          }}
        >
          {issueMessage.text}
        </div>
      )}

      {/* Stock Overview Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Physical On Hand</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>{item.currentStock || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.unitOfMeasure}</div>
        </div>

        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '600' }}>Available for Dispense</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: isLowStock ? '#d97706' : '#16a34a' }}>
            {item.availableStock || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: isLowStock ? '#d97706' : '#16a34a' }}>
            {isLowStock ? 'Low Stock Warning' : 'Normal Stock'}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: '600' }}>Reserved Stock</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#d97706' }}>{item.reservedStock || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Locked for orders/surgeries</div>
        </div>

        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: '600' }}>Expired / Quarantined</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#dc2626' }}>
            {(item.expiredStock || 0) + (item.quarantinedStock || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Non-dispensable</div>
        </div>

        <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reorder Threshold</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>{item.reorderLevel || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reorder Qty: {item.reorderQuantity || 0}</div>
        </div>
      </div>

      {/* Specifications & Properties */}
      <div
        style={{
          background: '#fff',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem'
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Boxes size={18} style={{ color: '#0284c7' }} />
          Item Master Specifications
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Manufacturer:</span>
            <span style={{ fontWeight: '600' }}>{item.manufacturer || 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>SKU Code:</span>
            <span style={{ fontWeight: '600' }}>{item.sku || 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Barcode:</span>
            <span style={{ fontWeight: '600' }}>{item.barcode || 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Pack Size & Unit:</span>
            <span style={{ fontWeight: '600' }}>{item.packSize || 1} {item.packUnit || item.unitOfMeasure}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Temperature Spec:</span>
            <span style={{ fontWeight: '600' }}>{item.temperatureRequirement || 'Ambient'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Controlled Substance:</span>
            <span style={{ fontWeight: '600', color: item.controlledItem ? '#dc2626' : 'inherit' }}>
              {item.controlledItem ? 'YES (Schedule Guarded)' : 'NO'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Prescription Mandate:</span>
            <span style={{ fontWeight: '600' }}>{item.prescriptionRequired ? 'YES' : 'NO'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Min / Max Levels:</span>
            <span style={{ fontWeight: '600' }}>{item.minimumStock || 0} / {item.maximumStock || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Active Batches Table */}
      <div
        style={{
          background: '#fff',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={18} style={{ color: '#16a34a' }} />
            Active Batches (FEFO First-Expiry-First-Out Order)
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {(item.batches || []).length} registered batches
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Batch Number</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Lot #</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Storage Location</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Expiry Date</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Unit Cost</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Available</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Reserved</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(item.batches || []).length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No batches found for this item.
                  </td>
                </tr>
              ) : (
                item.batches.map((b) => {
                  const isExpired = new Date(b.expiryDate) < new Date();
                  return (
                    <tr key={b.batchId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>{b.batchNumber || b.batchId}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{b.lotNumber || '-'}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{b.storageLocation || b.locationId}</td>
                      <td
                        style={{
                          padding: '0.6rem 0.75rem',
                          fontWeight: isExpired ? '700' : 'normal',
                          color: isExpired ? '#dc2626' : 'inherit'
                        }}
                      >
                        {new Date(b.expiryDate).toLocaleDateString()}
                        {isExpired && ' (EXPIRED)'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>₹{b.unitCost || 0}</td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                        {b.availableQuantity}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {b.reservedQuantity || 0}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            backgroundColor:
                              b.status === 'AVAILABLE' || b.status === 'ACTIVE'
                                ? '#dcfce7'
                                : b.status === 'EXPIRED'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              b.status === 'AVAILABLE' || b.status === 'ACTIVE'
                                ? '#166534'
                                : b.status === 'EXPIRED'
                                ? '#991b1b'
                                : '#d97706'
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Movements History Ledger */}
      <div
        style={{
          background: '#fff',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} style={{ color: '#0284c7' }} />
          Immutable Movement Ledger for {item.name}
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Date & Time</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Movement ID</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Batch #</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Type</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Qty Change</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Balance</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Reference</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Actor</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recorded movement ledger entries for this item.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(m.timestamp || m.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>{m.movementId}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{m.batchNumber || m.batchId}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          backgroundColor:
                            m.movementType === 'RECEIPT' || m.movementType === 'TRANSFER_IN' || m.movementType === 'ADJUSTMENT_IN'
                              ? '#dcfce7'
                              : '#fee2e2',
                          color:
                            m.movementType === 'RECEIPT' || m.movementType === 'TRANSFER_IN' || m.movementType === 'ADJUSTMENT_IN'
                              ? '#166534'
                              : '#991b1b'
                        }}
                      >
                        {m.movementType}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '0.6rem 0.75rem',
                        textAlign: 'right',
                        fontWeight: '700',
                        color: m.quantityChange > 0 ? '#16a34a' : '#dc2626'
                      }}
                    >
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>
                      {m.balanceAfter ?? '-'}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                      {m.referenceType}: {m.referenceId}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                      {m.actorName || m.actorId || 'System'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Stock Modal */}
      {showIssueModal && (
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
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={18} style={{ color: '#0284c7' }} />
                Issue Stock: {item.name}
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Quantity to Issue ({item.unitOfMeasure}) *
                  </label>
                  <input
                    type="number"
                    value={issueForm.quantity}
                    onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    min="1"
                    max={item.availableStock || 9999}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Available stock: {item.availableStock || 0} units
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Issue Reason / Request Type *
                  </label>
                  <select
                    value={issueForm.issuedForType}
                    onChange={(e) => setIssueForm({ ...issueForm, issuedForType: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="DEPARTMENT_ISSUE">Department Requisition</option>
                    <option value="WARD_ISSUE">Inpatient Ward Consumption</option>
                    <option value="OT_ISSUE">Operation Theatre Issue</option>
                    <option value="EMERGENCY_ISSUE">Emergency Trauma Issue</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Requisition / Target ID *
                  </label>
                  <input
                    type="text"
                    value={issueForm.issuedForId}
                    onChange={(e) => setIssueForm({ ...issueForm, issuedForId: e.target.value })}
                    placeholder="e.g. WARD-REQ-001"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Destination Location
                  </label>
                  <select
                    value={issueForm.destinationLocationId}
                    onChange={(e) => setIssueForm({ ...issueForm, destinationLocationId: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="LOC-ICU-001">ICU (LOC-ICU-001)</option>
                    <option value="LOC-OT-001">Operation Theatre (LOC-OT-001)</option>
                    <option value="LOC-EMER-001">Emergency (LOC-EMER-001)</option>
                    <option value="LOC-WARD-001">General Ward (LOC-WARD-001)</option>
                    <option value="LOC-PHARM-001">Central Pharmacy (LOC-PHARM-001)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    Notes / Reference
                  </label>
                  <textarea
                    value={issueForm.notes}
                    onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                    placeholder="e.g. Routine daily morning floor stock replenishment"
                    rows="2"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueSubmitting || (item.availableStock || 0) <= 0}
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
                  {issueSubmitting ? 'Posting Issue...' : 'Confirm Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
