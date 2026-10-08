import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Phone, Calendar, ArrowRight, PlusCircle, FileText, Activity } from 'lucide-react';
import { patientService } from '../../services/patientService';

export const PatientSearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPatients();
  }, [page, status]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await patientService.searchPatients({
        query: query.trim(),
        status: status || undefined,
        page,
        limit: 15
      });
      if (res?.data) {
        setPatients(res.data.patients || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to search patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Master Directory</h1>
          <p className="page-subtitle">Central Hospital Identity Repository • {total} Registered Master Identities</p>
        </div>
        <Link
          to="/front-desk/registration"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
        >
          <PlusCircle size={16} /> Fast Registration
        </Link>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-4" style={{ gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.25rem' }}>
              Search Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Patient ID (e.g. P10001), Full Name, Mobile Number, Email..."
              className="input text-sm"
            />
          </div>

          <div>
            <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.25rem' }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input text-sm"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TEMPORARY_EMERGENCY">Temporary Emergency</option>
              <option value="IDENTITY_PENDING">Identity Pending</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading ? <Activity size={16} className="animate-spin" /> : <Search size={16} />} Filter Directory
          </button>
        </form>
      </div>

      {/* Patient Directory Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Searching Patient Master...</div>
        ) : patients.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            No patient master records matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Permanent PID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Patient Name</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>DOB / Age</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Gender</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Mobile Number</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>City / State</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.patientId}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <strong style={{ color: '#38bdf8' }}>{p.patientId}</strong>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#f8fafc', fontWeight: 600 }}>
                      {p.fullName || `${p.firstName} ${p.lastName}`}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1' }}>
                      {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1' }}>{p.gender}</td>
                    <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1' }}>{p.mobile}</td>
                    <td style={{ padding: '1rem 1.25rem', color: '#94a3b8' }}>
                      {p.address?.city ? `${p.address.city}, ${p.address.state || ''}` : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background:
                            p.status === 'ACTIVE'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : p.status === 'TEMPORARY_EMERGENCY'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          color:
                            p.status === 'ACTIVE'
                              ? '#10b981'
                              : p.status === 'TEMPORARY_EMERGENCY'
                              ? '#f87171'
                              : '#fbbf24'
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/front-desk/patients/${p.patientId}`)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        View Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
