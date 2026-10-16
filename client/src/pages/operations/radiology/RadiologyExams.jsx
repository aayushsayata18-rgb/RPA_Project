import React, { useState, useEffect } from 'react';
import radiologyService from '../../../services/radiologyService';
import { Search, Plus, Filter, Edit, CheckCircle, XCircle, Clock, ShieldCheck, DollarSign } from 'lucide-react';

export const RadiologyExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'DIAGNOSTIC_XRAY',
    modalityType: 'X_RAY',
    bodyPart: '',
    description: '',
    preparationInstructions: '',
    fastingRequired: false,
    appointmentRequired: true,
    estimatedDurationMinutes: 30,
    turnaroundTimeMinutes: 120,
    priceReference: 100,
    status: 'ACTIVE'
  });
  const [error, setError] = useState('');

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await radiologyService.listExams({
        search,
        modalityType: modalityFilter,
        status: statusFilter
      });
      if (res.data?.data) {
        setExams(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [modalityFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExams();
  };

  const openCreateModal = () => {
    setEditingExam(null);
    setFormData({
      code: '',
      name: '',
      category: 'DIAGNOSTIC_XRAY',
      modalityType: 'X_RAY',
      bodyPart: '',
      description: '',
      preparationInstructions: '',
      fastingRequired: false,
      appointmentRequired: true,
      estimatedDurationMinutes: 30,
      turnaroundTimeMinutes: 120,
      priceReference: 100,
      status: 'ACTIVE'
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (exam) => {
    setEditingExam(exam);
    setFormData({
      code: exam.code,
      name: exam.name,
      category: exam.category,
      modalityType: exam.modalityType,
      bodyPart: exam.bodyPart || '',
      description: exam.description || '',
      preparationInstructions: exam.preparationInstructions || '',
      fastingRequired: exam.fastingRequired || false,
      appointmentRequired: exam.appointmentRequired !== undefined ? exam.appointmentRequired : true,
      estimatedDurationMinutes: exam.estimatedDurationMinutes || 30,
      turnaroundTimeMinutes: exam.turnaroundTimeMinutes || 120,
      priceReference: exam.priceReference || 0,
      status: exam.status || 'ACTIVE'
    });
    setError('');
    setShowModal(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingExam) {
        await radiologyService.updateExam(editingExam._id, formData);
      } else {
        await radiologyService.createExam(formData);
      }
      setShowModal(false);
      fetchExams();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save examination.');
    }
  };

  const handleToggleStatus = async (exam) => {
    const newStatus = exam.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await radiologyService.updateExamStatus(exam._id, newStatus);
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="portal-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Radiology Examination Catalog
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Master list of authorized diagnostic imaging exams, modalities, preparation instructions, and pricing
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
          <Plus size={18} /> Add Examination
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ padding: '16px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by code, exam name, body part..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
          <button type="submit" style={{ padding: '9px 16px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: '500' }}>
            Search
          </button>
        </form>

        <select
          value={modalityFilter}
          onChange={(e) => setModalityFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
        >
          <option value="">All Modalities</option>
          <option value="X_RAY">X-Ray</option>
          <option value="CT">Computed Tomography (CT)</option>
          <option value="MRI">Magnetic Resonance (MRI)</option>
          <option value="ULTRASOUND">Ultrasound</option>
          <option value="MAMMOGRAPHY">Mammography</option>
          <option value="PET_SCAN">PET Scan</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>
              <th style={{ padding: '14px 16px' }}>Code</th>
              <th style={{ padding: '14px 16px' }}>Examination Name</th>
              <th style={{ padding: '14px 16px' }}>Modality</th>
              <th style={{ padding: '14px 16px' }}>Body Part</th>
              <th style={{ padding: '14px 16px' }}>Duration & TAT</th>
              <th style={{ padding: '14px 16px' }}>Base Price</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Loading examinations...
                </td>
              </tr>
            ) : exams.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  No examinations found matching your criteria.
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0284c7' }}>{exam.code}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{exam.name}</div>
                    {exam.fastingRequired && (
                      <span style={{ fontSize: '11px', color: '#d97706', fontWeight: '600' }}>• Fasting Required</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#eff6ff', color: '#1d4ed8' }}>
                      {exam.modalityType}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>{exam.bodyPart || 'General'}</td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>
                    <div>Duration: {exam.estimatedDurationMinutes}m</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>TAT: {exam.turnaroundTimeMinutes}m</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                    ${exam.priceReference}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                      background: exam.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                      color: exam.status === 'ACTIVE' ? '#15803d' : '#b91c1c'
                    }}>
                      {exam.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => openEditModal(exam)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                        title="Edit Details"
                      >
                        <Edit size={14} color="#0284c7" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(exam)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                        title={exam.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {exam.status === 'ACTIVE' ? <XCircle size={14} color="#ef4444" /> : <CheckCircle size={14} color="#16a34a" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create/Edit Examination */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '640px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {editingExam ? 'Edit Examination' : 'Add New Radiology Examination'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>×</button>
            </div>

            <form onSubmit={handleSaveExam} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', marginBottom: '16px', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Exam Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingExam}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. RAD-CT-001"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', textTransform: 'uppercase' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Modality Type *</label>
                  <select
                    value={formData.modalityType}
                    onChange={(e) => setFormData({ ...formData, modalityType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="X_RAY">X-Ray</option>
                    <option value="CT">Computed Tomography (CT)</option>
                    <option value="MRI">Magnetic Resonance (MRI)</option>
                    <option value="ULTRASOUND">Ultrasound</option>
                    <option value="MAMMOGRAPHY">Mammography</option>
                    <option value="PET_SCAN">PET Scan</option>
                    <option value="FLUOROSCOPY">Fluoroscopy</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Examination Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. CT Head / Brain without Contrast"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Body Part / Region</label>
                  <input
                    type="text"
                    value={formData.bodyPart}
                    onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                    placeholder="e.g. Brain / Head"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Price Reference ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.priceReference}
                    onChange={(e) => setFormData({ ...formData, priceReference: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Est. Scan Duration (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    value={formData.estimatedDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Report TAT (Mins)</label>
                  <input
                    type="number"
                    min="15"
                    value={formData.turnaroundTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, turnaroundTimeMinutes: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Preparation Instructions</label>
                <textarea
                  rows="3"
                  value={formData.preparationInstructions}
                  onChange={(e) => setFormData({ ...formData, preparationInstructions: e.target.value })}
                  placeholder="Instructions communicated to patient (e.g. fasting, clothing requirements)..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.fastingRequired}
                    onChange={(e) => setFormData({ ...formData, fastingRequired: e.target.checked })}
                  />
                  Fasting Required Prior to Scan
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.appointmentRequired}
                    onChange={(e) => setFormData({ ...formData, appointmentRequired: e.target.checked })}
                  />
                  Appointment Slot Required
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
                  {editingExam ? 'Save Changes' : 'Create Examination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadiologyExams;
