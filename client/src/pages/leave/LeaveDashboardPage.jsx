import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  FileText,
  PlusCircle,
  CheckCircle,
  Layers,
  ArrowRight,
  TrendingUp,
  XCircle,
  Briefcase
} from 'lucide-react';
import leaveService from '../../services/leaveService';

export const LeaveDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    pendingRequests: 0,
    approvedToday: 0,
    onLeaveToday: 0,
    upcomingLeave: 0,
    pendingCancellations: 0,
    openExceptions: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [requestsRes, deptRes, exceptionsRes] = await Promise.all([
        leaveService.getLeaveRequests({ limit: 8 }),
        leaveService.getDepartmentReport(),
        leaveService.getExceptionsReport()
      ]);

      const requests = requestsRes.data?.requests || [];
      const depts = deptRes.data?.departments || [];
      const exceptions = exceptionsRes.data?.exceptions || [];

      const pending = requests.filter(r => r.status === 'PENDING').length;
      const cancellations = requests.filter(r => r.status === 'CANCEL_REQUESTED').length;
      const totalOnLeave = depts.reduce((acc, d) => acc + (d.onLeaveToday || 0), 0);
      const totalUpcoming = depts.reduce((acc, d) => acc + (d.upcomingLeaveNext7Days || 0), 0);

      setMetrics({
        pendingRequests: pending,
        approvedToday: requests.filter(r => r.status === 'APPROVED').length,
        onLeaveToday: totalOnLeave,
        upcomingLeave: totalUpcoming,
        pendingCancellations: cancellations,
        openExceptions: exceptions.length
      });

      setRecentRequests(requests);
      setDepartmentStats(depts);
    } catch (err) {
      console.error('Failed to load leave dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-success">Approved</span>;
      case 'PENDING':
        return <span className="badge badge-warning">Pending Review</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Rejected</span>;
      case 'CANCEL_REQUESTED':
        return <span className="badge badge-warning">Cancel Requested</span>;
      case 'CANCELLED':
        return <span className="badge badge-secondary">Cancelled</span>;
      case 'WITHDRAWN':
        return <span className="badge badge-secondary">Withdrawn</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Leave Management & Workforce Leave Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Central administrative oversight for leave requests, policy configurations, balances, and shift reconciliations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/leave/request" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={18} /> Apply Leave
          </Link>
          <Link to="/leave/approvals" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} /> Approvals Queue ({metrics.pendingRequests})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Requests</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.5rem' }}>{metrics.pendingRequests}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting supervisor review</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>On Leave Today</span>
            <Users size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.5rem' }}>{metrics.onLeaveToday}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across hospital wards</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #4ade80' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upcoming Next 7 Days</span>
            <Calendar size={20} color="#4ade80" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.5rem' }}>{metrics.upcomingLeave}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved future leaves</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #c084fc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Cancellations</span>
            <XCircle size={20} color="#c084fc" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.5rem' }}>{metrics.pendingCancellations}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Balance reversal requests</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f87171' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Leave Exceptions</span>
            <AlertTriangle size={20} color="#f87171" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.5rem' }}>{metrics.openExceptions}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conflicts & punches on leave</span>
        </div>
      </div>

      {/* Main Grid: Recent Requests & Department Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Recent Requests Table */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Recent Leave Requests
            </h3>
            <Link to="/leave/approvals" style={{ color: '#38bdf8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading requests...</div>
          ) : recentRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No leave requests found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Request #</th>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map(req => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: '600' }}>{req.requestNumber}</td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{req.employeeName || req.employeeCode}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.departmentName || req.employeeCode}</div>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{req.leaveTypeCode}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                      </td>
                      <td>
                        <span style={{ fontWeight: '600' }}>{req.duration}</span> {req.unit?.toLowerCase() || 'days'}
                      </td>
                      <td>{getStatusBadge(req.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Department Leave Snapshot */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            Department Leave Snapshot
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {departmentStats.slice(0, 6).map((dept, idx) => (
              <div key={idx} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{dept.departmentName}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dept.totalActiveStaff} staff</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>On Leave Today: <strong style={{ color: dept.onLeaveToday > 0 ? '#38bdf8' : 'inherit' }}>{dept.onLeaveToday}</strong></span>
                  <span>Upcoming: <strong>{dept.upcomingLeaveNext7Days}</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/leave/calendar" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Calendar size={16} /> Department Leave Calendar
            </Link>
            <Link to="/leave/reports" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <FileText size={16} /> Leave Reports & Utilization
            </Link>
            <Link to="/leave/policies" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Briefcase size={16} /> Leave Policies & Entitlements
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveDashboardPage;
