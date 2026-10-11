import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staffService';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Building,
  UserCheck,
  Shield,
  Briefcase
} from 'lucide-react';

export const StaffListPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [employeeType, setEmployeeType] = useState('');
  const [employmentType, setEmploymentType] = useState('');

  const fetchEmployees = async (page = 1) => {
    setLoading(true);
    try {
      const res = await staffService.getEmployees({
        page,
        limit: pagination.limit,
        search,
        status,
        employeeType,
        employmentType
      });
      if (res.employees) {
        setEmployees(res.employees);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch employee list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1);
  }, [status, employeeType, employmentType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees(1);
  };

  const getStatusBadge = (st) => {
    const config = {
      ACTIVE: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80' },
      PENDING_APPROVAL: { bg: 'rgba(250, 204, 21, 0.15)', text: '#facc15' },
      ON_LEAVE: { bg: 'rgba(167, 139, 250, 0.15)', text: '#a78bfa' },
      SUSPENDED: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316' },
      TERMINATED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
      DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' }
    };
    const c = config[st] || { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' };
    return (
      <span style={{ background: c.bg, color: c.text, padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
        {st}
      </span>
    );
  };

  return (
    <div className="container-fluid py-4" style={{ color: 'var(--text-primary)' }}>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h3 mb-1" style={{ fontWeight: '700' }}>Staff & Administrative Employee Directory</h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
            Complete master list of hospital non-doctor staff across clinical, administrative, and operations departments.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/administration/staff/dashboard" className="btn btn-outline-secondary">
            Dashboard
          </Link>
          <Link to="/administration/staff/new" className="btn btn-primary d-flex align-items-center gap-1">
            <Plus size={16} /> Onboard Staff
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card p-3 mb-4"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px'
        }}
      >
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control bg-dark border-secondary text-white"
                placeholder="Search by Employee ID, Name, Phone, Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select bg-dark border-secondary text-white"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="ON_LEAVE">ON_LEAVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="TERMINATED">TERMINATED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select bg-dark border-secondary text-white"
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="BILLING">Billing</option>
              <option value="NURSE">Nurse</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="LAB_TECHNICIAN">Lab Tech</option>
              <option value="RADIOLOGY_TECHNICIAN">Radiology Tech</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="HR">HR</option>
              <option value="ADMINISTRATION">Administration</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select bg-dark border-secondary text-white"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
            >
              <option value="">All Employment</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="INTERN">Intern</option>
            </select>
          </div>

          <div className="col-6 col-md-2 d-flex gap-2">
            <button type="submit" className="btn btn-outline-primary flex-grow-1">
              Search
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setSearch('');
                setStatus('');
                setEmployeeType('');
                setEmploymentType('');
                fetchEmployees(1);
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </form>
      </div>

      {/* Staff Directory Table */}
      <div
        className="card p-3 mb-4"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px'
        }}
      >
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ color: 'var(--text-primary)' }}>
            <thead style={{ borderBottom: '2px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}>
              <tr>
                <th>Employee ID</th>
                <th>Staff Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Access</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.employeeId}>
                    <td>
                      <span className="badge bg-dark border text-info font-monospace" style={{ fontSize: '0.85rem' }}>
                        {emp.employeeId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{emp.displayName || `${emp.firstName} ${emp.lastName}`}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                    </td>
                    <td>
                      <span className="d-flex align-items-center gap-1">
                        <Building size={14} className="text-muted" />
                        {emp.departmentAssignments?.[0]?.departmentName || 'Unassigned'}
                      </span>
                    </td>
                    <td>{emp.designation}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.employmentType}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.phone}</span>
                    </td>
                    <td>{getStatusBadge(emp.status)}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.75rem',
                          background: emp.accessProvisioningStatus === 'PROVISIONED' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                          color: emp.accessProvisioningStatus === 'PROVISIONED' ? '#38bdf8' : '#94a3b8'
                        }}
                      >
                        {emp.accessProvisioningStatus}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
                        onClick={() => navigate(`/administration/staff/${emp.employeeId}`)}
                      >
                        <Eye size={14} /> View / Manage
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    {loading ? 'Loading staff records...' : 'No staff records matched the search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {employees.length} of {pagination.total} records (Page {pagination.page} of {pagination.totalPages})
            </span>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchEmployees(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchEmployees(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffListPage;
