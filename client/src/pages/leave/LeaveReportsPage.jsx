import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Filter
} from 'lucide-react';
import leaveService from '../../services/leaveService';

export const LeaveReportsPage = () => {
  const [activeTab, setActiveTab] = useState('SUMMARY');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [utilData, setUtilData] = useState([]);
  const [exceptions, setExceptions] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'SUMMARY') {
        const res = await leaveService.getSummaryReport();
        setSummaryData(res.data?.summary || []);
      } else if (activeTab === 'DEPARTMENT') {
        const res = await leaveService.getDepartmentReport();
        setDeptData(res.data?.departments || []);
      } else if (activeTab === 'UTILIZATION') {
        const res = await leaveService.getUtilizationReport();
        setUtilData(res.data?.utilization || []);
      } else if (activeTab === 'EXCEPTIONS') {
        const res = await leaveService.getExceptionsReport();
        setExceptions(res.data?.exceptions || []);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('token');
    const endpoint = `http://localhost:5000/api/leave/reports/${activeTab === 'DEPARTMENT' ? 'department' : activeTab === 'UTILIZATION' ? 'utilization' : 'summary'}?format=csv`;
    window.open(endpoint, '_blank');
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Leave Analytics & Compliance Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Workforce leave balances, utilization trends, departmental absences, and audit exceptions.
          </p>
        </div>

        <button onClick={handleExportCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={16} /> Export to CSV
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        {[
          { key: 'SUMMARY', label: 'Staff Balance Summary', icon: Users },
          { key: 'DEPARTMENT', label: 'Department On-Leave', icon: Calendar },
          { key: 'UTILIZATION', label: 'Leave Utilization Trends', icon: TrendingUp },
          { key: 'EXCEPTIONS', label: 'Exceptions & Conflicts', icon: AlertTriangle }
        ].map(tab => {
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
                color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                borderBottom: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Report Tables */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading report metrics...</div>
        ) : activeTab === 'SUMMARY' ? (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Staff Name</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Opening</th>
                  <th>Accrued</th>
                  <th>Used</th>
                  <th>Pending</th>
                  <th>Available</th>
                  <th>Closing</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{row.employeeCode}</td>
                    <td>{row.employeeName}</td>
                    <td>{row.department}</td>
                    <td><span className="badge badge-secondary">{row.leaveType}</span></td>
                    <td>{row.opening}</td>
                    <td>{row.accrued}</td>
                    <td style={{ color: '#f87171' }}>{row.used}</td>
                    <td style={{ color: '#f59e0b' }}>{row.pending}</td>
                    <td><strong style={{ color: '#4ade80' }}>{row.available}</strong></td>
                    <td>{row.closing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'DEPARTMENT' ? (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Code</th>
                  <th>Active Staff Count</th>
                  <th>On Leave Today</th>
                  <th>Upcoming Next 7 Days</th>
                </tr>
              </thead>
              <tbody>
                {deptData.map((d, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{d.departmentName}</td>
                    <td>{d.code}</td>
                    <td>{d.totalActiveStaff}</td>
                    <td><strong style={{ color: d.onLeaveToday > 0 ? '#38bdf8' : 'inherit' }}>{d.onLeaveToday}</strong></td>
                    <td>{d.upcomingLeaveNext7Days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'UTILIZATION' ? (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Total Requests</th>
                  <th>Approved</th>
                  <th>Rejected</th>
                  <th>Cancelled</th>
                  <th>Total Days Utilized</th>
                </tr>
              </thead>
              <tbody>
                {utilData.map((u, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{u.name}</td>
                    <td><span className="badge badge-secondary">{u.code}</span></td>
                    <td>{u.isPaid ? 'Paid' : 'Unpaid'}</td>
                    <td>{u.totalRequests}</td>
                    <td style={{ color: '#4ade80' }}>{u.totalApproved}</td>
                    <td style={{ color: '#f87171' }}>{u.totalRejected}</td>
                    <td>{u.totalCancelled}</td>
                    <td><strong>{u.totalDaysUtilized}</strong> days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Exception ID</th>
                  <th>Type</th>
                  <th>Entity</th>
                  <th>Description</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map(exc => (
                  <tr key={exc._id}>
                    <td style={{ fontWeight: '600' }}>{exc.exceptionId}</td>
                    <td><span className="badge badge-danger">{exc.exceptionType}</span></td>
                    <td>{exc.entityType}: {exc.entityId}</td>
                    <td style={{ fontSize: '0.85rem' }}>{exc.description}</td>
                    <td><span className="badge badge-warning">{exc.severity}</span></td>
                    <td>{exc.currentStatus}</td>
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

export default LeaveReportsPage;
