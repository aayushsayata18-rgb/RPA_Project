import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Users,
  CheckCircle,
  AlertTriangle,
  BarChart2,
  Calendar
} from 'lucide-react';
import shiftService from '../../services/shiftService';

export const ShiftReportsPage = () => {
  const [coverageData, setCoverageData] = useState(null);
  const [utilizationData, setUtilizationData] = useState([]);
  const [departmentId, setDepartmentId] = useState('DEP-RECEPTION');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [departmentId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [covRes, utilRes] = await Promise.all([
        shiftService.getCoverage({ departmentId }),
        shiftService.getShiftUtilizationReport()
      ]);
      setCoverageData(covRes.data);
      setUtilizationData(utilRes.data?.report || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await shiftService.downloadScheduleCsv();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee_shift_schedule.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export schedule CSV');
    }
  };

  return (
    <div className="portal-content" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            Workforce Coverage & Shift Reports
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Department staffing gap analysis, shift utilization analytics, and schedule exports.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download size={16} />
          <span>Export Schedule CSV</span>
        </button>
      </div>

      {/* Department Selector */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '300px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Select Department
          </label>
          <input
            type="text"
            className="input-field"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            placeholder="e.g. DEP-RECEPTION"
          />
        </div>
      </div>

      {/* Coverage Section */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#f8fafc', marginBottom: '1rem' }}>
          Staffing Coverage Gap Analysis — {coverageData?.department?.name || departmentId}
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading coverage...</div>
        ) : !coverageData?.coverage?.length ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No shifts configured.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.6)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Shift</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#94a3b8' }}>Window</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#94a3b8' }}>Required Staff</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#94a3b8' }}>Scheduled Staff</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#94a3b8' }}>Staffing Gap</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#94a3b8' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {coverageData.coverage.map((c) => (
                <tr key={c.shiftCode} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#f1f5f9' }}>{c.shiftName} ({c.shiftCode})</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{c.startTime} - {c.endTime}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#cbd5e1' }}>{c.requiredCount}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700', color: '#f8fafc' }}>{c.scheduledCount}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: c.gap > 0 ? '#ef4444' : '#10b981', fontWeight: '700' }}>
                    {c.gap > 0 ? `-${c.gap}` : '0'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span className={`badge ${c.status === 'ADEQUATE' ? 'badge-success' : 'badge-danger'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Utilization Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#f8fafc', marginBottom: '1rem' }}>
          Shift Utilization & Attendance Correlation
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {utilizationData.map((u) => (
            <div
              key={u.shiftCode}
              style={{
                padding: '1rem',
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#38bdf8' }}>{u.shiftCode}</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{u.startTime}-{u.endTime}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '0.2rem' }}>{u.shiftName}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Scheduled</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f1f5f9' }}>{u.assignedCount}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Attended</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>{u.presentAttendanceCount}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShiftReportsPage;
