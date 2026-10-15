import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge';
import { ManualAttendanceModal } from '../../components/attendance/ManualAttendanceModal';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Calendar,
  Upload,
  RefreshCw,
  FileText,
  UserX,
  AlertOctagon,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const AttendanceDashboardPage = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [metrics, setMetrics] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, recordsRes] = await Promise.all([
        attendanceService.getDashboardMetrics(date),
        attendanceService.getAttendanceList({ date, limit: 8 })
      ]);
      setMetrics(metricsRes.data?.kpi || {});
      setRecentRecords(recordsRes.data?.records || []);
    } catch (err) {
      console.error('Failed to load attendance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [date]);

  const kpis = [
    {
      title: 'Present Today',
      value: metrics?.presentToday ?? 0,
      icon: CheckCircle2,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)'
    },
    {
      title: 'Absent / Unreported',
      value: metrics?.absentToday ?? 0,
      icon: UserX,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)'
    },
    {
      title: 'Late Arrivals',
      value: metrics?.lateToday ?? 0,
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)'
    },
    {
      title: 'Missing Punches',
      value: metrics?.missingPunches ?? 0,
      icon: AlertOctagon,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.12)'
    },
    {
      title: 'On Approved Leave',
      value: metrics?.onLeave ?? 0,
      icon: Calendar,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.12)'
    },
    {
      title: 'Pending Corrections',
      value: metrics?.pendingCorrections ?? 0,
      icon: FileCheck,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.12)'
    },
    {
      title: 'Attendance Exceptions',
      value: metrics?.openExceptions ?? 0,
      icon: AlertTriangle,
      color: '#e11d48',
      bg: 'rgba(225, 29, 72, 0.12)'
    }
  ];

  return (
    <div className="portal-page" style={{ padding: '2rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            Attendance Management & Biometric Hub
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Multi-source biometric capture, shift reconciliation, automated exception routing, and audit logs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            onClick={fetchDashboardData}
            title="Refresh"
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              color: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            + Manual Entry
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="card"
              style={{
                padding: '1.25rem',
                borderRadius: '10px',
                background: 'var(--bg-card, #1e293b)',
                border: '1px solid var(--border-color, #334155)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>{kpi.title}</span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: kpi.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: kpi.color
                  }}
                >
                  <Icon style={{ width: '18px', height: '18px' }} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc' }}>
                {loading ? '...' : kpi.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Navigation Panels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <Link
          to="/attendance/daily"
          style={{
            textDecoration: 'none',
            padding: '1.25rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(30, 41, 59, 0.8))',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#f8fafc'
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#38bdf8' }}>Daily Roster & Punches</h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Inspect live punch timestamps and worked hours
            </p>
          </div>
          <ArrowRight style={{ width: '20px', height: '20px', color: '#38bdf8' }} />
        </Link>

        <Link
          to="/attendance/import"
          style={{
            textDecoration: 'none',
            padding: '1.25rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(30, 41, 59, 0.8))',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#f8fafc'
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#c084fc' }}>Biometric & CSV Import</h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Upload device punch files with row validations
            </p>
          </div>
          <Upload style={{ width: '20px', height: '20px', color: '#c084fc' }} />
        </Link>

        <Link
          to="/attendance/corrections"
          style={{
            textDecoration: 'none',
            padding: '1.25rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(30, 41, 59, 0.8))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#f8fafc'
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#fbbf24' }}>Correction Review Queue</h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Approve or reject employee dispute submissions
            </p>
          </div>
          <FileCheck style={{ width: '20px', height: '20px', color: '#fbbf24' }} />
        </Link>

        <Link
          to="/attendance/reconciliation"
          style={{
            textDecoration: 'none',
            padding: '1.25rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(30, 41, 59, 0.8))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#f8fafc'
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#34d399' }}>Roster Reconciliation</h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Reconcile punches against shifts, leaves and rules
            </p>
          </div>
          <RefreshCw style={{ width: '20px', height: '20px', color: '#34d399' }} />
        </Link>
      </div>

      {/* Recent Attendance Activity Table */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color, #334155)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Today's Recent Activity</h3>
          <Link
            to="/attendance/daily"
            style={{ fontSize: '0.85rem', color: '#38bdf8', textDecoration: 'none', fontWeight: '500' }}
          >
            View All Records &rarr;
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color, #334155)' }}>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Employee</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Department</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Check-In</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Check-Out</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Worked Hours</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Status</th>
                <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    No punch activity recorded for this date yet.
                  </td>
                </tr>
              ) : (
                recentRecords.map((rec) => (
                  <tr
                    key={rec._id || rec.attendanceId}
                    style={{ borderBottom: '1px solid var(--border-color, #334155)' }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc', fontWeight: '500' }}>
                      {rec.employeeId
                        ? `${rec.employeeId.firstName || ''} ${rec.employeeId.lastName || ''} (${rec.employeeId.employeeId || rec.employeeIdCode})`
                        : rec.employeeIdCode}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>
                      {rec.employeeId?.departmentName || 'Staff'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc' }}>
                      {rec.checkIn?.timestamp ? new Date(rec.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc' }}>
                      {rec.checkOut?.timestamp ? new Date(rec.checkOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc' }}>
                      {rec.workedMinutes > 0 ? `${(rec.workedMinutes / 60).toFixed(1)} hrs` : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <AttendanceStatusBadge status={rec.status} />
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <Link
                        to={`/attendance/${rec.attendanceId || rec._id}`}
                        style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '500' }}
                      >
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

      {showManualModal && (
        <ManualAttendanceModal
          onClose={() => setShowManualModal(false)}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default AttendanceDashboardPage;
