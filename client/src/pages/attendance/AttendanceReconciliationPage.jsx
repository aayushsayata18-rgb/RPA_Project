import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  AlertOctagon,
  Calendar,
  Filter,
  Eye,
  ExternalLink
} from 'lucide-react';

export const AttendanceReconciliationPage = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reconciling, setReconciling] = useState(false);
  const [reconciliationResult, setReconciliationResult] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getReconciliation({
        date,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        limit: 100
      });
      setRecords(res.data?.records || []);
    } catch (err) {
      console.error('Failed to load reconciliation records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [date, statusFilter]);

  const handleRunReconciliation = async () => {
    setReconciling(true);
    try {
      const res = await attendanceService.runReconciliation({ date });
      setReconciliationResult(res.data?.summary);
      fetchRecords();
    } catch (err) {
      console.error('Reconciliation execution failed:', err);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="portal-page" style={{ padding: '2rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            Attendance & Shift Reconciliation
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Automated reconciliation across biometric punches, approved shifts, rosters, and leave approvals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              color: '#f8fafc',
              fontSize: '0.875rem'
            }}
          />
          <button
            onClick={handleRunReconciliation}
            disabled={reconciling}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw className={reconciling ? 'spin' : ''} style={{ width: '16px', height: '16px' }} />
            {reconciling ? 'Reconciling...' : 'Run Reconciliation Engine'}
          </button>
        </div>
      </div>

      {/* Summary KPI Result Banner if triggered */}
      {reconciliationResult && (
        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: '10px',
            background: 'rgba(2, 132, 199, 0.1)',
            border: '1px solid rgba(2, 132, 199, 0.3)',
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Evaluated</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc' }}>
              {reconciliationResult.totalEvaluated}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Matched</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#10b981' }}>
              {reconciliationResult.matched}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Late Arrivals</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f59e0b' }}>
              {reconciliationResult.late}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Missing Punches</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ec4899' }}>
              {reconciliationResult.missingPunches}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Leave Conflicts</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ef4444' }}>
              {reconciliationResult.leaveConflicts}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Exceptions Created</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#e11d48' }}>
              {reconciliationResult.exceptionsRaised}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        className="card"
        style={{
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Filter by Outcome:</span>
        {[
          { key: 'ALL', label: 'All Records' },
          { key: 'MATCHED', label: 'Matched' },
          { key: 'MATCHED_WITH_LATE', label: 'Late Arrival' },
          { key: 'MISSING_PUNCH', label: 'Missing Punch' },
          { key: 'LEAVE_CONFLICT', label: 'Leave Conflict' },
          { key: 'UNRECONCILED', label: 'Unreconciled' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              background: statusFilter === tab.key ? '#0284c7' : 'transparent',
              color: statusFilter === tab.key ? '#ffffff' : '#94a3b8'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border-color, #334155)' }}>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Staff Member</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Department</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Check-In</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Check-Out</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Outcome Status</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Reconciliation Diagnosis</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Loading reconciliation outcomes...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No records match the current reconciliation filter.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id || r.attendanceId} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ color: '#f8fafc', fontWeight: '500' }}>
                        {r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : r.employeeIdCode}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {r.employeeId?.employeeId || r.employeeIdCode}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>
                      {r.employeeId?.departmentName || 'Staff'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc' }}>
                      {r.checkIn?.timestamp ? new Date(r.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc' }}>
                      {r.checkOut?.timestamp ? new Date(r.checkOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <AttendanceStatusBadge status={r.reconciliationStatus} />
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                      {r.reconciliationNotes || 'Standard shift alignment.'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                      <Link
                        to={`/attendance/${r.attendanceId || r._id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: '#38bdf8',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}
                      >
                        <Eye style={{ width: '14px', height: '14px' }} />
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReconciliationPage;
