import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staffService';
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  UserX,
  Shield,
  RefreshCw,
  Plus,
  Search,
  Building,
  ArrowRight,
  Briefcase
} from 'lucide-react';

export const StaffDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    summary: {
      totalEmployees: 0,
      active: 0,
      onLeave: 0,
      pendingApproval: 0,
      suspended: 0,
      terminated: 0,
      accessPending: 0,
      syncFailures: 0
    },
    byDepartment: [],
    byEmployeeType: []
  });
  const [recentStaff, setRecentStaff] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, staffRes] = await Promise.all([
        staffService.getDashboardMetrics(),
        staffService.getEmployees({ limit: 6, sortBy: 'createdAt', sortOrder: -1 })
      ]);
      if (metricsRes.data) setMetrics(metricsRes.data);
      if (staffRes.employees) setRecentStaff(staffRes.employees);
    } catch (err) {
      console.error('Failed to load staff dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const summaryCards = [
    { label: 'Total Employees', value: metrics.summary?.totalEmployees || 0, icon: Users, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
    { label: 'Active Staff', value: metrics.summary?.active || 0, icon: UserCheck, color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)' },
    { label: 'Pending Approval', value: metrics.summary?.pendingApproval || 0, icon: Clock, color: '#facc15', bg: 'rgba(250, 204, 21, 0.12)' },
    { label: 'On Leave', value: metrics.summary?.onLeave || 0, icon: Briefcase, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' },
    { label: 'Access Requests Pending', value: metrics.summary?.accessPending || 0, icon: Shield, color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
    { label: 'Sync / Exceptions', value: metrics.summary?.syncFailures || 0, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' }
  ];

  const getStatusBadge = (status) => {
    const config = {
      ACTIVE: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80' },
      PENDING_APPROVAL: { bg: 'rgba(250, 204, 21, 0.15)', text: '#facc15' },
      ON_LEAVE: { bg: 'rgba(167, 139, 250, 0.15)', text: '#a78bfa' },
      SUSPENDED: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316' },
      TERMINATED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
      DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' }
    };
    const c = config[status] || { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' };
    return (
      <span style={{ background: c.bg, color: c.text, padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
        {status}
      </span>
    );
  };

  return (
    <div className="container-fluid py-4" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h3 mb-1" style={{ fontWeight: '700' }}>Staff Management & Master Administration</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Central administration directory, onboarding, department transfers, RBAC access provisioning, and staff lifecycle.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary d-flex align-items-center gap-1" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <Link to="/admin/staff/access-requests" className="btn btn-outline-info d-flex align-items-center gap-1">
            <Shield size={16} /> Access Requests
          </Link>
          <Link to="/administration/staff" className="btn btn-outline-primary d-flex align-items-center gap-1">
            <Search size={16} /> Employee Directory
          </Link>
          <Link to="/administration/staff/new" className="btn btn-primary d-flex align-items-center gap-1">
            <Plus size={16} /> Onboard Staff
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="col-12 col-sm-6 col-lg-4 col-xl-2">
              <div
                className="card h-100 p-3"
                style={{
                  background: 'var(--bg-card, #1e293b)',
                  border: '1px solid var(--border-color, #334155)',
                  borderRadius: '12px'
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)' }}>{card.label}</span>
                  <div style={{ background: card.bg, padding: '0.4rem', borderRadius: '8px', color: card.color }}>
                    <Icon size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: card.color }}>
                  {loading ? '...' : card.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row g-4 mb-4">
        {/* Department Breakdown */}
        <div className="col-12 col-lg-6">
          <div
            className="card h-100 p-3"
            style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '12px'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1rem', fontWeight: '600' }}>
                <Building size={18} className="text-info" /> Active Staff by Department
              </h5>
              <Link to="/administration/staff" className="text-decoration-none text-info" style={{ fontSize: '0.8rem' }}>
                View All
              </Link>
            </div>
            {metrics.byDepartment && metrics.byDepartment.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {metrics.byDepartment.slice(0, 6).map((dept, i) => (
                  <div
                    key={i}
                    className="d-flex justify-content-between align-items-center p-2 rounded"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <span style={{ fontSize: '0.875rem' }}>{dept.department}</span>
                    <span className="badge bg-secondary" style={{ fontSize: '0.8rem' }}>{dept.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-4 mb-0">No active department allocations recorded.</p>
            )}
          </div>
        </div>

        {/* Employee Role Breakdown */}
        <div className="col-12 col-lg-6">
          <div
            className="card h-100 p-3"
            style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '12px'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1rem', fontWeight: '600' }}>
                <Users size={18} className="text-warning" /> Staff Role Categories
              </h5>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Categorical Distribution</span>
            </div>
            {metrics.byEmployeeType && metrics.byEmployeeType.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {metrics.byEmployeeType.map((item, i) => (
                  <div
                    key={i}
                    className="p-2 rounded d-flex align-items-center gap-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color, #334155)',
                      minWidth: '150px'
                    }}
                  >
                    <Briefcase size={16} className="text-muted" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.employeeType}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{item.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-4 mb-0">No role categories available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Staff Members Table */}
      <div
        className="card p-3"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px'
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0" style={{ fontSize: '1rem', fontWeight: '600' }}>Recent Staff Registrations</h5>
          <Link to="/administration/staff" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
            Full Directory <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ color: 'var(--text-primary)' }}>
            <thead style={{ borderBottom: '2px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}>
              <tr>
                <th>Employee ID</th>
                <th>Staff Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Employment Type</th>
                <th>Status</th>
                <th>Access Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentStaff.length > 0 ? (
                recentStaff.map((emp) => (
                  <tr key={emp.employeeId}>
                    <td>
                      <span className="badge bg-dark border text-info font-monospace" style={{ fontSize: '0.85rem' }}>
                        {emp.employeeId}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{emp.displayName || `${emp.firstName} ${emp.lastName}`}</td>
                    <td>{emp.departmentAssignments?.[0]?.departmentName || 'Unassigned'}</td>
                    <td>{emp.designation}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.employmentType}</span>
                    </td>
                    <td>{getStatusBadge(emp.status)}</td>
                    <td>
                      <span className="badge bg-secondary" style={{ fontSize: '0.75rem' }}>
                        {emp.accessProvisioningStatus}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => navigate(`/administration/staff/${emp.employeeId}`)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    {loading ? 'Loading staff records...' : 'No staff records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;
