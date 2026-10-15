import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Upload,
  Info
} from 'lucide-react';
import leaveService from '../../services/leaveService';

export const LeaveRequestPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [warnings, setWarnings] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    dayType: 'FULL_DAY',
    partialStartTime: '14:00',
    partialEndTime: '17:00',
    reason: '',
    documentName: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [typesRes, balRes] = await Promise.all([
        leaveService.getLeaveTypes({ status: 'ACTIVE' }),
        leaveService.getMyBalances()
      ]);

      const types = typesRes.data?.leaveTypes || [];
      const bals = balRes.data?.balances || [];

      setLeaveTypes(types);
      setBalances(bals);

      if (types.length > 0) {
        setFormData(prev => ({ ...prev, leaveTypeId: types[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load leave types or balances:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedType = leaveTypes.find(t => t._id === formData.leaveTypeId);
  const selectedBalance = balances.find(b => b.leaveTypeId === formData.leaveTypeId || b.leaveTypeCode === selectedType?.code);

  // Compute duration estimate
  const computeEstimatedDuration = () => {
    if (!formData.startDate) return 0;
    if (formData.dayType === 'FIRST_HALF' || formData.dayType === 'SECOND_HALF') return 0.5;
    if (formData.dayType === 'PARTIAL_DAY') return 0.38;

    const end = formData.endDate || formData.startDate;
    const s = new Date(formData.startDate);
    const e = new Date(end);
    if (s > e) return 0;
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 1);
  };

  const estimatedDuration = computeEstimatedDuration();
  const availableBal = selectedBalance ? selectedBalance.available : 0;
  const remainingBal = selectedType?.balanceTracked ? Math.max(0, availableBal - estimatedDuration) : 'N/A';
  const isInsufficient = selectedType?.balanceTracked && availableBal < estimatedDuration;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setWarnings([]);

    if (!formData.startDate) {
      setErrorMsg('Please select a start date.');
      return;
    }
    const end = formData.endDate || formData.startDate;
    if (new Date(formData.startDate) > new Date(end)) {
      setErrorMsg('Start date cannot be after end date.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        leaveTypeId: formData.leaveTypeId,
        startDate: formData.startDate,
        endDate: end,
        dayType: formData.dayType,
        partialStartTime: formData.dayType === 'PARTIAL_DAY' ? formData.partialStartTime : null,
        partialEndTime: formData.dayType === 'PARTIAL_DAY' ? formData.partialEndTime : null,
        reason: formData.reason,
        documents: formData.documentName ? [{
          documentId: `DOC-${Date.now()}`,
          documentName: formData.documentName,
          documentType: 'MEDICAL_CERTIFICATE'
        }] : []
      };

      const res = await leaveService.createMyLeaveRequest(payload);
      if (res.data?.warnings?.length > 0) {
        setWarnings(res.data.warnings);
      }
      navigate('/leave/my-leave');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/leave/my-leave" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to My Leave
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          Apply for Leave
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Submit a new leave request according to applicable hospital workforce policy.
        </p>
      </div>

      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <strong>Policy Notice:</strong>
          <ul style={{ margin: '0.25rem 0 0 1rem' }}>
            {warnings.map((w, idx) => <li key={idx}>{w}</li>)}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Left Column: Form */}
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            {/* Leave Type */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Leave Type *</label>
              <select
                className="form-control"
                value={formData.leaveTypeId}
                onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                required
              >
                {leaveTypes.map(t => {
                  const b = balances.find(bal => bal.leaveTypeId === t._id || bal.leaveTypeCode === t.code);
                  return (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.code}) — {t.balanceTracked ? `${b ? b.available : 0} days available` : 'Not balance tracked'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Day Type */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Day Type</label>
              <select
                className="form-control"
                value={formData.dayType}
                onChange={(e) => setFormData({ ...formData, dayType: e.target.value })}
              >
                <option value="FULL_DAY">Full Day</option>
                {selectedType?.allowHalfDay && <option value="FIRST_HALF">First Half (Morning)</option>}
                {selectedType?.allowHalfDay && <option value="SECOND_HALF">Second Half (Afternoon)</option>}
                {selectedType?.allowPartialDay && <option value="PARTIAL_DAY">Partial Day (Hours)</option>}
              </select>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.startDate}
                  onChange={(e) => setFormData({
                    ...formData,
                    startDate: e.target.value,
                    endDate: (formData.dayType !== 'FULL_DAY' || !formData.endDate) ? e.target.value : formData.endDate
                  })}
                  required
                />
              </div>

              {formData.dayType === 'FULL_DAY' && (
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.endDate}
                    min={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>

            {/* Partial Time Inputs */}
            {formData.dayType === 'PARTIAL_DAY' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.partialStartTime}
                    onChange={(e) => setFormData({ ...formData, partialStartTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.partialEndTime}
                    onChange={(e) => setFormData({ ...formData, partialEndTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Reason for Absence *</label>
              <textarea
                className="form-control"
                rows={3}
                required
                placeholder="Provide a clear explanation for this leave request..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>

            {/* Document Upload */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Supporting Document (Optional / Required for Sick Leave &gt; 2 days)</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Medical_Certificate_Hospital.pdf"
                  value={formData.documentName}
                  onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                />
              </div>
              <small style={{ color: 'var(--text-muted)' }}>Centralized document storage reference will be attached to this leave request.</small>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || (isInsufficient && !selectedType?.negativeBalanceAllowed)}
                style={{ padding: '0.75rem 2rem', fontWeight: '600' }}
              >
                {submitting ? 'Submitting...' : 'Submit Leave Request'}
              </button>
              <Link to="/leave/my-leave" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Right Column: Real-Time Preview Card (Sec 54) */}
        <div>
          <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '1rem', borderTop: '4px solid #38bdf8' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={18} color="#38bdf8" /> Request Preview
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Leave Type:</span>
                <strong style={{ color: '#38bdf8' }}>{selectedType?.name || 'None'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Day Type:</span>
                <span>{formData.dayType.replace('_', ' ')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Requested Duration:</span>
                <strong style={{ fontSize: '1.1rem' }}>{estimatedDuration} days</strong>
              </div>

              <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Balance:</span>
                <span>{availableBal} days</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Remaining After Approval:</span>
                <strong style={{ fontSize: '1.15rem', color: isInsufficient ? '#f87171' : '#4ade80' }}>
                  {remainingBal} {typeof remainingBal === 'number' ? 'days' : ''}
                </strong>
              </div>

              {isInsufficient && (
                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #f87171', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  Requested days exceed your current available balance.
                </div>
              )}

              {selectedType?.requiresDocument && (
                <div style={{ padding: '0.75rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', borderRadius: 'var(--radius-md)', color: '#38bdf8', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Supporting documentation is required for this leave type.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestPage;
