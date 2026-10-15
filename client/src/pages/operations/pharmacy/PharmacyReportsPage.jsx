import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  FileText,
  DollarSign,
  PackageCheck,
  RefreshCw,
  AlertCircle,
  Layers,
  Printer
} from 'lucide-react';
import pharmacyService from '../../../services/pharmacyService';
import { useAuth } from '../../../context/AuthContext';

export const PharmacyReportsPage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dispensingData, setDispensingData] = useState(null);
  const [ordersData, setOrdersData] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dispRes, ordRes] = await Promise.all([
        pharmacyService.getDispensingReport({}),
        pharmacyService.getOrdersReport({})
      ]);

      if (dispRes.data?.report) setDispensingData(dispRes.data.report);
      if (ordRes.data?.report) setOrdersData(ordRes.data.report);
    } catch (err) {
      console.error('Failed to load pharmacy reports:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-600" />
            <h1 className="text-2xl font-bold text-slate-900">Pharmacy Reports & Financial Analytics</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Section 77 Compliance: Operational volume, revenue aggregation, and medication consumption metrics.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Analytics
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
          Aggregating pharmacy records and financial metrics...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase">
                <span>Grand Dispensing Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-900 mt-2">
                ₹{Number(dispensingData?.grandTotalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-emerald-600 mt-1">Total billing charges posted to Billing module</div>
            </div>

            <div className="p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-blue-800 uppercase">
                <span>Dispensing Events</span>
                <PackageCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold text-blue-900 mt-2">
                {dispensingData?.totalDispensingTransactions || 0}
              </div>
              <div className="text-xs text-blue-600 mt-1">Completed dispensing transactions</div>
            </div>

            <div className="p-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-800 uppercase">
                <span>Total Pharmacy Orders</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-extrabold text-indigo-900 mt-2">
                {ordersData?.totalOrders || 0}
              </div>
              <div className="text-xs text-indigo-600 mt-1">Outpatient, Inpatient & Emergency orders</div>
            </div>
          </div>

          {/* Breakdown Grid: Medication Utilization & Orders by Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Medication-wise Dispensing Volume */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-800">
                Top Dispensed Medications (Volume & Revenue)
              </div>
              <div className="p-4 overflow-x-auto max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2">Medication Name</th>
                      <th className="p-2 text-right">Units Dispensed</th>
                      <th className="p-2 text-right">Billed Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dispensingData?.medicineStats && Object.keys(dispensingData.medicineStats).length > 0 ? (
                      Object.entries(dispensingData.medicineStats).map(([medName, stats]) => (
                        <tr key={medName} className="hover:bg-slate-50">
                          <td className="p-2 font-medium text-slate-900">{medName}</td>
                          <td className="p-2 text-right font-bold text-slate-700">{stats.quantity}</td>
                          <td className="p-2 text-right font-bold text-emerald-700">₹{stats.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="p-4 text-center text-slate-400">
                          No medication statistics recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Order Fulfillment Breakdown by Type */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-800">
                Orders Breakdown by Order Type
              </div>
              <div className="p-4 space-y-3">
                {ordersData?.typeBreakdown && Object.keys(ordersData.typeBreakdown).length > 0 ? (
                  Object.entries(ordersData.typeBreakdown).map(([type, count]) => {
                    const percentage = Math.round((count / (ordersData.totalOrders || 1)) * 100);
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-800">
                          <span>{type}</span>
                          <span>{count} orders ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">No order type data available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyReportsPage;
