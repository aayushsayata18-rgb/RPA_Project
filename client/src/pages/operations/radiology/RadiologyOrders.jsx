import React, { useState, useEffect } from 'react';
import radiologyService from '../../../services/radiologyService';
import { Search, Plus, Filter, AlertTriangle, CheckCircle, Clock, Calendar, XCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export const RadiologyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Place Order Modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [patientCode, setPatientCode] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [clinicalNote, setClinicalNote] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [allowOverride, setAllowOverride] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Cancel Order Modal
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await radiologyService.listOrders({
        search,
        status: statusFilter,
        priority: priorityFilter
      });
      if (res.data?.data) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await radiologyService.listExams({ status: 'ACTIVE' });
      if (res.data?.data) {
        setExams(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchExams();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  // Preflight Duplicate Check
  const handleExamChange = async (examId) => {
    setSelectedExamId(examId);
    setDuplicateWarning(null);
    if (!examId || !patientCode) return;

    try {
      const checkRes = await radiologyService.checkDuplicateOrder({
        patientCode: patientCode.trim(),
        examId
      });
      if (checkRes.data?.data?.isDuplicate) {
        setDuplicateWarning(checkRes.data.data);
      }
    } catch (err) {
      console.warn('Duplicate check check failed:', err);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      await radiologyService.createOrder({
        patientCode: patientCode.trim(),
        examId: selectedExamId,
        priority,
        clinicalNote,
        allowDuplicateOverride: allowOverride
      });

      setShowOrderModal(false);
      setPatientCode('');
      setSelectedExamId('');
      setClinicalNote('');
      setDuplicateWarning(null);
      setAllowOverride(false);
      fetchOrders();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    try {
      await radiologyService.cancelOrder(cancellingOrder._id, cancelReason);
      setCancellingOrder(null);
      setCancelReason('');
      fetchOrders();
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
            Radiology Orders Management
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Clinical requisitions, duplicate order detection, scheduling workflow and status tracking
          </p>
        </div>
        <button
          onClick={() => {
            setShowOrderModal(true);
            setModalError('');
            setDuplicateWarning(null);
          }}
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
          <Plus size={18} /> New Radiology Order
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ padding: '16px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Order ID, Patient Name, Patient ID..."
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
        >
          <option value="">All Statuses</option>
          <option value="ORDERED">Ordered</option>
          <option value="PENDING_SCHEDULING">Pending Scheduling</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PREPARATION_REQUIRED">Preparation Required</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="REPORT_PENDING">Report Pending</option>
          <option value="REPORT_READY">Report Ready</option>
          <option value="RELEASED">Released</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
        >
          <option value="">All Priorities</option>
          <option value="NORMAL">Normal</option>
          <option value="URGENT">Urgent</option>
          <option value="STAT">STAT (Emergency)</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>
              <th style={{ padding: '14px 16px' }}>Order ID</th>
              <th style={{ padding: '14px 16px' }}>Patient Details</th>
              <th style={{ padding: '14px 16px' }}>Examination</th>
              <th style={{ padding: '14px 16px' }}>Modality</th>
              <th style={{ padding: '14px 16px' }}>Priority</th>
              <th style={{ padding: '14px 16px' }}>Ordered On</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading radiology orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No radiology orders found.</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0284c7' }}>
                    {order.orderId}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{order.patientName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>PID: {order.patientCode}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{order.examNameSnapshot}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{order.examCodeSnapshot}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#eff6ff', color: '#1d4ed8' }}>
                      {order.modalityTypeSnapshot}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                      background: order.priority === 'STAT' ? '#fee2e2' : order.priority === 'URGENT' ? '#fef3c7' : '#f1f5f9',
                      color: order.priority === 'STAT' ? '#dc2626' : order.priority === 'URGENT' ? '#d97706' : '#475569'
                    }}>
                      {order.priority}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>
                    {new Date(order.orderDateTime).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                      background: order.status === 'RELEASED' ? '#dcfce7' : order.status === 'CANCELLED' ? '#fee2e2' : '#e0f2fe',
                      color: order.status === 'RELEASED' ? '#15803d' : order.status === 'CANCELLED' ? '#b91c1c' : '#0369a1'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {!['COMPLETED', 'RELEASED', 'CANCELLED'].includes(order.status) && (
                      <button
                        onClick={() => {
                          setCancellingOrder(order);
                          setCancelReason('');
                        }}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Place Order Modal */}
      {showOrderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '580px', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Place Radiology Examination Order</h3>
              <button onClick={() => setShowOrderModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <form onSubmit={handleCreateOrder} style={{ padding: '24px' }}>
              {modalError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', marginBottom: '16px', fontSize: '13px' }}>
                  {modalError}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Patient Code / ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P10001"
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Radiology Examination *</label>
                <select
                  required
                  value={selectedExamId}
                  onChange={(e) => handleExamChange(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                >
                  <option value="">-- Select Examination --</option>
                  {exams.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.code} - {ex.name} ({ex.modalityType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Duplicate Order Detection Warning Alert */}
              {duplicateWarning && (
                <div style={{ padding: '14px', borderRadius: '8px', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginBottom: '4px' }}>
                    <ShieldAlert size={18} color="#b45309" /> Potential Duplicate Order Detected
                  </div>
                  <p style={{ margin: '0 0 8px 0' }}>{duplicateWarning.message}</p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowOverride}
                      onChange={(e) => setAllowOverride(e.target.checked)}
                    />
                    Authorized Clinician Duplicate Override
                  </label>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Operational Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="URGENT">Urgent Priority</option>
                  <option value="STAT">STAT (Immediate Emergency)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Clinical Indication / Reason</label>
                <textarea
                  rows="3"
                  value={clinicalNote}
                  onChange={(e) => setClinicalNote(e.target.value)}
                  placeholder="Clinical history, symptoms, relevant lab results..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                  {submitting ? 'Placing Order...' : 'Submit Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '460px', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Cancel Radiology Order</h3>
            <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 16px 0' }}>
              Are you sure you want to cancel order <strong>{cancellingOrder.orderId}</strong> for patient <strong>{cancellingOrder.patientName}</strong>?
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Cancellation Reason *</label>
              <textarea
                rows="2"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                style={{ padding: '8px 18px', borderRadius: '8px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadiologyOrders;
