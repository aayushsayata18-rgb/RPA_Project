import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge';
import {
  FileText,
  Calendar,
  Building,
  AlertTriangle,
  Download,
  Printer,
  RefreshCw
} from 'lucide-react';

export const AttendanceReportsPage = () => {
  const [activeTab, setActiveTab] = useState('DAILY'); // 'DAILY', 'MONTHLY', 'DEPARTMENT', 'EXCEPTIONS'

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'DAILY') {
        const res = await attendanceService.getDailyReport(date);
        setReportData(res.data);
      } else if (activeTab === 'MONTHLY') {
        const res = await attendanceService.getMonthlyReport({ year, month });
        setReportData(res.data);
      } else if (activeTab === 'DEPARTMENT') {
        const res = await attendanceService.getDepartmentReport({ date });
        setReportData(res.data);
      } else if (activeTab === 'EXCEPTIONS') {
        const res = await attendanceService.getExceptionReport({ limit: 50 });
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, date, year, month]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="portal-page" style={{ padding: '2rem' }}>
      {/* Header */}
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
            Attendance Analytics & Reports
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Auditable daily, monthly, departmental attendance summaries and operational exception logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handlePrint}
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
            <Printer style={{ width: '16px', height: '16px' }} />
            Print Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color, #334155)',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        {[
          { key: 'DAILY', label: 'Daily Roster Summary', icon: Calendar },
          { key: 'MONTHLY', label: 'Monthly Staff Ledger', icon: FileText },
          { key: 'DEPARTMENT', label: 'Department Analytics', icon: Building },
          { key: 'EXCEPTIONS', label: 'Exception Cases', icon: AlertTriangle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'none',
                color: isActive ? '#38bdf8' : '#94a3b8',
                borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <Icon style={{ width: '16px', height: '16px' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Controls Bar */}
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
        {(activeTab === 'DAILY' || activeTab === 'DEPARTMENT') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Target Date:</span>
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
        )}

        {activeTab === 'MONTHLY' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Month:</span>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-input, #0f172a)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#f8fafc',
                  fontSize: '0.85rem'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Year:</span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-input, #0f172a)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#f8fafc',
                  fontSize: '0.85rem'
                }}
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>
        )}

        <button
          onClick={fetchReport}
          title="Refresh"
          style={{
            marginLeft: 'auto',
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

      {/* Report Content */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          Generating report...
        </div>
      ) : (
        <>
          {/* TAB 1: DAILY SUMMARY */}
          {activeTab === 'DAILY' && reportData && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div className="card" style={{ padding: '1rem', background: '#1e293b', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Headcount</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc' }}>{reportData.totalHeadcount}</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: '#1e293b', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Present</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{reportData.metrics?.present}</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: '#1e293b', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Absent / Unreported</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>{reportData.metrics?.absent}</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: '#1e293b', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Late Arrivals</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>{reportData.metrics?.late}</div>
                </div>
                <div className="card" style={{ padding: '1rem', background: '#1e293b', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Attendance Rate</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#38bdf8' }}>{reportData.metrics?.attendancePercentage}%</div>
                </div>
              </div>

              <div className="card" style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Staff Member</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Department</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Designation</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Check In</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Check Out</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Worked Hours</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows?.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#f8fafc', fontWeight: '500' }}>
                          {row.name} <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>({row.employeeId})</span>
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>{row.department}</td>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>{row.designation}</td>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#f8fafc' }}>
                          {row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#f8fafc' }}>
                          {row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#f8fafc' }}>
                          {row.workedMinutes > 0 ? `${(row.workedMinutes / 60).toFixed(1)} hrs` : '0'}
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem' }}>
                          <AttendanceStatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MONTHLY LEDGER */}
          {activeTab === 'MONTHLY' && reportData && (
            <div className="card" style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', color: '#cbd5e1', fontSize: '0.875rem' }}>
                Period: <strong>{reportData.period}</strong> | Eligible Working Days: <strong>{reportData.eligibleWorkingDays}</strong>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Staff</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Department</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Present Days</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Absent Days</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Leave Days</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Late Punches</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Worked Hours</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.reportRows?.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#f8fafc', fontWeight: '500' }}>
                          {row.name} <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>({row.employeeId})</span>
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>{row.department}</td>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#10b981', fontWeight: '600' }}>{row.presentDays}</td>
                        <td style={{ padding: '0.75rem 1.25rem', color: row.absentDays > 0 ? '#ef4444' : '#94a3b8' }}>{row.absentDays}</td>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#3b82f6' }}>{row.leaveDays}</td>
                        <td style={{ padding: '0.75rem 1.25rem', color: row.lateCount > 0 ? '#f59e0b' : '#94a3b8' }}>{row.lateCount}</td>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#f8fafc' }}>{row.workedHours} hrs</td>
                        <td style={{ padding: '0.75rem 1.25rem', color: '#38bdf8', fontWeight: '600' }}>{row.attendancePercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DEPARTMENT ANALYTICS */}
          {activeTab === 'DEPARTMENT' && reportData && (
            <div className="card" style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Department</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Total Headcount</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Present</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Absent</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Late</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Leave</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Compliance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.departments?.map((dept, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc', fontWeight: '600' }}>{dept.department}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>{dept.totalStaff}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#10b981', fontWeight: '600' }}>{dept.present}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#ef4444' }}>{dept.absent}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#f59e0b' }}>{dept.late}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#3b82f6' }}>{dept.leave}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#38bdf8', fontWeight: '700' }}>{dept.attendancePercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: EXCEPTIONS */}
          {activeTab === 'EXCEPTIONS' && reportData && (
            <div className="card" style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Exception ID</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Type</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Description</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Severity</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Assigned Role</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Status</th>
                      <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!reportData.exceptions || reportData.exceptions.length === 0) ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                          No unresolved attendance exceptions found.
                        </td>
                      </tr>
                    ) : (
                      reportData.exceptions.map((ex) => (
                        <tr key={ex._id || ex.exceptionId} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '0.75rem 1.25rem', color: '#e11d48', fontWeight: '600' }}>{ex.exceptionId}</td>
                          <td style={{ padding: '0.75rem 1.25rem', color: '#f8fafc', fontWeight: '500' }}>{ex.exceptionType}</td>
                          <td style={{ padding: '0.75rem 1.25rem', color: '#cbd5e1', fontSize: '0.85rem' }}>{ex.description}</td>
                          <td style={{ padding: '0.75rem 1.25rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                background: ex.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: ex.severity === 'HIGH' ? '#ef4444' : '#f59e0b'
                              }}
                            >
                              {ex.severity}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem', color: '#94a3b8' }}>{ex.assignedRole}</td>
                          <td style={{ padding: '0.75rem 1.25rem' }}>
                            <AttendanceStatusBadge status={ex.currentStatus || 'OPEN'} />
                          </td>
                          <td style={{ padding: '0.75rem 1.25rem', color: '#64748b', fontSize: '0.8rem' }}>
                            {new Date(ex.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceReportsPage;
