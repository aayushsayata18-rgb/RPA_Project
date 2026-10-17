import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Bed, 
  ShieldCheck, 
  Edit3 
} from 'lucide-react';
import housekeepingService from '../../../services/housekeepingService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const HousekeepingAreas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({
    areaCode: '',
    name: '',
    areaType: 'PATIENT_ROOM',
    cleaningFrequency: 'DAILY',
    status: 'AVAILABLE',
    bedId: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const res = await housekeepingService.listAreas();
      if (res.data?.data) {
        setAreas(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error('Failed to load facility areas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const openCreateModal = () => {
    setEditingArea(null);
    setFormData({
      areaCode: '',
      name: '',
      areaType: 'PATIENT_ROOM',
      cleaningFrequency: 'DAILY',
      status: 'AVAILABLE',
      bedId: '',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (area) => {
    setEditingArea(area);
    setFormData({
      areaCode: area.areaCode || '',
      name: area.name || '',
      areaType: area.areaType || 'PATIENT_ROOM',
      cleaningFrequency: area.cleaningFrequency || 'DAILY',
      status: area.status || 'AVAILABLE',
      bedId: area.bedId || '',
      notes: area.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingArea) {
        await housekeepingService.updateArea(editingArea._id, formData);
      } else {
        await housekeepingService.createArea(formData);
      }
      setShowModal(false);
      await fetchAreas();
    } catch (err) {
      console.error('Failed to save area:', err);
      alert(err.response?.data?.message || 'Failed to save facility area');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (areaId, newStatus) => {
    try {
      await housekeepingService.updateAreaStatus(areaId, { status: newStatus });
      await fetchAreas();
    } catch (err) {
      console.error('Failed to update area status:', err);
    }
  };

  const filteredAreas = areas.filter((a) => {
    const matchesSearch = 
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.areaCode || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter ? a.areaType === typeFilter : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Layers className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Facility Areas & Location Directory
            </h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Configure hospital hygiene zones, patient rooms, operating suites, corridors, and isolation units.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAreas}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm border border-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            Register Area
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Area Name or Code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="">All Area Types</option>
          <option value="PATIENT_ROOM">Patient Room</option>
          <option value="ICU">ICU</option>
          <option value="OPERATING_ROOM">Operating Room</option>
          <option value="CORRIDOR">Corridor</option>
          <option value="RESTROOM">Restroom</option>
          <option value="EMERGENCY">Emergency Dept</option>
          <option value="CONSULTATION">Consultation Room</option>
        </select>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAreas.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-900/40 border border-gray-800 rounded-xl text-gray-500">
            No facility areas match your search criteria.
          </div>
        ) : (
          filteredAreas.map((area) => (
            <div
              key={area._id}
              className="bg-gray-900/80 border border-gray-800 hover:border-purple-500/40 rounded-xl p-5 backdrop-blur transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white text-base">
                    {area.name}
                  </span>
                  <StatusBadge status={area.status} />
                </div>

                <div className="text-xs text-purple-400 font-mono mb-2">
                  {area.areaCode}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <span>Type: {area.areaType}</span>
                  <span>•</span>
                  <span>Frequency: {area.cleaningFrequency}</span>
                </div>

                {area.notes && (
                  <div className="text-xs text-gray-400 bg-gray-800/60 p-2 rounded border border-gray-700/40 mb-3 line-clamp-2">
                    {area.notes}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <select
                  value={area.status}
                  onChange={(e) => handleStatusChange(area._id, e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="CLEANING_REQUIRED">Cleaning Required</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Maintenance Blocked</option>
                </select>

                <button
                  onClick={() => openEditModal(area)}
                  className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingArea ? `Edit Facility Area — ${editingArea.name}` : 'Register New Facility Area'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Area Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WARD-A-101"
                value={formData.areaCode}
                onChange={(e) => setFormData({ ...formData, areaCode: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Area Type *
              </label>
              <select
                value={formData.areaType}
                onChange={(e) => setFormData({ ...formData, areaType: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="PATIENT_ROOM">Patient Room</option>
                <option value="ICU">ICU</option>
                <option value="OPERATING_ROOM">Operating Room</option>
                <option value="CORRIDOR">Corridor</option>
                <option value="RESTROOM">Restroom</option>
                <option value="EMERGENCY">Emergency Dept</option>
                <option value="CONSULTATION">Consultation Room</option>
                <option value="OTHER">Other Common Area</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Area Display Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Inpatient Room 101 (Ward A)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Cleaning Frequency
              </label>
              <select
                value={formData.cleaningFrequency}
                onChange={(e) => setFormData({ ...formData, cleaningFrequency: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="HOURLY">Hourly</option>
                <option value="PER_SHIFT">Every Shift</option>
                <option value="DAILY">Daily</option>
                <option value="ON_DISCHARGE">On Patient Discharge</option>
                <option value="WEEKLY">Weekly Deep Clean</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Linked Bed Identifier (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. BED-101-A"
                value={formData.bedId}
                onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Hygiene Notes & Biohazard Isolation Details
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Negative pressure isolation suite with HEPA filtration."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-600/20"
            >
              {submitting ? 'Saving...' : editingArea ? 'Update Area' : 'Register Area'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HousekeepingAreas;
