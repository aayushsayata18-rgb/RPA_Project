import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  PackageX,
  ShieldAlert,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';
import pharmacyService from '../../../services/pharmacyService';
import { useAuth } from '../../../context/AuthContext';

export const PharmacyAlertsPage = () => {
  const { user } = useAuth();

  const [nearExpiryBatches, setNearExpiryBatches] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('expiry'); // 'expiry' or 'out_of_stock'

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [expiryRes, outRes] = await Promise.all([
        pharmacyService.getNearExpiryReport(45),
        pharmacyService.getOutOfStockReport()
      ]);

      if (expiryRes.data?.batches) setNearExpiryBatches(expiryRes.data.batches);
      if (outRes.data?.items) setOutOfStockItems(outRes.data.items);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load pharmacy alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            <h1 className="text-2xl font-bold text-slate-900">Pharmacy Inventory Alerts & Safety Watch</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Section 25 & 26 Compliance: Near-expiry stock surveillance and stock-out alerts.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Alerts
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

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('expiry')}
          className={`pb-2.5 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'expiry'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Near-Expiry Batches (&lt;45 days)
          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">
            {nearExpiryBatches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('out_of_stock')}
          className={`pb-2.5 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'out_of_stock'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PackageX className="w-4 h-4" />
          Out-of-Stock Items
          <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-800">
            {outOfStockItems.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Near Expiry */}
      {activeTab === 'expiry' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-amber-50/60 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Batches listed below will expire soon. System FEFO policy prioritizes their dispensing before they expire.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Lot Number</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Days Left</th>
                  <th className="py-3 px-4 text-right">Available Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nearExpiryBatches.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      No batches are nearing expiry in the next 45 days.
                    </td>
                  </tr>
                ) : (
                  nearExpiryBatches.map((b) => {
                    const daysLeft = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={b.batchId} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">{b.batchId}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{b.medicineName}</td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-500">{b.lotNumber}</td>
                        <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                          {new Date(b.expiryDate).toISOString().slice(0, 10)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${daysLeft <= 15 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                            {daysLeft} days remaining
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{b.availableQuantity}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Out of Stock */}
      {activeTab === 'out_of_stock' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-rose-50/60 border-b border-rose-200 text-xs text-rose-900 flex items-center gap-2 font-medium">
            <PackageX className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              Medicines with zero physical inventory available. Requires procurement requisition through Medical Inventory (Module 18 & 19).
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Medicine ID</th>
                  <th className="py-3 px-4">Generic Name</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Strength / Form</th>
                  <th className="py-3 px-4">Reorder Level</th>
                  <th className="py-3 px-4 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outOfStockItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      All active catalog medicines have available stock.
                    </td>
                  </tr>
                ) : (
                  outOfStockItems.map((m) => (
                    <tr key={m.medicineId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{m.medicineId}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{m.genericName}</td>
                      <td className="py-3 px-4 text-xs text-indigo-600 font-medium">{m.brandName || '—'}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{m.strength} ({m.dosageForm})</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{m.reorderLevel} units</td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">0 OUT OF STOCK</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyAlertsPage;
