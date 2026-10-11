import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Stethoscope,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  RefreshCw,
  UserPlus,
  ShieldAlert,
  Bot,
  ExternalLink
} from 'lucide-react';

export const DoctorDashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors/dashboard');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load doctor metrics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stethoscope className="text-primary" /> Doctor Master & Administration Hub
          </h1>
          <p className="page-subtitle">Module 11: Authoritative Administrative Doctor Directory & Schedules</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchMetrics}>
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/admin/doctors/new" className="btn btn-primary">
            <UserPlus size={16} /> Create Doctor
          </Link>
          <Link to="/admin/doctors" className="btn btn-secondary">
            <Users size={16} /> Directory
          </Link>
          <Link to="/admin/doctors/availability" className="btn btn-secondary">
            <Calendar size={16} /> Availability Grid
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Doctors</span>
            <Users size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>
            {loading ? '...' : metrics?.totalDoctors || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered administrative master</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Doctors</span>
            <CheckCircle size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#10b981' }}>
            {loading ? '...' : metrics?.activeDoctors || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently practicing & schedulable</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>On Leave</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#f59e0b' }}>
            {loading ? '...' : metrics?.onLeave || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Temporarily unavailable</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending Review</span>
            <AlertTriangle size={20} color="#a855f7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#a855f7' }}>
            {loading ? '...' : metrics?.pendingApproval || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting administrative approval</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Expiring Credentials</span>
            <ShieldAlert size={20} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#ef4444' }}>
            {loading ? '...' : metrics?.credentialExpiring || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Licenses expiring within 30 days</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Schedules</span>
            <Calendar size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem', color: '#6366f1' }}>
            {loading ? '...' : metrics?.totalSchedules || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configured recurring OPD shifts</span>
        </div>
      </div>

      {/* Credential Expiry Warning Alerts Banner */}
      {metrics?.expiringAlerts && metrics.expiringAlerts.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid #ef444440', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <ShieldAlert color="#ef4444" size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#ef4444' }}>Professional Credential Expiry Alerts</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Medical registrations requiring verification renewal (Section 45 & 78)
              </p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Doctor ID</th>
                  <th>Doctor Name</th>
                  <th>Department</th>
                  <th>Registration No.</th>
                  <th>Authority</th>
                  <th>Expiry Date</th>
                  <th>Days Remaining</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {metrics.expiringAlerts.map((alert, i) => (
                  <tr key={i}>
                    <td><code>{alert.doctorId}</code></td>
                    <td><strong>{alert.doctorName}</strong></td>
                    <td>{alert.departmentName || '—'}</td>
                    <td><code>{alert.registrationNumber}</code></td>
                    <td>{alert.registrationAuthority}</td>
                    <td>{alert.expiryDate ? new Date(alert.expiryDate).toLocaleDateString() : '—'}</td>
                    <td style={{ color: alert.daysRemaining <= 0 ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                      {alert.daysRemaining <= 0 ? 'EXPIRED' : `${alert.daysRemaining} days`}
                    </td>
                    <td><StatusBadge status={alert.status} /></td>
                    <td>
                      <Link to={`/admin/doctors/${alert.doctorId}`} className="btn btn-secondary btn-sm">
                        Review Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} className="text-primary" /> Master Doctor Directory
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Central administrative registry for doctor identities, professional qualifications, specializations, and employment status.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/admin/doctors" className="btn btn-primary btn-sm">
              View Doctor Directory
            </Link>
            <Link to="/admin/doctors/new" className="btn btn-secondary btn-sm">
              New Doctor Intake
            </Link>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} className="text-primary" /> Doctor Schedules & Availability
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Manage recurring OPD schedules, time exceptions, leave synchronization, and conflict-checked slot generation.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/admin/doctors/availability" className="btn btn-primary btn-sm">
              Doctor Availability Grid
            </Link>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={18} className="text-primary" /> RPA External Synchronization
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Automated synchronization with legacy Hospital Information Systems (HIS) with read-back verification and evidence capture.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/admin/rpa" className="btn btn-secondary btn-sm">
              View RPA Jobs <ExternalLink size={14} />
            </Link>
            <Link to="/admin/exceptions" className="btn btn-secondary btn-sm">
              Sync Exceptions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
