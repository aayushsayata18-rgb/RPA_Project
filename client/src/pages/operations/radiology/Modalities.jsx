import React, { useState, useEffect } from 'react';
import radiologyService from '../../../services/radiologyService';
import { Radio, Plus, Settings, AlertTriangle, CheckCircle, Clock, MapPin, Wrench } from 'lucide-react';

export const Modalities = () => {
  const [modalities, setModalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingModality, setEditingModality] = useState(null);
  const [formData, setFormData] = useState({
    modalityId: '',
    name: '',
    type: 'CT',
    location: 'Radiology Pavilion, Ground Floor',
    room: '',
    manufacturer: '',
    model: '',
    serialReference: '',
    status: 'AVAILABLE',
    operatingHours: {
      start: '08:00',
      end: '20:00',
      slotDurationMinutes: 30,
      bufferMinutes: 10
    }
  });
  const [error, setError] = useState('');

  // Status Change Dialog
  const [statusDialog, setStatusDialog] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [affectedWarning, setAffectedWarning] = useState(null);

  const fetchModalities = async () => {
    setLoading(true);
    try {
      const res = await radiologyService.listModalities({
        type: typeFilter,
        status: statusFilter
      });
      if (res.data?.data) {
        setModalities(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch modalities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModalities();
  }, [typeFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingModality(null);
    setFormData({
      modalityId: '',
      name: '',
      type: 'CT',
      location: 'Radiology Pavilion, Ground Floor',
      room: '',
      manufacturer: '',
      model: '',
      serialReference: '',
      status: 'AVAILABLE',
      operatingHours: {
        start: '08:00',
        end: '20:00',
        slotDurationMinutes: 30,
        bufferMinutes: 10
      }
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (mod) => {
    setEditingModality(mod);
    setFormData({
      modalityId: mod.modalityId,
      name: mod.name,
      type: mod.type,
      location: mod.location || '',
      room: mod.room,
      manufacturer: mod.manufacturer || '',
      model: mod.model || '',
      serialReference: mod.serialReference || '',
      status: mod.status,
      operatingHours: {
        start: mod.operatingHours?.start || '08:00',
        end: mod.operatingHours?.end || '20:00',
        slotDurationMinutes: mod.operatingHours?.slotDurationMinutes || 30,
        bufferMinutes: mod.operatingHours?.bufferMinutes || 10
      }
    });
    setError('');
    setShowModal(true);
  };

  const handleSaveModality = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingModality) {
        await radiologyService.updateModality(editingModality._id, formData);
      } else {
        await radiologyService.createModality(formData);
      }
      setShowModal(false);
      fetchModalities();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save modality.');
    }
  };

  const handleStatusChangeSubmit = async () => {
    if (!statusDialog) return;
    try {
      const res = await radiologyService.updateModalityStatus(statusDialog.modality._id, {
        status: statusDialog.newStatus,
        reason: statusReason
      });

      if (res.data?.affectedBookingsCount > 0) {
        setAffectedWarning({
          count: res.data.affectedBookingsCount,
          bookings: res.data.affectedBookings
        });
      } else {
        setStatusDialog(null);
        fetchModalities();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
      case 'IN_USE': return { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' };
      case 'MAINTENANCE': return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      case 'OUT_OF_SERVICE':
      case 'DECOMMISSIONED': return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <div className="portal-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Radiology Modalities & Physical Equipment
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Imaging suite assignment, operating hours, operating status & maintenance governance
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} /> Register Modality
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
        >
          <option value="">All Modality Types</option>
          <option value="X_RAY">X-Ray Systems</option>
          <option value="CT">CT Scanners</option>
          <option value="MRI">MRI Systems</option>
          <option value="ULTRASOUND">Ultrasound Units</option>
          <option value="MAMMOGRAPHY">Mammography</option>
          <option value="PET_SCAN">PET Scan</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
        >
          <option value="">All Equipment Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="IN_USE">In Use</option>
          <option value="MAINTENANCE">Under Maintenance</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
        </select>
      </div>

      {/* Equipment Cards Grid */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading equipment...</div>
      ) : modalities.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No modalities registered.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {modalities.map((mod) => {
            const colors = getStatusColor(mod.status);
            return (
              <div
                key={mod._id}
                className="card"
                style={{
                  borderRadius: '14px',
                  background: '#fff',
                  border: `1px solid ${colors.border}`,
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7' }}>{mod.modalityId}</span>
                      <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '2px 0 0 0' }}>{mod.name}</h3>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                        {mod.manufacturer} • {mod.model || mod.type}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: colors.bg,
                        color: colors.text
                      }}
                    >
                      {mod.status}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '12px 0', margin: '14px 0', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', marginBottom: '6px' }}>
                      <MapPin size={15} color="#64748b" />
                      <span>{mod.room} ({mod.location})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                      <Clock size={15} color="#64748b" />
                      <span>{mod.operatingHours?.start} - {mod.operatingHours?.end} ({mod.operatingHours?.slotDurationMinutes}m slots + {mod.operatingHours?.bufferMinutes}m buffer)</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <select
                    value={mod.status}
                    onChange={(e) => {
                      setStatusDialog({
                        modality: mod,
                        newStatus: e.target.value
                      });
                      setStatusReason('');
                      setAffectedWarning(null);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      background: '#f8fafc',
                      fontWeight: '600'
                    }}
                  >
                    <option value="AVAILABLE">Mark Available</option>
                    <option value="IN_USE">Mark In Use</option>
                    <option value="MAINTENANCE">Put in Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>

                  <button
                    onClick={() => openEditModal(mod)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <Settings size={14} /> Configure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create/Edit Modality */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {editingModality ? 'Configure Modality' : 'Register Imaging Modality'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <form onSubmit={handleSaveModality} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', marginBottom: '16px', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Modality ID</label>
                  <input
                    type="text"
                    disabled={!!editingModality}
                    placeholder="e.g. MOD-CT-01 (Auto if empty)"
                    value={formData.modalityId}
                    onChange={(e) => setFormData({ ...formData, modalityId: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="X_RAY">X-Ray</option>
                    <option value="CT">Computed Tomography (CT)</option>
                    <option value="MRI">Magnetic Resonance (MRI)</option>
                    <option value="ULTRASOUND">Ultrasound</option>
                    <option value="MAMMOGRAPHY">Mammography</option>
                    <option value="PET_SCAN">PET Scan</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Somatom 128-Slice Multidetector CT"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Room / Suite *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CT Suite 1"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Radiology Wing, Ground Floor"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Operating Hours (Start - End)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="08:00"
                      value={formData.operatingHours.start}
                      onChange={(e) => setFormData({
                        ...formData,
                        operatingHours: { ...formData.operatingHours, start: e.target.value }
                      })}
                      style={{ width: '50%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                    <input
                      type="text"
                      placeholder="20:00"
                      value={formData.operatingHours.end}
                      onChange={(e) => setFormData({
                        ...formData,
                        operatingHours: { ...formData.operatingHours, end: e.target.value }
                      })}
                      style={{ width: '50%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Slot Duration (Mins)</label>
                  <input
                    type="number"
                    min="10"
                    value={formData.operatingHours.slotDurationMinutes}
                    onChange={(e) => setFormData({
                      ...formData,
                      operatingHours: { ...formData.operatingHours, slotDurationMinutes: Number(e.target.value) }
                    })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: '8px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                  {editingModality ? 'Save Changes' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Dialog */}
      {statusDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              Confirm Modality Status Change
            </h3>
            <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 16px 0' }}>
              Change status of <strong>{statusDialog.modality.name}</strong> to <strong style={{ color: '#0284c7' }}>{statusDialog.newStatus}</strong>?
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Reason / Notes</label>
              <textarea
                rows="2"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for taking unit offline or changing state..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            {affectedWarning && (
              <div style={{ padding: '12px', borderRadius: '8px', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <AlertTriangle size={16} /> Attention: {affectedWarning.count} active appointments affected!
                </div>
                Review scheduling exceptions to reschedule patients safely.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setStatusDialog(null);
                  fetchModalities();
                }}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleStatusChangeSubmit}
                style={{ padding: '8px 18px', borderRadius: '8px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Modalities;
