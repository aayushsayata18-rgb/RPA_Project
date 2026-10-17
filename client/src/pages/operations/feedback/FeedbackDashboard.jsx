import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCircle2,
  RotateCcw,
  Star,
  Users,
  Building,
  RefreshCw,
  Search,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Bot
} from 'lucide-react';
import feedbackService from '../../../services/feedbackService';
import { FeedbackStatusBadge } from '../../../components/feedback/FeedbackStatusBadge';
import { PriorityBadge } from '../../../components/feedback/PriorityBadge';
import { SLAIndicator } from '../../../components/feedback/SLAIndicator';

export const FeedbackDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [recentUrgent, setRecentUrgent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rpaScanLoading, setRpaScanLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, catRes, deptRes, urgentRes] = await Promise.all([
        feedbackService.getSummaryReport(),
        feedbackService.getCategoryReport(),
        feedbackService.getDepartmentReport(),
        feedbackService.getFeedbackList({ limit: 6, priority: 'HIGH' })
      ]);

      setSummary(summaryRes.data);
      setCategoryData(catRes.data || []);
      setDeptData(deptRes.data || []);
      setRecentUrgent(urgentRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunRpaScan = async () => {
    try {
      setRpaScanLoading(true);
      setScanMessage('');
      const res = await feedbackService.checkSLABreaches();
      setScanMessage(`RPA SLA Scan completed: Scanned ${res.data.scanned} active cases, ${res.data.breached} newly breached, ${res.data.atRisk} at risk.`);
      fetchDashboardData();
    } catch (err) {
      setScanMessage(`Scan error: ${err.message}`);
    } finally {
      setRpaScanLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1300px', margin: '3rem auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Feedback & Grievance Management Dashboard...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1350px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
            <LayoutDashboard size={14} /> Hospital Administrative Governance
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-primary, #f8fafc)' }}>
            Patient Feedback & Grievance Management Hub
          </h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: '0.25rem 0 0 0', fontSize: '0.88rem' }}>
            Module 25: Longitudinal feedback tracking, SLA escalation monitor & departmental grievance resolution
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleRunRpaScan}
            disabled={rpaScanLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1rem',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: rpaScanLoading ? 'not-allowed' : 'pointer'
            }}
          >
            <Bot size={15} />
            {rpaScanLoading ? 'Scanning SLAs...' : 'Run RPA SLA Scan'}
          </button>

          <Link
            to="/operations/feedback/list"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.15rem',
              borderRadius: '6px',
              background: '#0284c7',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            <Search size={15} /> All Cases Console
          </Link>
        </div>
      </div>

      {scanMessage && (
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            color: '#38bdf8',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Bot size={16} />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', padding: '1.15rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500' }}>Total Feedback</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0.35rem 0' }}>
            {summary?.total || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>All channels logged</div>
        </div>

        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', padding: '1.15rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500' }}>Open Complaints</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#f59e0b', margin: '0.35rem 0' }}>
            {summary?.openComplaints || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Requiring resolution</div>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '1.15rem' }}>
          <div style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertOctagon size={13} /> SLA Breached
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#ef4444', margin: '0.35rem 0' }}>
            {summary?.slaBreached || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Escalated to management</div>
        </div>

        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', padding: '1.15rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500' }}>SLA At Risk</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#fb923c', margin: '0.35rem 0' }}>
            {summary?.slaAtRisk || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>&lt; 4 hours remaining</div>
        </div>

        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', padding: '1.15rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500' }}>Resolved & Closed</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#10b981', margin: '0.35rem 0' }}>
            {(summary?.resolved || 0) + (summary?.closed || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Actions implemented</div>
        </div>

        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', padding: '1.15rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500' }}>Reopened Cases</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#f43f5e', margin: '0.35rem 0' }}>
            {summary?.reopened || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fb7185' }}>Patient dissatisfied</div>
        </div>

        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', padding: '1.15rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500' }}>Average Rating</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0.35rem 0' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: '800', color: '#fbbf24' }}>
              {summary?.averageRating || 0}
            </span>
            <Star size={20} fill="#fbbf24" color="#fbbf24" />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Scale of 1 to 5 stars</div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Queue & Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Urgent & Escalated Queue */}
        <div
          style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '1.15rem 1.25rem', borderBottom: '1px solid var(--border-color, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.95rem', color: '#f87171' }}>
              <ShieldAlert size={17} /> Urgent & High Priority Queue
            </div>
            <Link to="/operations/feedback/list?priority=HIGH" style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          {recentUrgent.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No high priority cases pending.
            </div>
          ) : (
            <div>
              {recentUrgent.map((item) => (
                <div
                  key={item.feedbackId}
                  style={{
                    padding: '0.9rem 1.25rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: '700', color: '#38bdf8', fontSize: '0.85rem' }}>{item.feedbackId}</span>
                      <FeedbackStatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {item.subject}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Dept: {item.assignedDepartmentName || item.category} | Submitter: {item.patientName}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <SLAIndicator dueAt={item.dueAt} slaStatus={item.slaStatus} status={item.status} />
                    <div style={{ marginTop: '0.35rem' }}>
                      <Link
                        to={`/operations/feedback/${item.feedbackId}`}
                        style={{ color: '#38bdf8', fontSize: '0.78rem', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        Action <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown Table */}
        <div
          style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '1.15rem 1.25rem', borderBottom: '1px solid var(--border-color, #334155)', fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Feedback & Grievances by Category
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>Total Cases</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>Complaints</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>Avg Rating</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Resolved</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.slice(0, 7).map((cat) => (
                  <tr key={cat._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {cat._id || 'General'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {cat.totalCount}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center', color: '#fb923c', fontWeight: '600' }}>
                      {cat.complaintCount}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center', color: '#fbbf24' }}>
                      {cat.avgRating ? `${cat.avgRating.toFixed(1)} ★` : '—'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                      {cat.resolvedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Department Performance Matrix */}
      <div
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '1.15rem 1.25rem', borderBottom: '1px solid var(--border-color, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={16} /> Departmental Grievance Resolution & SLA Compliance
          </div>
          <Link to="/operations/feedback/reports" style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'none' }}>
            Detailed Reports <ChevronRight size={13} />
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Total Cases</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Complaints</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>SLA Breaches</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>SLA Compliance</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Reopened</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Satisfaction</th>
              </tr>
            </thead>
            <tbody>
              {deptData.map((d, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {d.departmentName}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{d.totalCases}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#fb923c' }}>{d.complaintCount}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: d.breachedCount > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: d.breachedCount > 0 ? '700' : '400' }}>
                    {d.breachedCount}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        background: d.slaCompliance >= 90 ? 'rgba(16, 185, 129, 0.15)' : d.slaCompliance >= 75 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: d.slaCompliance >= 90 ? '#10b981' : d.slaCompliance >= 75 ? '#f59e0b' : '#ef4444'
                      }}
                    >
                      {d.slaCompliance}%
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: d.reopenedCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                    {d.reopenedCount}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#fbbf24', fontWeight: '600' }}>
                    {d.avgRating > 0 ? `${d.avgRating} ★` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDashboard;
