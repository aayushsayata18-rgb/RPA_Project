import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  UserPlus,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Eye
} from 'lucide-react';

export const DoctorListPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/doctors/departments');
      if (res.data.success) {
        setDepartments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load departments:', err.message);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedDept) params.departmentId = selectedDept;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/doctors', { params });
      if (res.data.success) {
        setDoctors(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [selectedDept, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const columns = [
    {
      header: 'Doctor ID',
      accessor: 'doctorId',
      render: (row) => (
        <Link to={`/admin/doctors/${row.doctorId}`} style={{ fontWeight: 600, color: '#38bdf8' }}>
          {row.doctorId}
        </Link>
      )
    },
    {
      header: 'Doctor Name',
      accessor: 'displayName',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.displayName || row.fullName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      )
    },
    {
      header: 'Specialization',
      accessor: 'specialty',
      render: (row) => row.specialty || (row.specializations && row.specializations[0]?.name) || '—'
    },
    {
      header: 'Department',
      accessor: 'departmentName',
      render: (row) => (
        <span className="badge badge-secondary">
          {row.departmentName || row.departmentId || 'General'}
        </span>
      )
    },
    {
      header: 'Doctor Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Availability',
      accessor: 'availabilityStatus',
      render: (row) => {
        const avl = row.availabilityStatus || (row.status === 'ACTIVE' ? 'AVAILABLE' : 'UNAVAILABLE');
        return <StatusBadge status={avl} />;
      }
    },
    {
      header: 'Registration',
      accessor: 'registrationDetails',
      render: (row) => {
        const reg = row.registrationDetails && row.registrationDetails[0];
        if (!reg) return <span style={{ color: 'var(--text-muted)' }}>Not Recorded</span>;
        return (
          <div style={{ fontSize: '0.8rem' }}>
            <code>{reg.registrationNumber}</code>
            <div><StatusBadge status={reg.status || 'VALID'} /></div>
          </div>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <Link to={`/admin/doctors/${row.doctorId}`} className="btn btn-secondary btn-sm" title="View Profile">
            <Eye size={14} /> View
          </Link>
          <Link to={`/admin/doctors/${row.doctorId}/schedule`} className="btn btn-secondary btn-sm" title="Manage Schedule">
            <Calendar size={14} /> Schedule
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users className="text-primary" /> Doctor Master Directory
          </h1>
          <p className="page-subtitle">Administrative Medical Staff Directory (Section 16 & 17)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchDoctors}>
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/admin/doctors/new" className="btn btn-primary">
            <UserPlus size={16} /> Add Doctor
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', display: 'flex', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Doctor ID, Name, Phone, Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, borderRadius: '0 4px 4px 0' }}
            >
              <Search size={16} />
            </button>
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-control"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_LEAVE">ON LEAVE</option>
              <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>

          {(searchTerm || selectedDept || selectedStatus) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('');
                setSelectedStatus('');
              }}
            >
              Clear Filters
            </button>
          )}
        </form>
      </div>

      {/* Doctor Master Data Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={doctors}
          emptyMessage="No doctors found matching criteria."
          loading={loading}
        />
      </div>
    </div>
  );
};
