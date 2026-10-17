import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Building,
  Star,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  FileText
} from 'lucide-react';
import feedbackService from '../../../services/feedbackService';

export const FeedbackReports = () => {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [ratingData, setRatingData] = useState(null);
  const [slaData, setSlaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [sumRes, catRes, deptRes, ratingRes, slaRes] = await Promise.all([
        feedbackService.getSummaryReport(),
        feedbackService.getCategoryReport(),
        feedbackService.getDepartmentReport(),
        feedbackService.getRatingReport(),
        feedbackService.getSLAReport()
      ]);

      setSummary(sumRes.data);
      setCategories(catRes.data || []);
      setDepartments(deptRes.data || []);
      setRatingData(ratingRes.data);
      setSlaData(slaRes.data);
    } catch (err) {
      console.error('Failed to load feedback reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (departments.length === 0) return;
    const headers = ['Department', 'Total Cases', 'Complaints', 'SLA Breaches', 'SLA Compliance (%)', 'Reopened', 'Avg Rating'];
    const rows = departments.map((d) => [
      `"${d.departmentName}"`,
      d.totalCases,
      d.complaintCount,
      d.breachedCount,
      `${d.slaCompliance}%`,
      d.reopenedCount,
      d.avgRating || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `feedback_department_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '3rem auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Feedback Analytics & Management Reports...
      </div>
    );
  }

  const maxCategoryCount = Math.max(...categories.map((c) => c.totalCount || 0), 1);

  return (
    <div style={{ maxWidth: '1350px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', margin: '0 0 0.35rem 0', color: 'var(--text-primary, #f8fafc)' }}>
            Patient Feedback & Grievance Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: 0, fontSize: '0.88rem' }}>
            Comprehensive reporting on patient satisfaction ratings, complaint categories, and department SLA compliance
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.15rem',
            borderRadius: '6px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <Download size={15} /> Export CSV Report
        </button>
      </div>

      {/* KPI Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Feedback Logged</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0.35rem 0' }}>
            {summary?.total || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Across all intake channels</div>
        </div>

        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Overall SLA Compliance</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#10b981', margin: '0.35rem 0' }}>
            {slaData?.complianceRate || 100}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Cases resolved on-time</div>
        </div>

        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Satisfaction Index</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0.35rem 0' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: '800', color: '#fbbf24' }}>
              {ratingData?.average || 0}
            </span>
            <Star size={20} fill="#fbbf24" color="#fbbf24" />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>{ratingData?.totalRatings || 0} verified ratings</div>
        </div>

        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Reopened Rate</div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#f43f5e', margin: '0.35rem 0' }}>
            {summary?.reopened || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fb7185' }}>Cases reconsidered</div>
        </div>
      </div>

      {/* Two Column Grid: Rating Distribution & Category Volumes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Rating Breakdown */}
        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={16} color="#fbbf24" /> Patient Rating Distribution (1 to 5 Stars)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingData?.distribution?.[star] || 0;
              const total = ratingData?.totalRatings || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ minWidth: '60px', display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#fbbf24', fontWeight: '600' }}>
                    <span>{star}</span>
                    <Star size={13} fill="#fbbf24" />
                  </div>

                  <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.05)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: star >= 4 ? '#10b981' : star === 3 ? '#f59e0b' : '#ef4444',
                        borderRadius: '6px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  <div style={{ minWidth: '65px', textAlign: 'right', color: 'var(--text-muted)' }}>
                    <strong>{count}</strong> ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown Progress Bars */}
        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={16} color="#38bdf8" /> Volumes by Service Category
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {categories.slice(0, 6).map((cat) => {
              const pct = Math.round((cat.totalCount / maxCategoryCount) * 100);
              return (
                <div key={cat._id} style={{ fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{cat._id || 'General'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <strong>{cat.totalCount}</strong> cases ({cat.complaintCount} complaints)
                    </span>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                        borderRadius: '5px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Department SLA Matrix Table */}
      <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color, #334155)', fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building size={16} /> Departmental Service Quality & SLA Compliance
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Department Name</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Total Feedback</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Formal Complaints</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>SLA Breaches</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>SLA Compliance</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Reopened</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Satisfaction Score</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {d.departmentName}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{d.totalCases}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#fb923c' }}>{d.complaintCount}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: d.breachedCount > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: d.breachedCount > 0 ? '700' : '400' }}>
                    {d.breachedCount}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
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
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: d.reopenedCount > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                    {d.reopenedCount}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#fbbf24', fontWeight: '600' }}>
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

export default FeedbackReports;
