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
  Building,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  Send,
  Truck,
  RotateCcw,
  CheckSquare
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const PurchaseOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: 'VND-MED-001',
    vendorName: 'Apex Healthcare Diagnostics',
    vendorContactEmail: 'orders@apexmed.com',
    departmentId: 'DEP-LAB',
    expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deliveryAddress: 'Hospital Central Receiving Dock, Basement Level 1, Medical Store Depot',
    paymentTerms: 'NET_30',
    notes: 'Please attach batch quality analysis certificate with dispatch.',
    items: [
      {
        inventoryItemId: 'INV-LAB-101',
        itemName: 'Specimen Collection Tubes 10ml Pack',
        specification: 'Borosilicate Glass ISO 13485',
        quantityOrdered: 100,
        unit: 'PACK',
        unitPrice: 230,
        taxPercent: 12,
        discountPercent: 0
      }
    ]
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await ProcurementService.getPurchaseOrders(params);
      if (res.data?.success && res.data?.data) {
        setOrders(res.data.data);
        setTotal(res.data.total || res.data.data.length);
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendorName.trim()) {
      setError('Vendor name is required.');
      return;
    }
    try {
      setCreateSubmitting(true);
      setError(null);
      await ProcurementService.createPurchaseOrder(formData);
      setSuccessMsg('Purchase Order created successfully in DRAFT status.');
      setShowCreateModal(false);
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create PO');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          inventoryItemId: '',
          itemName: '',
          specification: '',
          quantityOrdered: 10,
          unit: 'UNIT',
          unitPrice: 100,
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
      case 'APPROVED':
        return <span className="badge badge-success"><CheckCircle size={12} className="mr-1" /> Approved</span>;
      case 'ISSUED':
        return <span className="badge badge-primary"><Send size={12} className="mr-1" /> Sent to Vendor</span>;
      case 'ACKNOWLEDGED':
        return <span className="badge badge-info"><CheckSquare size={12} className="mr-1" /> Acknowledged</span>;
      case 'PARTIALLY_DELIVERED':
        return <span className="badge badge-warning"><Truck size={12} className="mr-1" /> Partial Delivery</span>;
      case 'DELIVERED':
        return <span className="badge badge-success"><CheckCircle size={12} className="mr-1" /> Delivered</span>;
      case 'PENDING_APPROVAL':
        return <span className="badge badge-warning"><Clock size={12} className="mr-1" /> Pending Approval</span>;
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="page-container p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-main flex items-center gap-2">
            <FileText className="text-primary" size={26} /> Purchase Orders (PO)
          </h1>
          <p className="text-sm text-secondary">
            Binding commercial commitments, tier-level approvals, vendor transmission, and delivery tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/operations/procurement/deliveries" className="btn btn-outline btn-sm">
            <Truck size={16} className="mr-1.5" /> Track Deliveries
          </Link>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
            <Plus size={16} className="mr-1.5" /> Create Purchase Order
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
              placeholder="Search by PO #, vendor name, or ref..."
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
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="ISSUED">Sent to Vendor</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="card bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase text-secondary">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Total Net Amount</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4 text-center">Revisions</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-secondary">
                    <Clock className="animate-spin inline-block mr-2" size={20} /> Loading purchase orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-secondary">
                    No purchase orders found matching current filter.
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po._id} className="hover:bg-subtle/50">
                    <td className="py-3 px-4">
                      <Link
                        to={`/operations/procurement/purchase-orders/${po.poNumber}`}
                        className="font-bold text-primary hover:underline"
                      >
                        {po.poNumber}
                      </Link>
                      <div className="text-[11px] text-secondary">
                        Created {new Date(po.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-main">{po.vendorName}</div>
                      <div className="text-xs text-secondary">{po.vendorId}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="badge badge-neutral text-xs">
                        {po.items?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-main">
                      ₹{(po.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {po.revisionsCount > 0 ? (
                        <span className="badge badge-warning text-[11px]">
                          v{po.revisionsCount + 1}
                        </span>
                      ) : (
                        <span className="text-xs text-secondary">v1</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/operations/procurement/purchase-orders/${po.poNumber}`}
                        className="btn btn-xs btn-ghost text-primary"
                        title="View PO Details & Actions"
                      >
                        <Eye size={14} className="mr-1" /> View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Purchase Order */}
      {showCreateModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card bg-surface max-w-2xl w-full p-6 rounded-2xl shadow-xl border border-border space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-main flex items-center gap-2">
                <FileText className="text-primary" size={20} /> Issue New Purchase Order
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-sm btn-ghost"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
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
                    Vendor Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="input w-full p-2 text-sm"
                    value={formData.vendorContactEmail}
                    onChange={(e) => setFormData({ ...formData, vendorContactEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Expected Delivery Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="input w-full p-2 text-sm"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">Payment Terms</label>
                  <select
                    className="input w-full p-2 text-sm"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  >
                    <option value="NET_30">Net 30 Days</option>
                    <option value="NET_60">Net 60 Days</option>
                    <option value="ADVANCE">Advance Required</option>
                    <option value="ON_DELIVERY">Cash on Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">
                  Receiving Dock / Delivery Address
                </label>
                <input
                  type="text"
                  className="input w-full p-2 text-xs"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-secondary">Ordered Line Items</label>
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
                          value={item.quantityOrdered}
                          onChange={(e) => updateItemRow(i, 'quantityOrdered', parseFloat(e.target.value) || 1)}
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
                            ✕
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
                  {createSubmitting ? 'Creating PO...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrdersPage;
