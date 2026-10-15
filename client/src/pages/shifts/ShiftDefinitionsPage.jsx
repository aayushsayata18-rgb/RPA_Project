import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Moon,
  Sun,
  Edit,
  Archive,
  CheckCircle,
  Search,
  Filter,
  X
} from 'lucide-react';
import shiftService from '../../services/shiftService';

export const ShiftDefinitionsPage = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    shiftCode: '',
    shiftName: '',
    shiftType: 'GENERAL',
    startTime: '09:00',
    endTime: '18:00',
    crossesMidnight: false,
    breakMinutes: 60,
    graceBeforeMinutes: 30,
    graceAfterMinutes: 30,
    description: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, [search, statusFilter]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await shiftService.getDefinitions({ search, status: statusFilter });
      setShifts(res.data?.shifts || []);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (shift = null) => {
    setError('');
    if (shift) {
      setEditingShift(shift);
      setFormData({
        shiftCode: shift.shiftCode,
        shiftName: shift.shiftName,
        shiftType: shift.shiftType || 'GENERAL',
        startTime: shift.startTime,
        endTime: shift.endTime,
        crossesMidnight: Boolean(shift.crossesMidnight),
        breakMinutes: shift.breakMinutes || 60,
        graceBeforeMinutes: shift.graceBeforeMinutes || 30,
        graceAfterMinutes: shift.graceAfterMinutes || 30,
        description: shift.description || ''
      });
    } else {
      setEditingShift(null);
      setFormData({
        shiftCode: '',
        shiftName: '',
        shiftType: 'GENERAL',
        startTime: '09:00',
        endTime: '18:00',
        crossesMidnight: false,
        breakMinutes: 60,
        graceBeforeMinutes: 30,
        graceAfterMinutes: 30,
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingShift) {
        await shiftService.updateDefinition(editingShift._id, formData);
      } else {
        await shiftService.createDefinition(formData);
      }
      setShowModal(false);
      fetchShifts();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save shift definition');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (shift) => {
    if (!window.confirm(`Are you sure you want to archive '${shift.shiftCode}'? Historical records will remain intact.`)) {
      return;
    }
    try {
      await shiftService.archiveDefinition(shift._id);
      fetchShifts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to archive shift');
    }
  };

  return (
    <div className="portal-content" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            Shift Definitions Master
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Configure hospital shift windows, timings, cross-midnight rules, and break policies.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} />
          <span>New Shift Definition</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search shift code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', width: '100%' }}
          />
        </div>
        <div style={{ width: '200px' }}>
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* Shift Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(30, 41, 59, 0.7)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Code</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Shift Name</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Type</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Timing Window</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Cross-Midnight</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Break</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#94a3b8' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Loading shift definitions...
                </td>
              </tr>
            ) : shifts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No shift definitions found.
                </td>
              </tr>
            ) : (
              shifts.map((s) => (
                <tr key={s._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#38bdf8' }}>{s.shiftCode}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#f1f5f9' }}>{s.shiftName}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                    <span className="badge badge-secondary">{s.shiftType}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#f1f5f9' }}>
                    {s.startTime} &rarr; {s.endTime}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {s.crossesMidnight ? (
                      <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Moon size={12} /> Yes (+1d)
                      </span>
                    ) : (
                      <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Sun size={12} /> No
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>{s.breakMinutes}m</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleOpenModal(s)}
                        className="btn btn-sm btn-secondary"
                        title="Edit Definition"
                      >
                        <Edit size={14} />
                      </button>
                      {s.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleArchive(s)}
                          className="btn btn-sm btn-outline-danger"
                          title="Archive Definition"
                        >
                          <Archive size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Create / Edit */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '550px',
              padding: '1.75rem',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>
                {editingShift ? `Edit Shift '${editingShift.shiftCode}'` : 'Create New Shift Definition'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Shift Code *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    disabled={!!editingShift}
                    value={formData.shiftCode}
                    onChange={(e) => setFormData({ ...formData, shiftCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. MORNING"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Shift Type
                  </label>
                  <select
                    className="input-field"
                    value={formData.shiftType}
                    onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                  >
                    <option value="MORNING">MORNING</option>
                    <option value="GENERAL">GENERAL</option>
                    <option value="EVENING">EVENING</option>
                    <option value="NIGHT">NIGHT</option>
                    <option value="ROTATIONAL">ROTATIONAL</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Shift Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={formData.shiftName}
                  onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                  placeholder="e.g. Morning OPD Shift"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Start Time (HH:mm) *
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    End Time (HH:mm) *
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Break Duration (mins)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    value={formData.breakMinutes}
                    onChange={(e) => setFormData({ ...formData, breakMinutes: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#f1f5f9', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.crossesMidnight}
                      onChange={(e) => setFormData({ ...formData, crossesMidnight: e.target.checked })}
                    />
                    Crosses Midnight
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Description / Operational Notes
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details regarding coverage or requirements..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : editingShift ? 'Update Definition' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftDefinitionsPage;
