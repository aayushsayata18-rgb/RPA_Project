import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  Building,
  User,
  Calendar,
  ShieldCheck,
  Send,
  Star
} from 'lucide-react';
import feedbackService from '../../../services/feedbackService';
import { FeedbackStatusBadge } from '../../../components/feedback/FeedbackStatusBadge';
import { PriorityBadge } from '../../../components/feedback/PriorityBadge';
import { SLAIndicator } from '../../../components/feedback/SLAIndicator';
import { FeedbackTimeline } from '../../../components/feedback/FeedbackTimeline';
import { RatingInput } from '../../../components/feedback/RatingInput';

export const FeedbackDetails = () => {
  const { feedbackId } = useParams();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reopen Modal State
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenLoading, setReopenLoading] = useState(false);
  const [reopenError, setReopenError] = useState('');

  useEffect(() => {
    fetchFeedbackDetails();
  }, [feedbackId]);

  const fetchFeedbackDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await feedbackService.getFeedbackById(feedbackId);
      setFeedback(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load feedback details. Please check the ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      setReopenError('Please provide a reason why you would like this case reopened.');
      return;
    }

    try {
      setReopenLoading(true);
      setReopenError('');
      await feedbackService.reopenFeedback(feedbackId, { reason: reopenReason.trim() });
      setShowReopenModal(false);
      setReopenReason('');
      fetchFeedbackDetails();
    } catch (err) {
      setReopenError(err.message || 'Failed to submit reopening request.');
    } finally {
      setReopenLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '3rem auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading case details for {feedbackId}...
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div style={{ maxWidth: '650px', margin: '3rem auto', padding: '0 1rem', textAlign: 'center' }}>
        <div
          style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            padding: '2.5rem'
          }}
        >
          <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Case Not Found or Inaccessible
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0 1.5rem 0' }}>
            {error || `Unable to retrieve feedback case ${feedbackId}. Please verify the case tracking ID.`}
          </p>
          <button
            onClick={() => navigate('/patient/feedback')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '6px',
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Back to Feedback Hub
          </button>
        </div>
      </div>
    );
  }

  const canReopen = ['RESOLVED', 'CLOSED'].includes(feedback.status);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/patient/feedback')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #94a3b8)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            padding: 0,
            fontSize: '0.85rem'
          }}
        >
          <ArrowLeft size={16} /> Back to Feedback Hub
        </button>

        {canReopen && (
          <button
            onClick={() => setShowReopenModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fb7185',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} /> Request Reopening
          </button>
        )}
      </div>

      {/* Main Dossier Card */}
      <div
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          padding: '1.75rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color, #334155)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.04em' }}>
                {feedback.feedbackId}
              </span>
              <FeedbackStatusBadge status={feedback.status} />
              <PriorityBadge priority={feedback.priority} />
            </div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary, #f8fafc)', margin: 0 }}>
              {feedback.subject}
            </h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SLA Target Status</div>
            <div style={{ marginTop: '0.25rem' }}>
              <SLAIndicator dueAt={feedback.dueAt} slaStatus={feedback.slaStatus} status={feedback.status} />
            </div>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type</div>
            <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {feedback.type.replace('_', ' ')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department / Category</div>
            <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {feedback.assignedDepartmentName || feedback.category}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submission Date</div>
            <div style={{ fontSize: '0.88rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
              {new Date(feedback.createdAt).toLocaleString()}
            </div>
          </div>

          {feedback.rating && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Experience Rating</div>
              <div style={{ marginTop: '0.15rem' }}>
                <RatingInput value={feedback.rating} readOnly size={16} />
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Submitted Details
          </h3>
          <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary, #fff)', lineHeight: '1.6', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            {feedback.description}
          </p>
        </div>

        {/* Official Hospital Response Card (if sent) */}
        {feedback.response?.text && feedback.response?.status === 'SENT' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              <Send size={16} /> Official Hospital Response
            </div>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
              {feedback.response.text}
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Dispatched: {new Date(feedback.response.approvedAt || feedback.response.respondedAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Resolution Card (if resolved) */}
        {feedback.resolution?.summary && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              <CheckCircle2 size={16} /> Resolution Summary
            </div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {feedback.resolution.summary}
            </p>
            {feedback.resolution.actionTaken && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong>Corrective Action:</strong> {feedback.resolution.actionTaken}
              </div>
            )}
          </div>
        )}

        {/* Reopen notice if currently reopened */}
        {feedback.status === 'REOPENED' && feedback.reopen && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fb7185', fontWeight: '600', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
              <RotateCcw size={15} /> Case Reopened for Secondary Review
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Reason: "{feedback.reopen.reason}"
            </p>
          </div>
        )}

        {/* Case Progression Timeline */}
        <div style={{ borderTop: '1px solid var(--border-color, #334155)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>
            Case Progression Timeline
          </h3>
          <FeedbackTimeline
            feedback={feedback}
            investigation={feedback.investigation}
            assignmentHistory={feedback.assignmentHistory}
          />
        </div>
      </div>

      {/* Reopen Request Modal */}
      {showReopenModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '12px',
              padding: '1.75rem',
              maxWidth: '500px',
              width: '100%'
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Request Case Reopening
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              If you feel the issue was not fully addressed or has recurred, please explain your feedback for our administrative team.
            </p>

            {reopenError && (
              <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                {reopenError}
              </div>
            )}

            <form onSubmit={handleReopenSubmit}>
              <textarea
                rows={4}
                placeholder="Describe why you are requesting reopening..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  background: 'var(--bg-input, #0f172a)',
                  border: '1px solid var(--border-color, #334155)',
                  color: 'var(--text-primary, #fff)',
                  fontSize: '0.88rem',
                  resize: 'vertical',
                  marginBottom: '1rem'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: '1px solid var(--border-color, #334155)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopenLoading}
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '6px',
                    background: '#f43f5e',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '600',
                    cursor: reopenLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {reopenLoading ? 'Submitting...' : 'Submit Reopen Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDetails;
