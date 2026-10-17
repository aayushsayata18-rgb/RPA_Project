import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  FilePlus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import feedbackService from '../../../services/feedbackService';
import { FeedbackStatusBadge } from '../../../components/feedback/FeedbackStatusBadge';
import { RatingInput } from '../../../components/feedback/RatingInput';

export const FeedbackHome = () => {
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentFeedback();
  }, []);

  const fetchRecentFeedback = async () => {
    try {
      setLoading(true);
      const res = await feedbackService.getMyFeedback({ limit: 5 });
      setRecentFeedbacks(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch recent feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const cleanId = trackingId.trim().toUpperCase();
    if (!cleanId) {
      setTrackingError('Please enter a valid Feedback ID.');
      return;
    }
    navigate(`/patient/feedback/${cleanId}`);
  };

  const resolvedCount = recentFeedbacks.filter((f) => ['RESOLVED', 'CLOSED'].includes(f.status)).length;
  const activeCount = recentFeedbacks.filter((f) => !['RESOLVED', 'CLOSED', 'WITHDRAWN'].includes(f.status)).length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.15)', padding: '0.3rem 0.75rem', borderRadius: '9999px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            <Sparkles size={14} />
            Patient Experience & Grievance Care
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: 'var(--text-primary, #f8fafc)' }}>
            We Value Your Voice
          </h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: '0 0 1.5rem 0', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Your feedback drives continuous clinical excellence and hospital service improvements. Share your appreciation, submit a service suggestion, or register a formal grievance with dedicated SLA oversight.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/patient/feedback/new"
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: '600',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
              }}
            >
              <FilePlus size={18} />
              Submit Feedback / Grievance
            </Link>

            <Link
              to="/patient/feedback/my"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-primary, #f8fafc)',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              <MessageSquare size={18} />
              My Submissions ({recentFeedbacks.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Track By ID & Quick Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Track Case Card */}
        <div
          style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#38bdf8' }}>
            <Search size={20} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Track Case by ID</h2>
          </div>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', margin: '0 0 1.2rem 0' }}>
            Enter your Feedback or Complaint ID (e.g. <code>FB-2026-000124</code>) to check live review status, official investigation notes, and department responses.
          </p>

          <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="FB-2026-000001"
              value={trackingId}
              onChange={(e) => {
                setTrackingId(e.target.value);
                setTrackingError('');
              }}
              style={{
                flex: 1,
                padding: '0.65rem 0.9rem',
                borderRadius: '6px',
                background: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-primary, #fff)',
                fontSize: '0.9rem'
              }}
            />
            <button
              type="submit"
              disabled={trackingLoading}
              style={{
                padding: '0.65rem 1.1rem',
                borderRadius: '6px',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Track
            </button>
          </form>
          {trackingError && (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {trackingError}
            </div>
          )}
        </div>

        {/* Status Snapshot Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div
            style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', fontWeight: '500' }}>
              In Progress / Review
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0' }}>
              <span style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>{activeCount}</span>
              <Clock size={16} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
              Under active departmental review
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', fontWeight: '500' }}>
              Resolved Cases
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0' }}>
              <span style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>{resolvedCount}</span>
              <CheckCircle2 size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
              Completed and response verified
            </div>
          </div>
        </div>
      </div>

      {/* Recent Feedback Section */}
      <div
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color, #334155)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, color: 'var(--text-primary, #f8fafc)' }}>
            My Recent Submissions
          </h2>
          <Link
            to="/patient/feedback/my"
            style={{ color: '#38bdf8', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading your feedback history...
          </div>
        ) : recentFeedbacks.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <MessageSquare size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.95rem' }}>No feedback submitted yet.</p>
            <p style={{ margin: '0.5rem 0 1.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              Have comments on your hospital visit, appointment, or inpatient stay?
            </p>
            <Link
              to="/patient/feedback/new"
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                background: '#0284c7',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <FilePlus size={16} /> Submit Your First Feedback
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color, #334155)', color: 'var(--text-muted, #94a3b8)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Case ID</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Subject</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Rating</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentFeedbacks.map((item) => (
                  <tr
                    key={item.feedbackId}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#38bdf8' }}>
                      {item.feedbackId}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {item.type.replace('_', ' ')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {item.category}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.subject}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {item.rating ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#fbbf24', fontSize: '0.8rem', fontWeight: '600' }}>
                          <Star size={13} fill="#fbbf24" />
                          <span>{item.rating}/5</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <FeedbackStatusBadge status={item.status} />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <Link
                        to={`/patient/feedback/${item.feedbackId}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: '#38bdf8',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '0.8rem'
                        }}
                      >
                        Details <ChevronRight size={13} />
                      </Link>
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

export default FeedbackHome;
