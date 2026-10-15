import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge';
import { ManualAttendanceModal } from '../../components/attendance/ManualAttendanceModal';
import { CorrectionModal } from '../../components/attendance/CorrectionModal';
import {
  Calendar,
  Search,
  Filter,
  Download,
  PlusCircle,
  Eye,
  Edit,
  Clock,
  RefreshCw
} from 'lucide-react';

export const DailyAttendancePage = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAttendanceList({
        date,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        limit: 100
      });
      setRecords(res.data?.records || []);
    } catch (err) {
      console.error('Failed to load daily attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [date, statusFilter, sourceFilter]);

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = r.employeeId ? `${r.employeeId.firstName || ''} ${r.employeeId.lastName || ''}`.toLowerCase() : '';
    const code = (r.employeeId?.employeeId || r.employeeIdCode || '').toLowerCase();
    const dept = (r.employeeId?.departmentName || '').toLowerCase();
    return name.includes(q) || code.includes(q) || dept.includes(q);
  });

  const exportCsv = () => {
    const headers = ['Attendance ID,Employee Code,Employee Name,Department,Date,Check In,Check Out,Status,Late Minutes,Worked Hours,Source'];
    const rows = filteredRecords.map((r) => {
      const name = r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : '';
      const inTime = r.checkIn?.timestamp ? new Date(r.checkIn.timestamp).toISOString() : '';
      const outTime = r.checkOut?.timestamp ? new Date(r.checkOut.timestamp).toISOString() : '';
      return [
        r.attendanceId,
        r.employeeId?.employeeId || r.employeeIdCode,
        `"${name}"`,
        `"${r.employeeId?.departmentName || ''}"`,
        r.attendanceDate ? r.attendanceDate.slice(0, 10) : '',
        inTime,
        outTime,
        r.status,
        r.lateMinutes || 0,
        r.workedMinutes ? (r.workedMinutes / 60).toFixed(2) : 0,
        r.source
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `daily_attendance_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            Daily Attendance Ledger
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Inspect daily punches, shift reconciliation status, and initiate correction reviews.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={exportCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              color: '#f8fafc',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <Download style={{ width: '16px', height: '16px' }} />
            Export CSV
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <PlusCircle style={{ width: '16px', height: '16px' }} />
            Record Manual Entry
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '10px',
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              background: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              color: '#f8fafc',
              fontSize: '0.85rem'
            }}
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              background: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              color: '#f8fafc',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">PRESENT</option>
            <option value="LATE">LATE</option>
            <option value="MISSED_PUNCH">MISSED PUNCH</option>
            <option value="HALF_DAY">HALF DAY</option>
            <option value="ON_LEAVE">ON LEAVE</option>
            <option value="ABSENT">ABSENT</option>
          </select>
        </div>

        {/* Source Dropdown */}
        <div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              background: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              color: '#f8fafc',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Sources</option>
            <option value="BIOMETRIC">BIOMETRIC</option>
            <option value="CSV_IMPORT">CSV IMPORT</option>
            <option value="API">API</option>
            <option value="MANUAL">MANUAL</option>
            <option value="RPA">RPA</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#94a3b8'
            }}
          />
          <input
            type="text"
            placeholder="Search by staff name, ID code, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2.25rem',
              borderRadius: '6px',
              background: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              color: '#f8fafc',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <button
          onClick={fetchRecords}
          title="Refresh"
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: '6px',
            background: 'var(--bg-input, #0f172a)',
            border: '1px solid var(--border-color, #334155)',
            color: '#f8fafc',
            cursor: 'pointer'
          }}
        >
          <RefreshCw style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Main Table */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border-color, #334155)' }}>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Staff Member</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Department</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Shift Window</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Check In</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Check Out</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Late</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Worked</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Source</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Loading attendance ledger...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No attendance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr
                    key={r._id || r.attendanceId}
                    style={{ borderBottom: '1px solid var(--border-color, #334155)' }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ color: '#f8fafc', fontWeight: '600' }}>
                        {r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : r.employeeIdCode}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                        {r.employeeId?.employeeId || r.employeeIdCode}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>
                      {r.employeeId?.departmentName || 'General Staff'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                      {r.shiftDetails?.expectedStartTime || '09:00'} - {r.shiftDetails?.expectedEndTime || '18:00'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc' }}>
                      {r.checkIn?.timestamp ? (
                        <div>
                          <span>
                            {new Date(r.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {r.checkIn.deviceId && (
                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>
                              {r.checkIn.deviceId}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#ef4444' }}>Missing</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc' }}>
                      {r.checkOut?.timestamp ? (
                        <div>
                          <span>
                            {new Date(r.checkOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {r.checkOut.deviceId && (
                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>
                              {r.checkOut.deviceId}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#ef4444' }}>Missing</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <AttendanceStatusBadge status={r.status} />
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: r.lateMinutes > 0 ? '#f59e0b' : '#94a3b8' }}>
                      {r.lateMinutes > 0 ? `${r.lateMinutes}m` : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc', fontWeight: '500' }}>
                      {r.workedMinutes > 0 ? `${(r.workedMinutes / 60).toFixed(1)} hrs` : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(51, 65, 85, 0.6)',
                          color: '#94a3b8'
                        }}
                      >
                        {r.source}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Link
                          to={`/attendance/${r.attendanceId || r._id}`}
                          title="Inspect Details"
                          style={{
                            padding: '0.35rem',
                            borderRadius: '6px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            color: '#38bdf8',
                            display: 'inline-flex'
                          }}
                        >
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </Link>
                        <button
                          onClick={() => setSelectedRecordForCorrection(r)}
                          title="Request Correction"
                          style={{
                            padding: '0.35rem',
                            borderRadius: '6px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            color: '#fbbf24',
                            display: 'inline-flex',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showManualModal && (
        <ManualAttendanceModal
          onClose={() => setShowManualModal(false)}
          onSuccess={fetchRecords}
        />
      )}

      {selectedRecordForCorrection && (
        <CorrectionModal
          attendance={selectedRecordForCorrection}
          onClose={() => setSelectedRecordForCorrection(null)}
          onSuccess={fetchRecords}
        />
      )}
    </div>
  );
};

export default DailyAttendancePage;
