import React, { useState, useEffect } from 'react';
import {
  Pill,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  PackageCheck,
  RotateCcw,
  Bot,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import pharmacyService from '../../../services/pharmacyService';
import { useAuth } from '../../../context/AuthContext';

export const PharmacyDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    readyOrders: 0,
    partialOrders: 0,
    dispensedToday: 0,
    pendingPrescriptions: 0,
    outOfStockItems: 0,
    nearExpiryItems: 0,
    pendingReturns: 0,
    activeRpaJobs: 0,
    openExceptions: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [nearExpiryBatches, setNearExpiryBatches] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [kpiRes, ordersRes, expiryRes] = await Promise.all([
        pharmacyService.getDashboardKPIs(),
        pharmacyService.getOrders({ limit: 8 }),
        pharmacyService.getNearExpiryReport(30)
      ]);

      if (kpiRes.data?.kpis) {
        setKpis(kpiRes.data.kpis);
      }
      if (ordersRes.data?.orders) {
        setRecentOrders(ordersRes.data.orders);
      }
      if (expiryRes.data?.batches) {
        setNearExpiryBatches(expiryRes.data.batches.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load pharmacy dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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
      default:
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <Pill className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pharmacy Operations Console</h1>
              <p className="text-sm text-slate-500">
                Outpatient & Inpatient Dispensing, FEFO Stock Reservation, Prescription Review & Billing Integration
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/operations/pharmacy/dispensing')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md transition-all hover:scale-[1.02]"
          >
            <PackageCheck className="w-4 h-4" />
            Open Dispensing Console
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Today's Orders */}
        <div
          onClick={() => navigate('/operations/pharmacy/orders?filter=today')}
          className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Today's Orders</span>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-900">{kpis.todayOrders}</span>
            <span className="text-xs text-blue-600">received</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div
          onClick={() => navigate('/operations/pharmacy/orders?status=VALIDATING')}
          className="p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-900">{kpis.pendingOrders}</span>
            <span className="text-xs text-amber-600">awaiting review</span>
          </div>
        </div>

        {/* Ready for Pickup */}
        <div
          onClick={() => navigate('/operations/pharmacy/orders?status=READY_FOR_DISPENSING')}
          className="p-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Ready for Dispensing</span>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-900">{kpis.readyOrders}</span>
            <span className="text-xs text-emerald-600">stock reserved</span>
          </div>
        </div>

        {/* Dispensed Today */}
        <div
          onClick={() => navigate('/operations/pharmacy/dispensing-history')}
          className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Dispensed Today</span>
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-900">{kpis.dispensedToday}</span>
            <span className="text-xs text-indigo-600">fulfilled</span>
          </div>
        </div>

        {/* Out of Stock & Alerts */}
        <div
          onClick={() => navigate('/operations/pharmacy/alerts')}
          className="p-4 bg-gradient-to-br from-rose-50 to-white border border-rose-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Stock Alerts</span>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-900">{kpis.outOfStockItems + kpis.nearExpiryItems}</span>
            <span className="text-xs text-rose-600">items need action</span>
          </div>
        </div>
      </div>

      {/* Quick Access Action Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <button
          onClick={() => navigate('/operations/pharmacy/medicines')}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group"
        >
          <Pill className="w-5 h-5 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-slate-800">Medicine Master</span>
          <span className="text-[11px] text-slate-500">20+ active catalog</span>
        </button>

        <button
          onClick={() => navigate('/operations/pharmacy/prescriptions')}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group"
        >
          <FileText className="w-5 h-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-slate-800">Prescriptions</span>
          <span className="text-[11px] text-slate-500">Review doctor orders</span>
        </button>

        <button
          onClick={() => navigate('/operations/pharmacy/orders')}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group"
        >
          <Layers className="w-5 h-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-slate-800">Order Queue</span>
          <span className="text-[11px] text-slate-500">50+ operational list</span>
        </button>

        <button
          onClick={() => navigate('/operations/pharmacy/dispensing')}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-400 hover:shadow-md transition-all group"
        >
          <PackageCheck className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-slate-800">Dispensing Console</span>
          <span className="text-[11px] text-slate-500">Barcode verify & bill</span>
        </button>

        <button
          onClick={() => navigate('/operations/pharmacy/returns')}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group"
        >
          <RotateCcw className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-slate-800">Pharmacy Returns</span>
          <span className="text-[11px] text-slate-500">Quarantine workflow</span>
        </button>

        <button
          onClick={() => navigate('/operations/pharmacy/reports')}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group"
        >
          <TrendingUp className="w-5 h-5 text-cyan-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-slate-800">Reports & KPIs</span>
          <span className="text-[11px] text-slate-500">Revenue & utilization</span>
        </button>
      </div>

      {/* Main Content Split: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Pharmacy Orders Queue */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-slate-700" />
              <h2 className="font-semibold text-slate-900">Active Pharmacy Orders Queue</h2>
            </div>
            <button
              onClick={() => navigate('/operations/pharmacy/orders')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View Full Queue ({kpis.todayOrders} total) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No active pharmacy orders found.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.pharmacyOrderId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{ord.pharmacyOrderId}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{ord.patientName || ord.patientId}</div>
                        <div className="text-xs text-slate-400">{ord.patientId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-slate-600">{ord.orderType}</span>
                      </td>
                      <td className="py-3 px-4">{getPriorityBadge(ord.priority)}</td>
                      <td className="py-3 px-4">{getStatusBadge(ord.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/operations/pharmacy/dispensing?orderId=${ord.pharmacyOrderId}`)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Near-Expiry Batches & Operational Notices */}
        <div className="space-y-6">
          {/* Near-Expiry Watchlist */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Near-Expiry Batches (&lt;30 days)
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {kpis.nearExpiryItems} items
              </span>
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {nearExpiryBatches.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">No batches expiring in next 30 days.</div>
              ) : (
                nearExpiryBatches.map((b) => (
                  <div key={b.batchId} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{b.medicineName}</div>
                      <div className="text-[11px] text-slate-500">
                        Batch: <span className="font-mono text-slate-700">{b.batchId}</span> ({b.lotNumber})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-700">{b.availableQuantity} left</div>
                      <div className="text-[11px] text-slate-400">
                        Exp: {new Date(b.expiryDate).toISOString().slice(0, 10)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <button
                onClick={() => navigate('/operations/pharmacy/alerts')}
                className="text-xs font-medium text-slate-600 hover:text-indigo-600"
              >
                View all inventory alerts &rarr;
              </button>
            </div>
          </div>

          {/* Clinical Safety & RPA Architecture Rule Note */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl shadow-md space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              Clinical Safety Boundary (Section 4)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Medicine selection, dosing, frequency, and substitution are clinical human decisions. System & RPA workers
              automate validation, stock reservation, and billing integration, but NEVER modify clinical prescriptions autonomously.
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px] text-slate-400">
              <span>System of Record: MongoDB</span>
              <span className="text-emerald-400 font-mono">FEFO Policy: ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboardPage;
