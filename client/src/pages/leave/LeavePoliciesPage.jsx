import React, { useState, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Edit,
  History,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  UserCheck
} from 'lucide-react';
import leaveService from '../../services/leaveService';

export const LeavePoliciesPage = () => {
  const [loading, setLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [alertMsg, setAlertMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Form States
  const [typeForm, setTypeForm] = useState({
    code: '',
    name: '',
    description: '',
    unit: 'DAYS',
    allowHalfDay: true,
    allowPartialDay: false,
    requiresDocument: false,
    documentRequiredAfterDays: 0,
    isPaid: true
  });

  const [policyForm, setPolicyForm] = useState({
    leaveTypeId: '',
    policyCode: '',
    name: '',
    annualEntitlement: 14,
    accrualMethod: 'MONTHLY',
    accrualRate: 1.16,
    carryForwardAllowed: true,
    carryForwardLimit: 5,
    maximumBalance: 30,
    documentationRequiredAfterDays: 2
  });

  const [adjustForm, setAdjustForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    adjustmentAmount: 0,
    reason: ''
  });

  useEffect(() => {
    fetchPoliciesAndTypes();
  }, []);

  const fetchPoliciesAndTypes = async () => {
    try {
      setLoading(true);
      const [typesRes, policiesRes] = await Promise.all([
        leaveService.getLeaveTypes(),
        leaveService.getLeavePolicies()
      ]);
      setLeaveTypes(typesRes.data?.leaveTypes || []);
      setPolicies(policiesRes.data?.policies || []);
    } catch (err) {
      console.error('Failed to load policies/types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await leaveService.createLeaveType(typeForm);
      setAlertMsg({ type: 'success', text: `Leave Type '${typeForm.code}' created successfully.` });
      setShowTypeModal(false);
      fetchPoliciesAndTypes();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await leaveService.createLeavePolicy(policyForm);
      setAlertMsg({ type: 'success', text: `Leave policy created successfully.` });
      setShowPolicyModal(false);
      fetchPoliciesAndTypes();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await leaveService.adjustBalance(adjustForm);
      setAlertMsg({ type: 'success', text: `Employee leave balance adjusted and ledger updated.` });
      setShowAdjustModal(false);
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerAccrual = async () => {
    if (!window.confirm('Run monthly leave accrual for all eligible active staff?')) return;
    try {
      setActionLoading(true);
      const res = await leaveService.runAccrual({ frequency: 'MONTHLY' });
      setAlertMsg({ type: 'success', text: `Accrual completed: ${res.data?.accrualCount} records accrued (${res.data?.skippedCount} skipped/up-to-date).` });
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Leave Policies & Entitlements Configuration
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Configure hospital leave categories, annual entitlements, accrual rules, and carry-forward parameters.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleTriggerAccrual} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={16} /> Run Accrual Job
          </button>
          <button onClick={() => setShowAdjustModal(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={16} /> Manual Balance Adjustment
          </button>
          <button onClick={() => setShowTypeModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={16} /> Add Leave Type
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className={`alert alert-${alertMsg.type}`} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Leave Types Section */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Configured Leave Types
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {leaveTypes.map(t => (
            <div key={t._id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600', fontSize: '1rem' }}>{t.name}</span>
                <span className="badge badge-secondary">{t.code}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{t.description || 'No description provided.'}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', fontSize: '0.75rem' }}>
                <span className="badge badge-info">{t.unit}</span>
                {t.allowHalfDay && <span className="badge badge-success">Half-Day Allowed</span>}
                {t.requiresDocument && <span className="badge badge-warning">Doc Required</span>}
                {t.carryForwardAllowed && <span className="badge badge-secondary">Carry-Forward</span>}
                {t.isPaid ? <span className="badge badge-success">Paid</span> : <span className="badge badge-danger">Unpaid</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Versioned Policies Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Active & Versioned Leave Policies
          </h3>
          <button onClick={() => setShowPolicyModal(true)} className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <PlusCircle size={14} /> New Policy
          </button>
        </div>

        <div className="table-responsive">
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Policy Code</th>
                <th>Leave Type</th>
                <th>Version</th>
                <th>Annual Entitlement</th>
                <th>Accrual Method</th>
                <th>Carry Limit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {policies.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight: '600' }}>{p.policyCode}</td>
                  <td>{p.leaveTypeCode}</td>
                  <td><span className="badge badge-secondary">v{p.version}</span></td>
                  <td><strong>{p.annualEntitlement}</strong> days</td>
                  <td>{p.accrualMethod}</td>
                  <td>{p.carryForwardAllowed ? `${p.carryForwardLimit} days` : 'None'}</td>
                  <td>
                    {p.status === 'ACTIVE' ? <span className="badge badge-success">Active</span> : <span className="badge badge-secondary">{p.status}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Type Modal */}
      {showTypeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '450px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>Create New Leave Type</h3>
            <form onSubmit={handleCreateType}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Code *</label>
                <input type="text" className="form-control" required placeholder="e.g. BEREAVEMENT" value={typeForm.code} onChange={e => setTypeForm({ ...typeForm, code: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Name *</label>
                <input type="text" className="form-control" required placeholder="e.g. Bereavement Leave" value={typeForm.name} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Description</label>
                <input type="text" className="form-control" value={typeForm.description} onChange={e => setTypeForm({ ...typeForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <label><input type="checkbox" checked={typeForm.allowHalfDay} onChange={e => setTypeForm({ ...typeForm, allowHalfDay: e.target.checked })} /> Allow Half-Day</label>
                <label><input type="checkbox" checked={typeForm.requiresDocument} onChange={e => setTypeForm({ ...typeForm, requiresDocument: e.target.checked })} /> Require Document</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTypeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Create Type</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '450px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>Manual Balance Adjustment</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Authorized HR adjustment modifies the employee balance and appends an immutable transaction to the ledger.
            </p>
            <form onSubmit={handleAdjustBalance}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Employee ID *</label>
                <input type="text" className="form-control" required placeholder="e.g. EMP00125" value={adjustForm.employeeId} onChange={e => setAdjustForm({ ...adjustForm, employeeId: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Leave Type *</label>
                <select className="form-control" required value={adjustForm.leaveTypeId} onChange={e => setAdjustForm({ ...adjustForm, leaveTypeId: e.target.value })}>
                  <option value="">Select leave type</option>
                  {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.name} ({t.code})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Adjustment Amount (Signed Days) *</label>
                <input type="number" step="0.5" className="form-control" required placeholder="e.g. +2 or -1" value={adjustForm.adjustmentAmount} onChange={e => setAdjustForm({ ...adjustForm, adjustmentAmount: parseFloat(e.target.value) })} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Mandatory Audit Reason *</label>
                <textarea className="form-control" rows={2} required placeholder="State authorized HR justification..." value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Confirm Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavePoliciesPage;
