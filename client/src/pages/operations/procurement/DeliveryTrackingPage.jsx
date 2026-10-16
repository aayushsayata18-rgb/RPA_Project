import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCw,
  Calendar,
  Building,
  Package,
  CheckSquare,
  FileText,
  X,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import ProcurementService from '../../../services/procurementService';

export const DeliveryTrackingPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialPoFilter = searchParams.get('poNumber') || '';

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [poFilter, setPoFilter] = useState(initialPoFilter);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [checkingDelayed, setCheckingDelayed] = useState(false);

  // Status update modal
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('DELIVERED');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Create Delivery Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    poNumber: initialPoFilter || 'PO-2026-0001',
    carrier: 'BlueDart Express Healthcare Logistics',
    waybillNumber: 'BLUEDART-MED-9921',
    dispatchDate: new Date().toISOString().split('T')[0],
    estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    vehicleNumber: 'MH-12-QX-4040',
    driverContact: '+91 98765 43210',
    notes: 'Cold-chain shipment (2-8°C refrigerated van).'
  });

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (poFilter) params.poNumber = poFilter;

      const res = await ProcurementService.getDeliveries(params);
      if (res.data?.success && res.data?.data) {
        setDeliveries(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [search, statusFilter, poFilter]);

  const handleCheckDelayed = async () => {
    try {
      setCheckingDelayed(true);
      setError(null);
      const res = await ProcurementService.checkDelayedDeliveries();
      setSuccessMsg(
        `Automated delay scan complete. ${res.data?.delayedCount || 0} overdue deliveries flagged with exceptions.`
      );
      await fetchDeliveries();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delay scan failed');
    } finally {
      setCheckingDelayed(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDelivery) return;
    try {
      setUpdatingStatus(true);
      setError(null);
      await ProcurementService.updateDeliveryStatus(selectedDelivery._id || selectedDelivery.deliveryId, {
        status: newStatus,
        notes: statusNotes
      });
      setSuccessMsg(`Delivery ${selectedDelivery.deliveryId} updated to ${newStatus}.`);
      setShowStatusModal(false);
      setSelectedDelivery(null);
      setStatusNotes('');
      await fetchDeliveries();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update delivery status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.poNumber.trim() || !createForm.waybillNumber.trim()) {
      setError('PO Number and Waybill Number are required.');
      return;
    }
    try {
      setCreateSubmitting(true);
      setError(null);
      await ProcurementService.createDelivery(createForm);
      setSuccessMsg('Shipment record created successfully.');
      setShowCreateModal(false);
      await fetchDeliveries();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create delivery');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const getStatusBadge = (status, isDelayed) => {
    if (isDelayed || status === 'DELAYED') {
      return (
        <span className="badge badge-danger">
          <AlertTriangle size={12} className="mr-1" /> Overdue Delay
        </span>
      );
    }
    switch (status) {
      case 'DELIVERED':
        return <span className="badge badge-success"><CheckCircle size={12} className="mr-1" /> Delivered</span>;
      case 'IN_TRANSIT':
      case 'DISPATCHED':
        return <span className="badge badge-primary"><Truck size={12} className="mr-1" /> In Transit</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="badge badge-info"><Package size={12} className="mr-1" /> Out for Delivery</span>;
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
            <Truck className="text-primary" size={26} /> Delivery Tracking &amp; Shipment Monitor
          </h1>
          <p className="text-sm text-secondary">
            Waybill tracking, carrier coordination, and automated detection of supply delays.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCheckDelayed}
            disabled={checkingDelayed}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
          >
            <RotateCw className={checkingDelayed ? 'animate-spin' : ''} size={14} />
            {checkingDelayed ? 'Scanning Overdue...' : 'Scan Overdue Delays'}
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
            <Plus size={16} className="mr-1.5" /> Log Inbound Shipment
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
              placeholder="Search by Waybill #, delivery ID, or carrier..."
              className="input pl-9 pr-4 py-2 w-full text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {poFilter && (
            <button
              onClick={() => setPoFilter('')}
              className="btn btn-xs btn-outline text-secondary flex items-center gap-1"
            >
              Clear PO Filter: {poFilter} <X size={12} />
            </button>
          )}

          <select
            className="input py-2 px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="DELAYED">Delayed</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="card bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase text-secondary">
                <th className="py-3 px-4">Delivery Ref &amp; Waybill</th>
                <th className="py-3 px-4">Purchase Order</th>
                <th className="py-3 px-4">Carrier &amp; Transport</th>
                <th className="py-3 px-4">Est. Delivery Date</th>
                <th className="py-3 px-4 text-center">Delay Status</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-secondary">
                    <Clock className="animate-spin inline-block mr-2" size={20} /> Loading deliveries...
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-secondary">
                    No delivery records found matching filter.
                  </td>
                </tr>
              ) : (
                deliveries.map((d) => (
                  <tr key={d._id} className="hover:bg-subtle/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-main">{d.deliveryId}</div>
                      <div className="text-xs text-secondary font-mono flex items-center gap-1">
                        Waybill: <strong>{d.waybillNumber || 'PENDING'}</strong>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/operations/procurement/purchase-orders/${d.poNumber}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {d.poNumber}
                      </Link>
                      <div className="text-xs text-secondary">{d.vendorName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-main text-xs">{d.carrier || 'Direct Courier'}</div>
                      {d.vehicleNumber && (
                        <div className="text-[11px] text-secondary">Vehicle: {d.vehicleNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {new Date(d.estimatedDeliveryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {d.isDelayed || d.delayDays > 0 ? (
                        <span className="badge badge-danger text-xs font-bold">
                          +{d.delayDays || 1} Days Overdue
                        </span>
                      ) : (
                        <span className="text-xs text-success font-medium">On Schedule</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(d.status, d.isDelayed)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.status !== 'DELIVERED' ? (
                        <button
                          onClick={() => {
                            setSelectedDelivery(d);
                            setNewStatus('DELIVERED');
                            setShowStatusModal(true);
                          }}
                          className="btn btn-xs btn-outline"
                        >
                          Update Status
                        </button>
                      ) : (
                        <span className="text-xs text-success font-medium flex items-center justify-end gap-1">
                          <CheckCircle size={14} /> Received
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Update Delivery Status */}
      {showStatusModal && selectedDelivery && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h3 className="text-lg font-bold text-main flex items-center gap-2">
              <Truck className="text-primary" size={20} /> Update Delivery Status
            </h3>
            <p className="text-xs text-secondary">
              Delivery Ref: <strong>{selectedDelivery.deliveryId}</strong> (PO: {selectedDelivery.poNumber})
            </p>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Status</label>
              <select
                className="input w-full p-2 text-sm"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered (Arrival at Receiving Dock)</option>
                <option value="DELAYED">Delayed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Check-in Notes</label>
              <textarea
                rows={2}
                className="input w-full p-2 text-sm"
                placeholder="e.g., Arrived at Central Loading Dock. Cold-chain seal intact."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedDelivery(null);
                }}
                className="btn btn-outline"
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                className="btn btn-primary"
                disabled={updatingStatus}
              >
                {updatingStatus ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Log Inbound Shipment */}
      {showCreateModal && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card bg-surface max-w-md w-full p-6 rounded-2xl shadow-xl border border-border space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-main flex items-center gap-2">
                <Truck className="text-primary" size={20} /> Log Inbound Shipment
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
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">
                  PO Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input w-full p-2 text-sm"
                  placeholder="e.g., PO-2026-0001"
                  value={createForm.poNumber}
                  onChange={(e) => setCreateForm({ ...createForm, poNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">
                  Carrier / Logistics Provider <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input w-full p-2 text-sm"
                  value={createForm.carrier}
                  onChange={(e) => setCreateForm({ ...createForm, carrier: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">
                  Waybill / Tracking Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input w-full p-2 text-sm"
                  value={createForm.waybillNumber}
                  onChange={(e) => setCreateForm({ ...createForm, waybillNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    className="input w-full p-2 text-sm"
                    value={createForm.dispatchDate}
                    onChange={(e) => setCreateForm({ ...createForm, dispatchDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">
                    Est. Delivery Date
                  </label>
                  <input
                    type="date"
                    className="input w-full p-2 text-sm"
                    value={createForm.estimatedDeliveryDate}
                    onChange={(e) => setCreateForm({ ...createForm, estimatedDeliveryDate: e.target.value })}
                  />
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
                  {createSubmitting ? 'Logging...' : 'Log Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTrackingPage;
