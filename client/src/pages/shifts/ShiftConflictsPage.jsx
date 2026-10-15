import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  XCircle,
  HelpCircle
} from 'lucide-react';
import shiftService from '../../services/shiftService';

export const ShiftConflictsPage = () => {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [typeFilter, setTypeFilter] = useState('');
  const [resolvingConflict, setResolvingConflict] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchConflicts();
  }, [statusFilter, typeFilter]);

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const res = await shiftService.getConflicts({
        status: statusFilter,
        conflictType: typeFilter
      });
      setConflicts(res.data?.conflicts || []);
    } catch (err) {
      console.error('Failed to load conflicts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (dismiss = false) => {
    if (!resolvingConflict) return;
    setActionLoading(true);
    try {
      await shiftService.resolveConflict(resolvingConflict._id, {
        resolutionNotes,
        dismiss
      });
      setResolvingConflict(null);
      setResolutionNotes('');
      fetchConflicts();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to resolve conflict');
    } finally {
      setActionLoading(false);
    }
  };

  const getConflictBadgeColor = (type) => {
    switch (type) {
      case 'OVERLAPPING_SHIFT':
        return '#ef4444';
      case 'LEAVE_CONFLICT':
        return '#f97316';
      case 'INACTIVE_EMPLOYEE':
        return '#dc2626';
      case 'DEPARTMENT_CONFLICT':
        return '#f59e0b';
      case 'DUPLICATE_ASSIGNMENT':
        return '#e11d48';
      default:
        return '#64748b';
    }
  };

  return (
    <div className="portal-content" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={26} color="#ef4444" />
            <span>Shift Conflicts & Exception Resolution</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Automated conflict engine detection: overlaps, leave conflicts, duplicate shifts, and inactive employees.
          </p>
        </div>

        <button
          onClick={fetchConflicts}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '220px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Status
          </label>
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="DISMISSED">DISMISSED</option>
          </select>
        </div>

        <div style={{ width: '260px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Conflict Type
          </label>
          <select
            className="input-field"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Conflict Types</option>
            <option value="OVERLAPPING_SHIFT">OVERLAPPING_SHIFT</option>
            <option value="LEAVE_CONFLICT">LEAVE_CONFLICT</option>
            <option value="DEPARTMENT_CONFLICT">DEPARTMENT_CONFLICT</option>
            <option value="INACTIVE_EMPLOYEE">INACTIVE_EMPLOYEE</option>
            <option value="DUPLICATE_ASSIGNMENT">DUPLICATE_ASSIGNMENT</option>
          </select>
        </div>
      </div>

      {/* Conflict List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Checking conflict queue...
          </div>
        ) : conflicts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#10b981' }}>
            <CheckCircle2 size={36} style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>No Scheduling Conflicts Found</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              All shift assignments adhere to hospital workforce policies.
            </div>
          </div>
        ) : (
          conflicts.map((c) => (
            <div
              key={c._id}
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft: `5px solid ${getConflictBadgeColor(c.conflictType)}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      background: 'rgba(255,255,255,0.08)',
                      color: getConflictBadgeColor(c.conflictType)
                    }}
                  >
                    {c.conflictType}
                  </span>
                  <span className={`badge ${c.severity === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`}>
                    {c.severity}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    ID: {c.conflictId} • {c.date ? new Date(c.date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: '500' }}>
                  {c.description}
                </div>

                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                  Employee: <strong style={{ color: '#cbd5e1' }}>{c.employeeIdCode || 'N/A'}</strong>
                  {c.rosterId && (
                    <span> • Roster: <strong style={{ color: '#cbd5e1' }}>{c.rosterId.rosterName || c.rosterId}</strong></span>
                  )}
                  {c.resolutionNotes && (
                    <span style={{ marginLeft: '1rem', color: '#34d399' }}>
                      Resolution: {c.resolutionNotes}
                    </span>
                  )}
                </div>
              </div>

              {c.status === 'OPEN' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setResolvingConflict(c);
                      setResolutionNotes('Shift adjusted to remove overlap.');
                    }}
                    className="btn btn-sm btn-primary"
                  >
                    Resolve Conflict
                  </button>
                  <button
                    onClick={() => {
                      setResolvingConflict(c);
                      setResolutionNotes('Dismissed after supervisor review.');
                    }}
                    className="btn btn-sm btn-secondary"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {resolvingConflict && (
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
              maxWidth: '480px',
              padding: '1.5rem',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem', marginBottom: '0.75rem' }}>
              Resolve Conflict ({resolvingConflict.conflictId})
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
              {resolvingConflict.description}
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Resolution Action Notes *
              </label>
              <textarea
                className="input-field"
                rows={3}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain resolution (e.g. shift reassigned, authorized override)..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setResolvingConflict(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleResolve(true)}
                className="btn btn-warning"
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleResolve(false)}
                className="btn btn-primary"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftConflictsPage;
