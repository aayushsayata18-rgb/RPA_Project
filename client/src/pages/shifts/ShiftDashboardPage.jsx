import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  Repeat,
  FileText,
  PlusCircle,
  CheckCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import shiftService from '../../services/shiftService';

export const ShiftDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeShifts: 0,
    rostersCount: 0,
    openConflicts: 0,
    pendingSwaps: 0,
    pendingChanges: 0,
    totalAssignments: 0
  });
  const [recentRosters, setRecentRosters] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [shiftsRes, rostersRes, conflictsRes, swapsRes, changesRes, assignsRes] = await Promise.all([
        shiftService.getDefinitions({ status: 'ACTIVE' }),
        shiftService.getRosters({ limit: 5 }),
        shiftService.getConflicts({ status: 'OPEN' }),
        shiftService.getSwapRequests({ status: 'PENDING_APPROVAL' }),
        shiftService.getChangeRequests({ status: 'PENDING_APPROVAL' }),
        shiftService.getAssignments({ limit: 1 })
      ]);

      setMetrics({
        activeShifts: shiftsRes.data?.total || shiftsRes.data?.shifts?.length || 0,
        rostersCount: rostersRes.data?.total || rostersRes.data?.rosters?.length || 0,
        openConflicts: conflictsRes.data?.count || 0,
        pendingSwaps: swapsRes.data?.total || swapsRes.data?.swaps?.length || 0,
        pendingChanges: changesRes.data?.total || changesRes.data?.requests?.length || 0,
        totalAssignments: assignsRes.data?.total || 0
      });

      setRecentRosters(rostersRes.data?.rosters || []);
      setConflicts(conflictsRes.data?.conflicts?.slice(0, 5) || []);
    } catch (err) {
      console.error('Failed to load shift dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return 'badge-success';
      case 'APPROVED':
        return 'badge-info';
      case 'PENDING_APPROVAL':
        return 'badge-warning';
      case 'LOCKED':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="portal-content" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            Workforce Shift & Scheduling Hub
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Hospital workforce scheduling, cross-midnight shift definitions, automated conflict tracking, and roster management.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            to="/shifts/rosters"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Calendar size={18} />
            <span>Roster Calendar</span>
          </Link>
          <Link
            to="/shifts/definitions"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={18} />
            <span>Shift Definitions</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Active Shift Types</span>
            <Clock size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginTop: '0.5rem' }}>
            {loading ? '...' : metrics.activeShifts}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Standard & Night definitions</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Rosters Managed</span>
            <Layers size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginTop: '0.5rem' }}>
            {loading ? '...' : metrics.rostersCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Departmental rosters</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Pending Approvals</span>
            <Repeat size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginTop: '0.5rem' }}>
            {loading ? '...' : metrics.pendingSwaps + metrics.pendingChanges}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
            {metrics.pendingSwaps} swaps, {metrics.pendingChanges} changes
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Open Conflicts</span>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginTop: '0.5rem' }}>
            {loading ? '...' : metrics.openConflicts}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Requires administrative review</span>
        </div>
      </div>

      {/* Main Content Split: Rosters & Conflicts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Recent Rosters Panel */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f8fafc', margin: 0 }}>
              Recent Department Rosters
            </h3>
            <Link to="/shifts/rosters" style={{ fontSize: '0.85rem', color: '#38bdf8', textDecoration: 'none' }}>
              View All Rosters &rarr;
            </Link>
          </div>

          {recentRosters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              No rosters created yet. Click "Shift Definitions" or "Roster Calendar" to begin.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentRosters.map((r) => (
                <div
                  key={r._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{r.rosterName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      {r.departmentId?.name || r.departmentCode} • {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge ${getStatusBadgeClass(r.status)}`}>{r.status}</span>
                    <Link
                      to={`/shifts/rosters?rosterId=${r.rosterId}`}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '0.25rem 0.6rem' }}
                    >
                      Open Grid
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conflict Alert Queue */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <span>Conflict Queue</span>
            </h3>
            <Link to="/shifts/conflicts" style={{ fontSize: '0.85rem', color: '#38bdf8', textDecoration: 'none' }}>
              Resolve ({metrics.openConflicts}) &rarr;
            </Link>
          </div>

          {conflicts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>
              <CheckCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
              <div>All schedules verified. No open conflicts detected.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {conflicts.map((c) => (
                <div
                  key={c._id}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '6px',
                    borderLeft: '3px solid #ef4444'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', color: '#fca5a5' }}>
                    <span>{c.conflictType}</span>
                    <span>{c.date ? new Date(c.date).toLocaleDateString() : ''}</span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#e2e8f0', marginTop: '0.25rem' }}>
                    {c.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftDashboardPage;
