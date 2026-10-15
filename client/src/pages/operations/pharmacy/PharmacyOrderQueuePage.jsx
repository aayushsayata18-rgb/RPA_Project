import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  PackageCheck,
  ShieldAlert,
  Calendar,
  X,
  RefreshCw,
  PauseCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import pharmacyService from '../../../services/pharmacyService';
import { useAuth } from '../../../context/AuthContext';

export const PharmacyOrderQueuePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters from query or state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isTodayOnly, setIsTodayOnly] = useState(searchParams.get('filter') === 'today');

  // Reservation Modal
  const [reservingOrder, setReservingOrder] = useState(null);
  const [reservingMedId, setReservingMedId] = useState('');
  const [reservingQty, setReservingQty] = useState(1);
  const [reservingLoading, setReservingLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await pharmacyService.getOrders({
        search: searchTerm,
        status: statusFilter,
        orderType: orderTypeFilter,
        priority: priorityFilter,
        isToday: isTodayOnly
      });
      if (res.data?.orders) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to load pharmacy orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load pharmacy orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, orderTypeFilter, priorityFilter, isTodayOnly]);

  const handleReserveStock = async (e) => {
    e.preventDefault();
    if (!reservingOrder || !reservingMedId) return;

    try {
      setReservingLoading(true);
      setError(null);
      await pharmacyService.reserveStock(reservingOrder.pharmacyOrderId, {
        medicineId: reservingMedId,
        quantity: reservingQty,
        selectionMethod: 'FEFO'
      });
      setSuccessMsg(`Stock reserved via FEFO for order '${reservingOrder.pharmacyOrderId}'.`);
      setReservingOrder(null);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Stock reservation failed.');
    } finally {
      setReservingLoading(false);
    }
  };

  const handleHoldOrder = async (orderId) => {
    const reason = window.prompt('Please provide a reason to place this order ON HOLD:');
    if (!reason) return;
    try {
      setError(null);
      await pharmacyService.holdOrder(orderId, reason);
      setSuccessMsg(`Order '${orderId}' placed ON HOLD.`);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Action failed.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Please provide cancellation reason:');
    if (!reason) return;
    try {
      setError(null);
      await pharmacyService.cancelOrder(orderId, reason);
      setSuccessMsg(`Order '${orderId}' cancelled.`);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Cancellation failed.');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'STAT':
      case 'EMERGENCY':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200">STAT / EMERGENCY</span>;
      case 'URGENT':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">URGENT</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">NORMAL</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">NEW</span>;
      case 'RECEIVED':
      case 'VALIDATING':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">VALIDATING</span>;
      case 'READY_FOR_DISPENSING':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">READY</span>;
      case 'PARTIALLY_FULFILLED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">PARTIAL</span>;
      case 'COMPLETED':
      case 'DISPENSED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">COMPLETED</span>;
      case 'ON_HOLD':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">ON HOLD</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Pharmacy Orders Queue</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage operational fulfillment, reserve physical stock, and dispatch to dispensing console.
          </p>
        </div>

        <button
          onClick={() => navigate('/operations/pharmacy/dispensing')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700 shadow-sm transition-all"
        >
          <PackageCheck className="w-4 h-4" />
          Go to Dispensing Console
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 font-bold">✕</button>
        </div>
      )}

      {/* Tab Filter Buttons (Section 21 Filters) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => {
            setStatusFilter('');
            setPriorityFilter('');
            setIsTodayOnly(false);
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            !statusFilter && !priorityFilter && !isTodayOnly
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Orders
        </button>

        <button
          onClick={() => {
            setIsTodayOnly(!isTodayOnly);
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            isTodayOnly ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Today Only
        </button>

        <button
          onClick={() => setStatusFilter('NEW')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            statusFilter === 'NEW' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          New Orders
        </button>

        <button
          onClick={() => setStatusFilter('VALIDATING')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            statusFilter === 'VALIDATING' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Pending Review
        </button>

        <button
          onClick={() => setStatusFilter('READY_FOR_DISPENSING')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            statusFilter === 'READY_FOR_DISPENSING' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Ready for Dispensing
        </button>

        <button
          onClick={() => setPriorityFilter('URGENT')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            priorityFilter === 'URGENT' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Urgent / Emergency
        </button>

        <button
          onClick={() => setStatusFilter('PARTIALLY_FULFILLED')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            statusFilter === 'PARTIALLY_FULFILLED' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Partially Fulfilled
        </button>

        <button
          onClick={() => setStatusFilter('ON_HOLD')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            statusFilter === 'ON_HOLD' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          On Hold
        </button>

        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            statusFilter === 'COMPLETED' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order ID, patient, doctor..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            <option value="">All Order Types</option>
            <option value="OUTPATIENT">OUTPATIENT</option>
            <option value="INPATIENT">INPATIENT</option>
            <option value="EMERGENCY">EMERGENCY</option>
            <option value="DISCHARGE_MEDICATION">DISCHARGE MEDICATION</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setOrderTypeFilter('');
              setPriorityFilter('');
              setIsTodayOnly(false);
            }}
            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Order Type</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Requested Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading pharmacy orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No orders found in queue.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.pharmacyOrderId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      <div>{ord.pharmacyOrderId}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Rx: {ord.prescriptionId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{ord.patientName || ord.patientId}</div>
                      <div className="text-xs text-slate-400">{ord.patientId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium text-slate-700">{ord.orderType}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{ord.doctorName || ord.doctorId}</div>
                    </td>
                    <td className="py-3 px-4">{getPriorityBadge(ord.priority)}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      <div>{new Date(ord.requestedAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(ord.requestedAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(ord.status)}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED' && (
                        <>
                          <button
                            onClick={() => {
                              setReservingOrder(ord);
                              setReservingMedId(ord.items[0]?.medicineId || '');
                              setReservingQty(ord.items[0]?.prescribedQuantity || 1);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded"
                          >
                            Reserve Stock
                          </button>

                          <button
                            onClick={() => navigate(`/operations/pharmacy/dispensing?orderId=${ord.pharmacyOrderId}`)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                          >
                            Dispense
                          </button>
                        </>
                      )}

                      {ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleHoldOrder(ord.pharmacyOrderId)}
                          className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-rose-700 rounded"
                          title="Hold"
                        >
                          Hold
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Reserve Stock */}
      {reservingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">Reserve Stock (FEFO)</h3>
              </div>
              <button onClick={() => setReservingOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleReserveStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Order Item</label>
                <select
                  value={reservingMedId}
                  onChange={(e) => {
                    setReservingMedId(e.target.value);
                    const it = reservingOrder.items.find((i) => i.medicineId === e.target.value);
                    if (it) setReservingQty(it.prescribedQuantity);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {reservingOrder.items.map((it) => (
                    <option key={it.medicineId} value={it.medicineId}>
                      {it.medicineName} — Prescribed: {it.prescribedQuantity} (Reserved: {it.reservedQuantity || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Reserve</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={reservingQty}
                  onChange={(e) => setReservingQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-1">
                <div className="font-bold">FEFO Batch Selection Active</div>
                <div>The system automatically selects the earliest expiring non-expired batch to minimize wastage.</div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReservingOrder(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reservingLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {reservingLoading ? 'Reserving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyOrderQueuePage;
