import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge';
import { CorrectionModal } from '../../components/attendance/CorrectionModal';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Edit,
  RefreshCw
} from 'lucide-react';

export const MyAttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState(null);

  const fetchMyAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getMyAttendance({ limit: 40 });
      setRecords(res.data?.records || []);
    } catch (err) {
      console.error('Failed to load employee attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, []);

  // Summary statistics
  const presentCount = records.filter(
    (r) => r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'CORRECTION_APPROVED'
  ).length;
  const lateCount = records.filter((r) => r.lateMinutes > 0).length;
  const missingCount = records.filter((r) => r.status === 'MISSED_PUNCH').length;
  const totalWorkedMinutes = records.reduce((acc, cur) => acc + (cur.workedMinutes || 0), 0);

  return (
    <div className="portal-page" style={{ padding: '2rem' }}>
      {/* Page Header */}
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
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            My Attendance & Timesheet
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Personal attendance record, punch telemetry, and self-service correction requests.
          </p>
        </div>

        <button
          onClick={fetchMyAttendance}
          title="Refresh"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            color: '#f8fafc',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          <RefreshCw style={{ width: '16px', height: '16px' }} />
          Refresh
        </button>
      </div>

      {/* Monthly Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div className="card" style={{ padding: '1.25rem', background: '#1e293b', borderRadius: '10px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Present Days</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981' }}>{presentCount}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#1e293b', borderRadius: '10px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Late Punches</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f59e0b' }}>{lateCount}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#1e293b', borderRadius: '10px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Missing Punches</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#ec4899' }}>{missingCount}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#1e293b', borderRadius: '10px' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Total Hours Worked</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#38bdf8' }}>
            {(totalWorkedMinutes / 60).toFixed(1)} hrs
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color, #334155)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Recent Punch History</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border-color, #334155)' }}>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Date</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Check In</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Check Out</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Worked Hours</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Correction Status</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', textAlign: 'center' }}>Self-Service Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Loading your timesheet...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No personal attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id || r.attendanceId} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc', fontWeight: '500' }}>
                      {new Date(r.attendanceDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc' }}>
                      {r.checkIn?.timestamp ? (
                        <span>{new Date(r.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>Missing</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc' }}>
                      {r.checkOut?.timestamp ? (
                        <span>{new Date(r.checkOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>Missing</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc' }}>
                      {r.workedMinutes > 0 ? `${(r.workedMinutes / 60).toFixed(1)} hrs` : '0'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <AttendanceStatusBadge status={r.status} />
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      {r.correctionStatus && r.correctionStatus !== 'NONE' ? (
                        <AttendanceStatusBadge status={r.correctionStatus} />
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                      {r.correctionStatus === 'PENDING' ? (
                        <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: '600' }}>
                          Correction In Review
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedRecordForCorrection(r)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit style={{ width: '13px', height: '13px' }} />
                          Request Correction
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecordForCorrection && (
        <CorrectionModal
          attendance={selectedRecordForCorrection}
          onClose={() => setSelectedRecordForCorrection(null)}
          onSuccess={fetchMyAttendance}
        />
      )}
    </div>
  );
};

export default MyAttendancePage;
