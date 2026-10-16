import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  Package,
  Layers,
  FileText,
  Eye,
  Trash2
} from 'lucide-react';
import inventoryService from '../../../services/inventoryService';

export const GoodsReceiptPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Selected GRN detail modal
  const [selectedGrn, setSelectedGrn] = useState(null);

  // New Goods Receipt modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    purchaseOrderId: 'PO-2026-1001',
    vendorId: 'VND-1001',
    vendorName: 'Apex Healthcare Distribution',
    deliveryChallanNumber: 'DC-9921',
    invoiceNumber: 'INV-SUP-8821',
    notes: 'Routine purchase order receiving',
    items: [
      {
        inventoryItemId: 'INV-000001',
        orderedQuantity: 200,
        receivedQuantity: 200,
        acceptedQuantity: 200,
        rejectedQuantity: 0,
        batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
        expiryDate: '2028-12-31',
        unitCost: 1.5,
        locationId: 'LOC-MAIN-001'
      }
    ]
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryService.getGoodsReceipts();
      if (res?.data) {
        setReceipts(res.data.goodsReceipts || []);
      }
    } catch (err) {
      console.error('Error fetching goods receipts:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load goods receipts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleAddItemRow = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          inventoryItemId: '',
          orderedQuantity: 100,
          receivedQuantity: 100,
          acceptedQuantity: 100,
          rejectedQuantity: 0,
          batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
          expiryDate: '2028-12-31',
          unitCost: 5.0,
          locationId: 'LOC-MAIN-001'
        }
      ]
    });
  };

  const handleRemoveItemRow = (idx) => {
    if (form.items.length <= 1) return;
    const updated = form.items.filter((_, i) => i !== idx);
    setForm({ ...form, items: updated });
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...form.items];
    updated[idx][field] = val;
    if (field === 'receivedQuantity') {
      updated[idx].acceptedQuantity = Number(val) - Number(updated[idx].rejectedQuantity || 0);
    }
    setForm({ ...form, items: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await inventoryService.createGoodsReceipt(form);
      setFormSuccess(`Goods Receipt ${res.data.goodsReceipt.goodsReceiptNumber} recorded! Batches registered.`);
      setShowModal(false);
      fetchReceipts();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to process goods receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReceipts = receipts.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.goodsReceiptNumber?.toLowerCase().includes(q) ||
      r.purchaseOrderId?.toLowerCase().includes(q) ||
      r.vendorName?.toLowerCase().includes(q) ||
      r.vendorId?.toLowerCase().includes(q)
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
            <Truck style={{ color: '#0284c7' }} />
            Goods Receipt (GRN) & Delivery Inbound
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Purchase order receiving, quality inspections, automatic batch registration, and ledger posting.
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
            <Plus size={16} /> Process Delivery (GRN)
          </button>
          <button
            onClick={fetchReceipts}
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

      {formSuccess && (
        <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '1rem' }}>
          {formSuccess}
        </div>
      )}

      {/* Search Bar */}
      <div
        style={{
          background: 'var(--bg-card, #fff)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          maxWidth: '450px'
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by GRN #, PO #, or vendor..."
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
      </div>

      {/* Receipts Table */}
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
                <th style={{ padding: '0.75rem 1rem' }}>GRN Number</th>
                <th style={{ padding: '0.75rem 1rem' }}>PO Number</th>
                <th style={{ padding: '0.75rem 1rem' }}>Vendor</th>
                <th style={{ padding: '0.75rem 1rem' }}>Received Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Items</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Accepted</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading Goods Receipts...
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No Goods Receipts found.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((grn) => {
                  const totalAcc = (grn.items || []).reduce((sum, it) => sum + (it.acceptedQuantity || 0), 0);
                  return (
                    <tr key={grn._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#0284c7' }}>
                        {grn.goodsReceiptNumber}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{grn.purchaseOrderId}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div>{grn.vendorName || grn.vendorId}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{grn.deliveryChallanNumber}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                        {new Date(grn.receivedDate || grn.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{(grn.items || []).length}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                        {totalAcc}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: grn.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                            color: grn.status === 'COMPLETED' ? '#166534' : '#d97706'
                          }}
                        >
                          {grn.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedGrn(grn)}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid var(--border-color)',
                            background: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#0284c7',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={14} /> View
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

      {/* View GRN Details Modal */}
      {selectedGrn && (
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
              maxWidth: '750px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                  Goods Receipt: {selectedGrn.goodsReceiptNumber}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  PO: {selectedGrn.purchaseOrderId} • Vendor: {selectedGrn.vendorName || selectedGrn.vendorId}
                </span>
              </div>
              <button
                onClick={() => setSelectedGrn(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Item</th>
                    <th style={{ padding: '0.5rem' }}>Batch #</th>
                    <th style={{ padding: '0.5rem' }}>Expiry</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Recv / Acc</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Rej</th>
                    <th style={{ padding: '0.5rem' }}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedGrn.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: '600' }}>
                        <div>{it.itemName || it.inventoryItemId}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{it.inventoryItemId}</div>
                      </td>
                      <td style={{ padding: '0.5rem' }}>{it.batchNumber}</td>
                      <td style={{ padding: '0.5rem' }}>{new Date(it.expiryDate).toLocaleDateString()}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600' }}>
                        {it.receivedQuantity} / {it.acceptedQuantity}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: it.rejectedQuantity > 0 ? '#dc2626' : 'inherit' }}>
                        {it.rejectedQuantity || 0}
                      </td>
                      <td style={{ padding: '0.5rem' }}>{it.locationId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedGrn(null)}
                style={{ padding: '0.45rem 1rem', background: '#f1f5f9', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Goods Receipt Modal */}
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
              maxWidth: '900px',
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} style={{ color: '#0284c7' }} />
                Process PO Delivery & Goods Receipt
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>PO Number *</label>
                  <input
                    type="text"
                    value={form.purchaseOrderId}
                    onChange={(e) => setForm({ ...form, purchaseOrderId: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Vendor ID *</label>
                  <input
                    type="text"
                    value={form.vendorId}
                    onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Vendor Name</label>
                  <input
                    type="text"
                    value={form.vendorName}
                    onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Delivered Line Items & Batches</h4>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.8rem',
                    background: '#f1f5f9',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  + Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {form.items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr) auto',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Item ID *</label>
                      <input
                        type="text"
                        placeholder="INV-000001"
                        value={it.inventoryItemId}
                        onChange={(e) => handleItemChange(idx, 'inventoryItemId', e.target.value)}
                        style={{ width: '100%', padding: '0.35rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch # *</label>
                      <input
                        type="text"
                        value={it.batchNumber}
                        onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                        style={{ width: '100%', padding: '0.35rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expiry Date *</label>
                      <input
                        type="date"
                        value={it.expiryDate}
                        onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                        style={{ width: '100%', padding: '0.35rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Received / Accepted *</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                          type="number"
                          placeholder="Recv"
                          value={it.receivedQuantity}
                          onChange={(e) => handleItemChange(idx, 'receivedQuantity', Number(e.target.value))}
                          style={{ width: '50%', padding: '0.35rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                          min="1"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Acc"
                          value={it.acceptedQuantity}
                          onChange={(e) => handleItemChange(idx, 'acceptedQuantity', Number(e.target.value))}
                          style={{ width: '50%', padding: '0.35rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location *</label>
                      <select
                        value={it.locationId}
                        onChange={(e) => handleItemChange(idx, 'locationId', e.target.value)}
                        style={{ width: '100%', padding: '0.35rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                      >
                        <option value="LOC-MAIN-001">LOC-MAIN-001</option>
                        <option value="LOC-PHARM-001">LOC-PHARM-001</option>
                        <option value="LOC-COLD-001">LOC-COLD-001</option>
                        <option value="LOC-OT-001">LOC-OT-001</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      disabled={form.items.length <= 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: form.items.length <= 1 ? '#cbd5e1' : '#ef4444',
                        cursor: form.items.length <= 1 ? 'default' : 'pointer',
                        padding: '4px',
                        marginTop: '1rem'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
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
                  {submitting ? 'Registering...' : 'Complete Goods Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
