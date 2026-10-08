import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  ArrowRight,
  ShieldCheck,
  User
} from 'lucide-react';
import { patientService } from '../../services/patientService';

export const RegistrationsListPage = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchRegistrations();
  }, [page, statusFilter, sourceFilter]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await patientService.listRegistrations({
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        page,
        limit: 20
      });
      if (res?.data) {
        setRegistrations(res.data.registrations || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registration Transactions Stream</h1>
          <p className="page-subtitle">Operations Portal • Real-Time Registration Intake & Audit Log</p>
        </div>
        <span
          style={{
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: 'rgba(2, 132, 199, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}
        >
          {total} Total Transactions
        </span>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
          <div>
            <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.25rem' }}>
              Registration Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input text-sm"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered (Success)</option>
              <option value="IDENTITY_VERIFICATION_REQUIRED">Identity Verification Required</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-secondary text-xs" style={{ display: 'block', marginBottom: '0.25rem' }}>
              Channel Source
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="input text-sm"
            >
              <option value="">All Channels</option>
              <option value="ONLINE_SELF_REGISTRATION">Online Self-Registration</option>
              <option value="FRONT_DESK">Front Desk Intake</option>
              <option value="EMERGENCY">Emergency Fast Intake</option>
              <option value="RPA_EXTERNAL">RPA Automated Ingestion</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('');
                setSourceFilter('');
                setPage(1);
              }}
              className="btn btn-secondary text-sm"
              style={{ width: '100%' }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading registrations...</div>
        ) : registrations.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            No registration transactions matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Registration ID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Patient ID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Visit ID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Channel Source</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Identity Match</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr
                    key={reg.registrationId}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <strong style={{ color: '#f8fafc' }}>{reg.registrationId}</strong>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <strong style={{ color: '#38bdf8' }}>{reg.patientId}</strong>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1' }}>
                      {reg.visitId}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>
                      {reg.source}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{ fontSize: '0.8rem', color: reg.identityMatchStatus === 'POSSIBLE_MATCH' ? '#fbbf24' : '#38bdf8' }}>
                        {reg.identityMatchStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background:
                            reg.status === 'REGISTERED'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : reg.status === 'IDENTITY_VERIFICATION_REQUIRED'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            reg.status === 'REGISTERED'
                              ? '#10b981'
                              : reg.status === 'IDENTITY_VERIFICATION_REQUIRED'
                              ? '#fbbf24'
                              : '#f87171'
                        }}
                      >
                        {reg.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                      {new Date(reg.createdAt).toLocaleString('en-GB')}
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
