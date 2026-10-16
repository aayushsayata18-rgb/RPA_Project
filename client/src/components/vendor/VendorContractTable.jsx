import React, { useState } from 'react';
import { Award, FileText, CheckCircle2, RefreshCw, XCircle, Plus, Calendar, DollarSign } from 'lucide-react';
import vendorService from '../../services/vendorService';

export const VendorContractTable = ({ vendorId, contracts = [], onRefresh, canManage = true }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contractNumber: '',
    title: '',
    contractType: 'RATE_CONTRACT',
    startDate: '',
    endDate: '',
    value: '',
    currency: 'INR',
    renewalNoticeDays: 30,
    scope: '',
    terms: ''
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await vendorService.createContract(vendorId, {
        ...formData,
        value: Number(formData.value) || 0,
        renewalNoticeDays: Number(formData.renewalNoticeDays) || 30
      });
      setShowCreateModal(false);
      setFormData({
        contractNumber: '',
        title: '',
        contractType: 'RATE_CONTRACT',
        startDate: '',
        endDate: '',
        value: '',
        currency: 'INR',
        renewalNoticeDays: 30,
        scope: '',
        terms: ''
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contractId) => {
    if (!window.confirm('Approve and activate this contract?')) return;
    try {
      await vendorService.approveContract(vendorId, contractId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleRenew = async (contractId) => {
    const newEndDate = prompt('Enter new End Date (YYYY-MM-DD):');
    if (!newEndDate) return;
    const newValueStr = prompt('Enter renewed contract value (leave blank to keep current):');
    const newValue = newValueStr ? Number(newValueStr) : undefined;
    try {
      await vendorService.renewContract(vendorId, contractId, { newEndDate, newValue });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleTerminate = async (contractId) => {
    const reason = prompt('Enter contract termination justification:');
    if (!reason) return;
    try {
      await vendorService.terminateContract(vendorId, contractId, { reason });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Master Contracts & Rate Agreements ({contracts.length})
        </h4>
        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: 'none',
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} /> New Contract
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Contract Title & Number</th>
              <th style={{ padding: '0.75rem 1rem' }}>Type</th>
              <th style={{ padding: '0.75rem 1rem' }}>Validity Period</th>
              <th style={{ padding: '0.75rem 1rem' }}>Estimated Value</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              {canManage && <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No active or draft contracts on record.
                </td>
              </tr>
            ) : (
              contracts.map((c) => (
                <tr key={c.contractId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      #{c.contractNumber} (ID: {c.contractId})
                    </div>
                  </td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8'
                      }}
                    >
                      {c.contractType}
                    </span>
                  </td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Renewal notice: {c.renewalNoticeDays || 30} days
                    </div>
                  </td>
                  <td style={{ padding: '0.8rem 1rem', fontWeight: 600, color: '#10b981' }}>
                    {c.currency} {(c.value || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background:
                          c.status === 'ACTIVE'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : c.status === 'EXPIRING'
                            ? 'rgba(234, 179, 8, 0.15)'
                            : c.status === 'DRAFT'
                            ? 'rgba(148, 163, 184, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          c.status === 'ACTIVE'
                            ? '#10b981'
                            : c.status === 'EXPIRING'
                            ? '#eab308'
                            : c.status === 'DRAFT'
                            ? '#94a3b8'
                            : '#ef4444'
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  {canManage && (
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        {c.status === 'DRAFT' && (
                          <button
                            onClick={() => handleApprove(c.contractId)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                        )}
                        {['ACTIVE', 'EXPIRING'].includes(c.status) && (
                          <button
                            onClick={() => handleRenew(c.contractId)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(56, 189, 248, 0.4)',
                              background: 'rgba(56, 189, 248, 0.12)',
                              color: '#38bdf8',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            <RefreshCw size={13} /> Renew
                          </button>
                        )}
                        {['ACTIVE', 'EXPIRING', 'DRAFT'].includes(c.status) && (
                          <button
                            onClick={() => handleTerminate(c.contractId)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            <XCircle size={13} /> Terminate
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Contract Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Create Master Agreement / Contract</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Contract Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Consumables Framework"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Contract Type *
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="RATE_CONTRACT">RATE_CONTRACT</option>
                    <option value="SUPPLY">SUPPLY</option>
                    <option value="FRAMEWORK">FRAMEWORK</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="SERVICE">SERVICE</option>
                    <option value="EQUIPMENT">EQUIPMENT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Contract Number
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={formData.contractNumber}
                    onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Estimated Value (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000000"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Renewal Notice (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.renewalNoticeDays}
                    onChange={(e) => setFormData({ ...formData, renewalNoticeDays: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Scope of Work / Products Covered
                </label>
                <textarea
                  rows="2"
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#38bdf8', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Creating...' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
