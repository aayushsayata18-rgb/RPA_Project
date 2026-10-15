import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Filter,
  Plus,
  AlertCircle,
  CheckCircle,
  PackageCheck,
  ShieldAlert,
  Layers,
  Barcode,
  Calendar,
  X,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import pharmacyService from '../../../services/pharmacyService';
import { useAuth } from '../../../context/AuthContext';

export const MedicineCatalogPage = () => {
  const { user } = useAuth();

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [controlledFilter, setControlledFilter] = useState('');

  // Stock Availability Modal
  const [stockModalMedicine, setStockModalMedicine] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);

  // Add Medicine Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    genericName: '',
    brandName: '',
    strength: '',
    dosageForm: 'Tablet',
    unit: 'Tablet',
    unitPrice: 0,
    manufacturer: '',
    category: 'Analgesic',
    barcode: '',
    sku: '',
    prescriptionRequired: true,
    controlledMedicine: false,
    storageRequirements: 'Room Temperature',
    reorderLevel: 100
  });

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await pharmacyService.getMedicines({
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter,
        controlledMedicine: controlledFilter
      });
      if (res.data?.medicines) {
        setMedicines(res.data.medicines);
      }
    } catch (err) {
      console.error('Failed to load medicines:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load medicines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedicines();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, categoryFilter, statusFilter, controlledFilter]);

  const handleOpenStockModal = async (med) => {
    setStockModalMedicine(med);
    setLoadingStock(true);
    try {
      const res = await pharmacyService.getAvailability(med.medicineId);
      setStockData(res.data?.availability);
    } catch (err) {
      console.error('Failed to load stock availability:', err);
      setError('Could not load physical inventory availability.');
    } finally {
      setLoadingStock(false);
    }
  };

  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await pharmacyService.createMedicine(formData);
      setSuccessMsg(`Medicine '${res.data?.medicine?.genericName}' added successfully.`);
      setIsAddModalOpen(false);
      setFormData({
        genericName: '',
        brandName: '',
        strength: '',
        dosageForm: 'Tablet',
        unit: 'Tablet',
        unitPrice: 0,
        manufacturer: '',
        category: 'Analgesic',
        barcode: '',
        sku: '',
        prescriptionRequired: true,
        controlledMedicine: false,
        storageRequirements: 'Room Temperature',
        reorderLevel: 100
      });
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create medicine.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Medicine Master Catalog</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse and manage pharmaceutical catalog, barcode identifiers, controlled designations, and pricing.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Medicine
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

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search generic, brand, barcode, SKU..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="Analgesic">Analgesic</option>
            <option value="Antibiotic">Antibiotic</option>
            <option value="Antacid">Antacid</option>
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Antidiabetic">Antidiabetic</option>
            <option value="Antihistamine">Antihistamine</option>
          </select>

          <select
            value={controlledFilter}
            onChange={(e) => setControlledFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-indigo-500"
          >
            <option value="">Controlled: All</option>
            <option value="true">Controlled Only</option>
            <option value="false">Standard Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISCONTINUED">DISCONTINUED</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
              setStatusFilter('');
              setControlledFilter('');
            }}
            className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Medicine ID</th>
                <th className="py-3 px-4">Generic & Brand Name</th>
                <th className="py-3 px-4">Strength / Form</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Barcode / SKU</th>
                <th className="py-3 px-4">Flags</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading medicine catalog...
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No medicines match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                medicines.map((m) => (
                  <tr key={m.medicineId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{m.medicineId}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{m.genericName}</div>
                      {m.brandName && <div className="text-xs text-indigo-600 font-medium">{m.brandName}</div>}
                      <div className="text-[11px] text-slate-400">{m.manufacturer}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{m.strength}</span>
                      <span className="text-xs text-slate-500 ml-1.5">({m.dosageForm})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                        {m.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ₹{Number(m.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      <div>{m.barcode || '—'}</div>
                      <div className="text-[10px] text-slate-400">{m.sku}</div>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      {m.controlledMedicine && (
                        <div>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-800 border border-red-300">
                            CONTROLLED
                          </span>
                        </div>
                      )}
                      <div>
                        {m.status === 'ACTIVE' ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-800">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-100 text-rose-800">
                            {m.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenStockModal(m)}
                        className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Check Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Check Physical Inventory Batches & FEFO */}
      {stockModalMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">Physical Stock & FEFO Batches</h3>
              </div>
              <button
                onClick={() => setStockModalMedicine(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-base font-bold text-slate-900">{stockModalMedicine.genericName}</div>
              <div className="text-xs text-slate-500">
                {stockModalMedicine.medicineId} • {stockModalMedicine.strength} • {stockModalMedicine.dosageForm}
              </div>
            </div>

            {loadingStock ? (
              <div className="py-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                Querying Medical Inventory batches...
              </div>
            ) : stockData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-center">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Available Stock</div>
                    <div className="text-2xl font-extrabold text-emerald-600">{stockData.availableQuantity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Reserved Stock</div>
                    <div className="text-2xl font-extrabold text-amber-600">{stockData.reservedQuantity || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Active Batches</div>
                    <div className="text-2xl font-extrabold text-slate-800">{stockData.batches?.length || 0}</div>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-60 border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 font-semibold text-slate-700">
                      <tr>
                        <th className="p-2">Batch ID</th>
                        <th className="p-2">Lot Number</th>
                        <th className="p-2">Expiry Date (FEFO)</th>
                        <th className="p-2 text-right">Available Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stockData.batches?.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-slate-400">
                            No active batches found in inventory.
                          </td>
                        </tr>
                      ) : (
                        stockData.batches.map((b, idx) => (
                          <tr key={b.batchId} className={idx === 0 ? 'bg-emerald-50/40 font-medium' : ''}>
                            <td className="p-2 font-mono">{b.batchId} {idx === 0 && <span className="text-[10px] text-emerald-700 font-bold ml-1">(FEFO Priority)</span>}</td>
                            <td className="p-2">{b.lotNumber}</td>
                            <td className="p-2">
                              {new Date(b.expiryDate).toISOString().slice(0, 10)}
                              {b.isNearExpiry && <span className="text-[10px] text-amber-700 font-bold ml-1.5">[NEAR EXPIRY]</span>}
                            </td>
                            <td className="p-2 text-right font-bold text-slate-800">{b.availableQuantity}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setStockModalMedicine(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Medicine */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">Add Medicine to Catalog</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Paracetamol"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="e.g. Crocin"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Strength *</label>
                  <input
                    type="text"
                    required
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500 mg"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage Form *</label>
                  <select
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value, unit: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Cipla Ltd"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Analgesic"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="e.g. 890100000001"
                    className="w-full px-3 py-1.5 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. PCM500TAB"
                    className="w-full px-3 py-1.5 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Controlled / Restricted Substance</div>
                  <div className="text-[11px] text-slate-500">Requires supervisor double-authorization on dispense</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.controlledMedicine}
                  onChange={(e) => setFormData({ ...formData, controlledMedicine: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineCatalogPage;
