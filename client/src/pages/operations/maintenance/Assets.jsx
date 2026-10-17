import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Search,
  Filter,
  PlusCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
  Building,
  CheckCircle,
  ExternalLink,
  Barcode
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import maintenanceService from '../../../services/maintenanceService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const Assets = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCriticality, setSelectedCriticality] = useState('');

  // Register Asset Modal State
  const [showModal, setShowModal] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    subcategory: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    criticality: 'MEDIUM',
    status: 'AVAILABLE',
    purchaseDate: '',
    warrantyEndDate: '',
    warrantyProvider: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getAssets({
        page,
        limit: 12,
        search,
        categoryId: selectedCategory,
        status: selectedStatus,
        criticality: selectedCriticality
      });
      setAssets(res.data?.items || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await maintenanceService.getCategories();
      setCategories(res.data?.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [page, selectedCategory, selectedStatus, selectedCriticality]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAssets();
  };

  // Check duplicate on blur of serialNumber
  const handleSerialNumberBlur = async () => {
    if (!formData.serialNumber) return;
    try {
      const res = await maintenanceService.checkDuplicates({ serialNumber: formData.serialNumber });
      if (res.data?.hasDuplicates) {
        setDuplicateWarning(res.data.data[0]);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {}
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await maintenanceService.createAsset(formData);
      setShowModal(false);
      setFormData({
        name: '',
        categoryId: '',
        subcategory: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        criticality: 'MEDIUM',
        status: 'AVAILABLE',
        purchaseDate: '',
        warrantyEndDate: '',
        warrantyProvider: '',
        notes: ''
      });
      setDuplicateWarning(null);
      fetchAssets();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to register asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="assets-page p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-blue-600" />
            Hospital Maintainable Asset Master
          </h1>
          <p className="text-sm text-gray-500">
            Authoritative registry of clinical, biomedical, facility, and IT infrastructure
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Register New Asset
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by asset tag, name, serial number, manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
            <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
            <option value="PENDING_INSPECTION">PENDING INSPECTION</option>
          </select>

          <select
            value={selectedCriticality}
            onChange={(e) => { setSelectedCriticality(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All Criticality</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <button
            onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedStatus(''); setSelectedCriticality(''); setPage(1); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Asset Tag / ID</th>
                <th className="py-3 px-4">Equipment Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Manufacturer & Model</th>
                <th className="py-3 px-4">Serial No.</th>
                <th className="py-3 px-4">Criticality</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">Loading assets...</td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">No assets match your search criteria.</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block">
                        {asset.assetTag}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{asset.assetId}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {asset.name}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {asset.categoryId?.name || 'General'}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      <div>{asset.manufacturer || '—'}</div>
                      <div className="text-[11px] text-gray-400">{asset.model || ''}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                      {asset.serialNumber || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        asset.criticality === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        asset.criticality === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        asset.criticality === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {asset.criticality}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={asset.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/operations/maintenance/assets/${asset._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Dossier
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex items-center justify-between text-xs text-gray-500">
          <span>Showing {assets.length} of {total} assets</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Register Asset */}
      {showModal && (
        <Modal
          title="Register Maintainable Asset"
          onClose={() => { setShowModal(false); setDuplicateWarning(null); }}
        >
          <form onSubmit={handleCreateAsset} className="space-y-4">
            {duplicateWarning && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Potential Duplicate Detected: </strong>
                  An existing asset with serial number <code>{duplicateWarning.serialNumber}</code> already exists:
                  <strong> {duplicateWarning.name}</strong> ({duplicateWarning.assetTag}).
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Philips Ultrasound EPIQ 7"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subcategory</label>
                <input
                  type="text"
                  placeholder="e.g. Diagnostic Sonography"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Philips"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  placeholder="e.g. EPIQ-7G"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-88910"
                  value={formData.serialNumber}
                  onBlur={handleSerialNumberBlur}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Administrative Criticality</label>
                <select
                  value={formData.criticality}
                  onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical (Life Support / Core Infrastructure)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_INSPECTION">PENDING INSPECTION</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Warranty End Date</label>
                <input
                  type="date"
                  value={formData.warrantyEndDate}
                  onChange={(e) => setFormData({ ...formData, warrantyEndDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Warranty Provider</label>
                <input
                  type="text"
                  placeholder="e.g. Philips India Service"
                  value={formData.warrantyProvider}
                  onChange={(e) => setFormData({ ...formData, warrantyProvider: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm"
              >
                {submitting ? 'Registering...' : 'Register Asset'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Assets;
