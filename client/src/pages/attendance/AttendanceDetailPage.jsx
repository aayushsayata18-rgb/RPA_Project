import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge';
import { CorrectionModal } from '../../components/attendance/CorrectionModal';
import {
  ArrowLeft,
  User,
  Clock,
  Calendar,
  History,
  FileCheck,
  AlertTriangle,
  Server,
  Edit,
  CheckCircle2
} from 'lucide-react';

export const AttendanceDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  const fetchRecord = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAttendanceById(id);
      setData(res.data?.attendance);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load attendance record details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  if (loading) {
    return (
      <div className="portal-page" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        Loading attendance details...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="portal-page" style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
        <p>{error || 'Attendance record not found.'}</p>
        <Link to="/attendance/daily" style={{ color: '#38bdf8', textDecoration: 'none' }}>
          &larr; Back to Daily Ledger
        </Link>
      </div>
    );
  }

  const emp = data.employeeId || {};

  return (
    <div className="portal-page" style={{ padding: '2rem' }}>
      {/* Top Breadcrumb & Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            to="/attendance/daily"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              color: '#f8fafc',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Attendance Dossier: {data.attendanceId}
              </h1>
              <AttendanceStatusBadge status={data.status} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
              Normalized Record for{' '}
              {new Date(data.attendanceDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={() => setShowCorrectionModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <Edit style={{ width: '16px', height: '16px' }} />
            Request Correction
          </button>
        </div>
      </div>

      {/* Grid: 3 Main Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        {/* Card 1: Staff Master Details */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            borderRadius: '12px',
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <User style={{ width: '20px', height: '20px', color: '#38bdf8' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Employee Master</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Staff ID:</span>
              <strong style={{ color: '#38bdf8' }}>{emp.employeeId || data.employeeIdCode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Full Name:</span>
              <span style={{ color: '#f8fafc', fontWeight: '500' }}>
                {emp.firstName ? `${emp.firstName} ${emp.lastName}` : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Department:</span>
              <span style={{ color: '#f8fafc' }}>{emp.departmentName || 'General Staff'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Designation:</span>
              <span style={{ color: '#f8fafc' }}>{emp.designation || 'Staff'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Status:</span>
              <span style={{ color: '#10b981', fontWeight: '600' }}>{emp.employmentStatus || 'ACTIVE'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Shift & Duration Computations */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            borderRadius: '12px',
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Clock style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Shift & Durations</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Shift Name:</span>
              <span style={{ color: '#f8fafc' }}>{data.shiftDetails?.shiftName || 'General Shift'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Scheduled Window:</span>
              <strong style={{ color: '#f8fafc' }}>
                {data.shiftDetails?.expectedStartTime || '09:00'} — {data.shiftDetails?.expectedEndTime || '18:00'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Late Minutes:</span>
              <span style={{ color: data.lateMinutes > 0 ? '#f59e0b' : '#94a3b8', fontWeight: '600' }}>
                {data.lateMinutes > 0 ? `${data.lateMinutes} mins late` : 'On time'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Early Departure:</span>
              <span style={{ color: data.earlyDepartureMinutes > 0 ? '#f59e0b' : '#94a3b8' }}>
                {data.earlyDepartureMinutes > 0 ? `${data.earlyDepartureMinutes} mins` : 'None'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Worked Hours:</span>
              <strong style={{ color: '#10b981', fontSize: '1rem' }}>
                {data.workedMinutes > 0 ? `${(data.workedMinutes / 60).toFixed(2)} hrs` : '0 hrs'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Potential Overtime:</span>
              <span style={{ color: data.overtimeMinutes > 0 ? '#ec4899' : '#94a3b8' }}>
                {data.overtimeMinutes > 0 ? `${(data.overtimeMinutes / 60).toFixed(1)} hrs candidate` : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Ingestion Source & Telemetry */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            borderRadius: '12px',
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Server style={{ width: '20px', height: '20px', color: '#a855f7' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Punches & Source Telemetry</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Check-In Punch:</span>
              <strong style={{ color: '#f8fafc' }}>
                {data.checkIn?.timestamp ? new Date(data.checkIn.timestamp).toLocaleTimeString() : 'Missing'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Check-In Device:</span>
              <span style={{ color: '#64748b' }}>{data.checkIn?.deviceId || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Check-Out Punch:</span>
              <strong style={{ color: '#f8fafc' }}>
                {data.checkOut?.timestamp ? new Date(data.checkOut.timestamp).toLocaleTimeString() : 'Missing'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Check-Out Device:</span>
              <span style={{ color: '#64748b' }}>{data.checkOut?.deviceId || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Primary Ingestion Source:</span>
              <span style={{ color: '#38bdf8', fontWeight: '600' }}>{data.source}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Reconciliation State:</span>
              <AttendanceStatusBadge status={data.reconciliationStatus} />
            </div>
          </div>
        </div>
      </div>

      {/* Audit History Timeline */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <History style={{ width: '20px', height: '20px', color: '#10b981' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
            Immutable Change & Audit History ({data.history?.length || 0})
          </h3>
        </div>

        {(!data.history || data.history.length === 0) ? (
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No historical modifications recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.history.map((hist, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color, #334155)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{hist.action}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>by {hist.performedByName || hist.performedBy}</span>
                  </div>
                  {hist.reason && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                      Reason: <span style={{ color: '#cbd5e1' }}>{hist.reason}</span>
                    </p>
                  )}
                  {hist.newValues && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                      Status: {hist.newValues.status || 'N/A'} | CheckIn: {hist.newValues.checkIn ? new Date(hist.newValues.checkIn).toLocaleTimeString() : 'N/A'} | CheckOut: {hist.newValues.checkOut ? new Date(hist.newValues.checkOut).toLocaleTimeString() : 'N/A'}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {new Date(hist.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCorrectionModal && (
        <CorrectionModal
          attendance={data}
          onClose={() => setShowCorrectionModal(false)}
          onSuccess={fetchRecord}
        />
      )}
    </div>
  );
};

export default AttendanceDetailPage;
