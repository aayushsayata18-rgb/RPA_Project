import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  RefreshCw,
  ListPlus,
  Layers
} from 'lucide-react';
import housekeepingService from '../../../services/housekeepingService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const HousekeepingChecklists = () => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    checklistCode: '',
    title: '',
    applicableAreaType: 'PATIENT_ROOM',
    taskType: 'DISCHARGE_TURNOVER',
    items: [
      { itemCode: 'LINEN', label: 'Strip and bag all soiled bed linens', mandatory: true },
      { itemCode: 'SURF', label: 'Disinfect all horizontal and high-touch surfaces', mandatory: true },
      { itemCode: 'MOP', label: 'Wet mop floor with hospital-grade disinfectant', mandatory: true }
    ]
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const res = await housekeepingService.listChecklists();
      if (res.data?.data) {
        setChecklists(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error('Failed to load checklists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { itemCode: `CHK-${formData.items.length + 1}`, label: '', mandatory: true }
      ]
    });
  };

  const handleRemoveItem = (index) => {
    const updated = formData.items.filter((_, idx) => idx !== index);
    setFormData({ ...formData, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await housekeepingService.createChecklist(formData);
      setShowModal(false);
      setFormData({
        checklistCode: '',
        title: '',
        applicableAreaType: 'PATIENT_ROOM',
        taskType: 'DISCHARGE_TURNOVER',
        items: [
          { itemCode: 'LINEN', label: 'Strip and bag all soiled bed linens', mandatory: true },
          { itemCode: 'SURF', label: 'Disinfect all horizontal and high-touch surfaces', mandatory: true }
        ]
      });
      await fetchChecklists();
    } catch (err) {
      console.error('Failed to save checklist:', err);
      alert(err.response?.data?.message || 'Failed to save checklist');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = checklists.filter((c) =>
    (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.checklistCode || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <CheckSquare className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Cleaning Checklists & Sanitation Standards
            </h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Standardized multi-step hygiene checklists enforcing infection prevention protocols.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchChecklists}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm border border-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            New Checklist Template
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by title or checklist code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-900/40 border border-gray-800 rounded-xl text-gray-500">
            No standardized cleaning checklists found.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              className="bg-gray-900/80 border border-gray-800 hover:border-indigo-500/40 rounded-xl p-5 backdrop-blur transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white text-base">
                    {item.title}
                  </span>
                  <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                    {item.checklistCode}
                  </span>
                </div>

                <div className="text-xs text-gray-400 mb-3 flex items-center gap-2">
                  <span>Area: {item.applicableAreaType}</span>
                  <span>•</span>
                  <span>Type: {item.taskType}</span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                    Checklist Steps ({(item.items || []).length})
                  </div>
                  {(item.items || []).slice(0, 4).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{step.label}</span>
                    </div>
                  ))}
                  {(item.items || []).length > 4 && (
                    <div className="text-[11px] text-gray-500 italic pl-5">
                      + {(item.items || []).length - 4} additional steps
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span>Status: Active</span>
                <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium">
                  Standard Template
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Template Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Cleaning Checklist Template"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Checklist Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CHK-DISCHARGE-01"
                value={formData.checklistCode}
                onChange={(e) => setFormData({ ...formData, checklistCode: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Applicable Area Type
              </label>
              <select
                value={formData.applicableAreaType}
                onChange={(e) => setFormData({ ...formData, applicableAreaType: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="PATIENT_ROOM">Patient Room</option>
                <option value="ICU">ICU</option>
                <option value="OPERATING_ROOM">Operating Room</option>
                <option value="CORRIDOR">Corridor</option>
                <option value="RESTROOM">Restroom</option>
                <option value="ALL">All Areas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Checklist Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Terminal Discharge Disinfection Protocol"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Checklist Items Designer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-300">
                Checklist Items & Criteria
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <ListPlus className="w-3.5 h-3.5" /> + Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-800/80 rounded-lg border border-gray-700">
                  <input
                    type="text"
                    required
                    placeholder="Describe cleaning action..."
                    value={item.label}
                    onChange={(e) => handleItemChange(idx, 'label', e.target.value)}
                    className="flex-1 bg-transparent border-none text-white text-xs focus:outline-none"
                  />
                  <label className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                    <input
                      type="checkbox"
                      checked={item.mandatory}
                      onChange={(e) => handleItemChange(idx, 'mandatory', e.target.checked)}
                      className="rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    Mandatory
                  </label>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-gray-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
            >
              {submitting ? 'Saving...' : 'Save Checklist'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HousekeepingChecklists;
