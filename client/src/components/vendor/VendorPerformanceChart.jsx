import React from 'react';
import { Award, TrendingUp, CheckCircle, Clock, FileCheck, AlertTriangle } from 'lucide-react';

export const VendorPerformanceChart = ({ performanceData }) => {
  const live = performanceData?.liveMetrics || {};
  const metrics = live.metrics || {};
  const score = live.overallScore !== undefined ? live.overallScore : 100;
  const grade = live.ratingGrade || 'EXCELLENT';
  const reviews = performanceData?.reviews || [];

  const getGradeColor = () => {
    switch (grade) {
      case 'EXCELLENT':
        return '#10b981';
      case 'GOOD':
        return '#38bdf8';
      case 'SATISFACTORY':
        return '#eab308';
      case 'POOR':
        return '#f97316';
      case 'CRITICAL':
        return '#ef4444';
      default:
        return '#10b981';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Scorecard Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: `conic-gradient(${getGradeColor()} ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: getGradeColor()
              }}
            >
              {score}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Performance Score
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: getGradeColor(), marginTop: '0.1rem' }}>
              {grade}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.2rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>On-Time Delivery</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>{metrics.onTimeDeliveryPercent || 100}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '0.6rem', overflow: 'hidden' }}>
            <div style={{ width: `${metrics.onTimeDeliveryPercent || 100}%`, height: '100%', background: '#38bdf8', borderRadius: '3px' }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Based on shipment tracking & GRN logs
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.2rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quantity Accuracy</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>{metrics.quantityAccuracyPercent || 100}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '0.6rem', overflow: 'hidden' }}>
            <div style={{ width: `${metrics.quantityAccuracyPercent || 100}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            GRN accepted vs purchase order quantity
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.2rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Invoice Match %</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#a855f7' }}>{metrics.invoiceAccuracyPercent || 100}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '0.6rem', overflow: 'hidden' }}>
            <div style={{ width: `${metrics.invoiceAccuracyPercent || 100}%`, height: '100%', background: '#a855f7', borderRadius: '3px' }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Three-way matching compliance rate
          </div>
        </div>
      </div>

      {/* Historical Reviews */}
      <div>
        <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Historical Performance Reviews ({reviews.length})
        </h4>
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Review Period</th>
                <th style={{ padding: '0.75rem 1rem' }}>Score & Grade</th>
                <th style={{ padding: '0.75rem 1rem' }}>Total Spend</th>
                <th style={{ padding: '0.75rem 1rem' }}>Evaluator Comments</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No formal periodic reviews finalized for this vendor yet.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.reviewId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {new Date(r.periodStart).toLocaleDateString()} — {new Date(r.periodEnd).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {r.reviewId}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: r.overallScore >= 90 ? '#10b981' : '#38bdf8' }}>
                        {r.overallScore}/100
                      </span>{' '}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({r.ratingGrade})</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      INR {(r.metrics?.totalSpend || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                      {r.comments || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981'
                        }}
                      >
                        {r.reviewStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
