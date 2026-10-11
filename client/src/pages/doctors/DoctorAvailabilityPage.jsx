import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Clock,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  Users,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const DoctorAvailabilityPage = () => {
  const [availabilityList, setAvailabilityList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
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

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const params = { date: targetDate };
      if (selectedDept) params.departmentId = selectedDept;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/doctors/availability/dashboard', { params });
      if (res.data.success) {
        setAvailabilityList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load availability grid:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [targetDate, selectedDept, selectedStatus]);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock className="text-primary" /> Hospital Doctor Availability Grid
          </h1>
          <p className="page-subtitle">Real-time Daily Doctor Scheduling & Appointment Capacity (Section 46)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={fetchAvailability}>
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/admin/doctors" className="btn btn-secondary">
            <Users size={16} /> Directory
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Date</label>
            <input
              type="date"
              className="form-control"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '220px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Department</label>
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

          <div style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Status</label>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Availability Statuses</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="UNAVAILABLE">UNAVAILABLE</option>
              <option value="LEAVE">ON LEAVE</option>
              <option value="NOT_SCHEDULED">NOT SCHEDULED</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Availability Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw className="spinning" size={24} style={{ display: 'inline', marginRight: '8px' }} />
            Loading daily doctor availability...
          </div>
        ) : availabilityList.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Doctor ID</th>
                  <th>Doctor Name</th>
                  <th>Department</th>
                  <th>Specialization</th>
                  <th>Available Hours</th>
                  <th>Daily Status</th>
                  <th>Booked Patients</th>
                  <th>Remarks / Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {availabilityList.map((doc, idx) => (
                  <tr key={idx}>
                    <td>
                      <Link to={`/admin/doctors/${doc.doctorId}`} style={{ fontWeight: 600, color: '#38bdf8' }}>
                        {doc.doctorId}
                      </Link>
                    </td>
                    <td><strong>{doc.doctorName}</strong></td>
                    <td>
                      <span className="badge badge-secondary">{doc.departmentName || doc.departmentId}</span>
                    </td>
                    <td>{doc.specialty || '—'}</td>
                    <td>
                      {doc.availableFrom && doc.availableTo ? (
                        <code>{doc.availableFrom} - {doc.availableTo}</code>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Not Scheduled</span>
                      )}
                    </td>
                    <td><StatusBadge status={doc.status} /></td>
                    <td>
                      <span className="badge badge-info">{doc.appointmentCount} Booked</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.reason || '—'}</td>
                    <td>
                      <Link to={`/admin/doctors/${doc.doctorId}/schedule`} className="btn btn-secondary btn-sm">
                        <Calendar size={14} /> Schedule
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No doctor availability records found for selected date and department.
          </div>
        )}
      </div>
    </div>
  );
};
