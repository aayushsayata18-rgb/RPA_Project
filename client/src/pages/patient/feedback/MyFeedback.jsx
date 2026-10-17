import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  FilePlus,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  ArrowUpDown
} from 'lucide-react';
import feedbackService from '../../../services/feedbackService';
import { FeedbackStatusBadge } from '../../../components/feedback/FeedbackStatusBadge';
import { SLAIndicator } from '../../../components/feedback/SLAIndicator';

export const MyFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyFeedbacks();
  }, [statusFilter, typeFilter]);

  const fetchMyFeedbacks = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await feedbackService.getMyFeedback(params);
      setFeedbacks(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch your feedback records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMyFeedbacks();
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.feedbackId?.toLowerCase().includes(term) ||
      f.subject?.toLowerCase().includes(term) ||
      f.category?.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', margin: '0 0 0.35rem 0', color: 'var(--text-primary, #f8fafc)' }}>
            My Feedback & Grievances
          </h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: 0, fontSize: '0.88rem' }}>
            Track your submitted feedback, check departmental investigations, and view resolutions.
          </p>
        </div>

        <Link
          to="/patient/feedback/new"
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '0.88rem',
            fontWeight: '600'
          }}
        >
          <FilePlus size={16} /> New Feedback
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, minWidth: '220px', gap: '0.5rem' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by ID, subject, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                borderRadius: '6px',
                background: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-primary, #fff)',
                fontSize: '0.88rem'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color, #334155)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '6px',
              background: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              color: 'var(--text-primary, #fff)',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="INVESTIGATION">In Investigation</option>
            <option value="RESPONSE_SENT">Response Available</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REOPENED">Reopened</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '6px',
              background: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              color: 'var(--text-primary, #fff)',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Types</option>
            <option value="COMPLAINT">Complaint</option>
            <option value="SERVICE_FEEDBACK">Service Feedback</option>
            <option value="SUGGESTION">Suggestion</option>
            <option value="COMPLIMENT">Compliment</option>
            <option value="BILLING_FEEDBACK">Billing Feedback</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading your submissions...
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <MessageSquare size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>No feedback found matching the selected criteria.</p>
            {(statusFilter || typeFilter || searchTerm) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setTypeFilter('');
                  setSearchTerm('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  textDecoration: 'underline'
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color, #334155)', color: 'var(--text-muted, #94a3b8)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Case ID</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Subject</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Rating</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>SLA Target</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Submitted</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.map((item) => (
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
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <FeedbackStatusBadge status={item.status} />
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <SLAIndicator dueAt={item.dueAt} slaStatus={item.slaStatus} status={item.status} />
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
                          fontSize: '0.82rem'
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

export default MyFeedback;
