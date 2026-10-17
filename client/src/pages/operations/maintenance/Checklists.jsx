import React, { useState, useEffect } from 'react';
import { Layers, PlusCircle, CheckSquare, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import maintenanceService from '../../../services/maintenanceService';
import { Modal } from '../../../components/common/Modal';

export const Checklists = () => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Checklist Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('BIOMEDICAL');
  const [items, setItems] = useState([
    { itemId: 'ITEM-01', description: '', required: true, responseType: 'PASS_FAIL' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getChecklists();
      setChecklists(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const handleAddItem = () => {
    const nextId = `ITEM-0${items.length + 1}`;
    setItems([...items, { itemId: nextId, description: '', required: true, responseType: 'PASS_FAIL' }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleCreateChecklist = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await maintenanceService.createChecklist({ name, category, items });
      setShowModal(false);
      setName('');
      setItems([{ itemId: 'ITEM-01', description: '', required: true, responseType: 'PASS_FAIL' }]);
      fetchChecklists();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create checklist');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checklists-page p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/operations/maintenance" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-sky-600" />
              Maintenance Checklists Master
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            Standard operating procedure checklists for inspections, preventive rounds, and safety certifications
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          New Checklist Template
        </button>
      </div>

      {/* Grid of Checklists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center col-span-3">Loading checklists...</p>
        ) : checklists.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center col-span-3">No checklist templates registered.</p>
        ) : (
          checklists.map((chk) => (
            <div key={chk._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                  {chk.checklistId}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">
                  {chk.category}
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900">{chk.name}</h3>

              <div className="space-y-1.5 pt-2 border-t text-xs">
                <div className="font-semibold text-gray-500 mb-1">Checklist Items ({chk.items?.length || 0}):</div>
                {chk.items?.slice(0, 4).map((i, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-gray-700">
                    <span className="text-emerald-500">✓</span>
                    <span className="line-clamp-1">{i.description}</span>
                  </div>
                ))}
                {(chk.items?.length || 0) > 4 && (
                  <div className="text-[11px] text-gray-400 italic">+{chk.items.length - 4} more items...</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Checklist */}
      {showModal && (
        <Modal title="Create Maintenance Checklist Template" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreateChecklist} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Template Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Electrical Safety Analyzer Inspection"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="BIOMEDICAL">BIOMEDICAL</option>
                <option value="HVAC">HVAC</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="FACILITY">FACILITY</option>
                <option value="IT">IT</option>
              </select>
            </div>

            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase">Inspection Steps</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Add Step
                </button>
              </div>

              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-400 w-12">{it.itemId}</span>
                  <input
                    type="text"
                    required
                    placeholder="Step instruction or check requirement..."
                    value={it.description}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].description = e.target.value;
                      setItems(updated);
                    }}
                    className="flex-1 px-3 py-1.5 border rounded text-xs"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
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
                className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg shadow-sm"
              >
                {submitting ? 'Creating...' : 'Save Template'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Checklists;
