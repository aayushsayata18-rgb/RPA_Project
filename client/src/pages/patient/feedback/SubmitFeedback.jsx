import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FilePlus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Shield,
  HelpCircle,
  Paperclip,
  EyeOff
} from 'lucide-react';
import feedbackService from '../../../services/feedbackService';
import { RatingInput } from '../../../components/feedback/RatingInput';

const CATEGORIES = [
  'Housekeeping',
  'Reception',
  'Billing',
  'Pharmacy',
  'Laboratory',
  'Radiology',
  'Nursing',
  'Clinical Service',
  'Maintenance',
  'Facilities',
  'Food Services',
  'Waiting Time',
  'Staff Conduct',
  'Other'
];

const FEEDBACK_TYPES = [
  { value: 'COMPLAINT', label: 'Formal Complaint / Grievance', desc: 'Report an issue requiring investigation & resolution' },
  { value: 'SERVICE_FEEDBACK', label: 'General Service Feedback', desc: 'Share your impressions and feedback on our facilities' },
  { value: 'SUGGESTION', label: 'Improvement Suggestion', desc: 'Propose ideas to help improve care processes' },
  { value: 'COMPLIMENT', label: 'Staff Compliment / Praise', desc: 'Acknowledge an employee or clinical team for excellent care' }
];

export const SubmitFeedback = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: 'COMPLAINT',
    category: 'Housekeeping',
    subcategory: '',
    subject: '',
    description: '',
    rating: 3,
    priority: 'MEDIUM',
    visitId: '',
    admissionId: '',
    invoiceId: '',
    anonymous: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleRatingChange = (newRating) => {
    setFormData((prev) => ({ ...prev, rating: newRating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      setError('Please provide a subject summary for your feedback.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please describe your feedback or grievance in detail.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        ...formData,
        rating: formData.rating ? Number(formData.rating) : null
      };

      const res = await feedbackService.submitFeedback(payload);
      setSubmittedFeedback(res.data);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submittedFeedback) {
    return (
      <div style={{ maxWidth: '650px', margin: '3rem auto', padding: '0 1rem' }}>
        <div
          style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '16px',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: '#10b981'
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: 'var(--text-primary, #f8fafc)' }}>
            Feedback Successfully Registered
          </h2>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem', margin: '0 0 1.5rem 0' }}>
            Thank you for bringing your feedback to our attention. An acknowledgement has been logged in our system.
          </p>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px dashed #38bdf8',
              borderRadius: '10px',
              padding: '1.25rem',
              marginBottom: '1.75rem'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Your Case Tracking ID
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.05em', margin: '0.25rem 0' }}>
              {submittedFeedback.feedbackId}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Assigned Department: <strong>{submittedFeedback.assignedDepartmentName || submittedFeedback.category}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link
              to={`/patient/feedback/${submittedFeedback.feedbackId}`}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                background: '#0284c7',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              Track Case Details
            </Link>

            <Link
              to="/patient/feedback"
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-primary, #f8fafc)',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              Back to Feedback Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
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
            fontSize: '0.85rem',
            marginBottom: '0.75rem'
          }}
        >
          <ArrowLeft size={16} /> Back to Feedback Hub
        </button>

        <h1 style={{ fontSize: '1.65rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: 'var(--text-primary, #f8fafc)' }}>
          Submit Feedback or Grievance
        </h1>
        <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: 0, fontSize: '0.9rem' }}>
          Please complete the form below. Your submission will be routed directly to the designated department with SLA monitoring.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.9rem 1rem',
            color: '#f87171',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Type Selection */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary, #f8fafc)', marginBottom: '0.75rem' }}>
            What kind of feedback are you sharing?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {FEEDBACK_TYPES.map((t) => {
              const isSelected = formData.type === t.value;
              return (
                <div
                  key={t.value}
                  onClick={() => setFormData((prev) => ({ ...prev, type: t.value }))}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `1.5px solid ${isSelected ? '#38bdf8' : 'var(--border-color, #334155)'}`,
                    background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '0.88rem', color: isSelected ? '#38bdf8' : 'var(--text-primary, #fff)', marginBottom: '0.25rem' }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.3 }}>
                    {t.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category & Priority Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Service Department / Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
                borderRadius: '6px',
                background: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-primary, #fff)',
                fontSize: '0.9rem'
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Priority Level
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
                borderRadius: '6px',
                background: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-primary, #fff)',
                fontSize: '0.9rem'
              }}
            >
              <option value="LOW">Low (Routine)</option>
              <option value="MEDIUM">Medium (Standard 72h SLA)</option>
              <option value="HIGH">High (Urgent Attention 24h SLA)</option>
              <option value="URGENT">Urgent (4h SLA)</option>
            </select>
          </div>
        </div>

        {/* Rating Component */}
        <div style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color, #334155)' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Rate your overall experience with this service:
          </label>
          <RatingInput value={formData.rating} onChange={handleRatingChange} size={26} />
        </div>

        {/* Subject */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Subject / Headline *
          </label>
          <input
            type="text"
            name="subject"
            placeholder="e.g. Room cleaning delay after discharge / Billing inquiry"
            value={formData.subject}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.65rem 0.9rem',
              borderRadius: '6px',
              background: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              color: 'var(--text-primary, #fff)',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Detailed Description *
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {formData.description.length} characters
            </span>
          </div>
          <textarea
            name="description"
            rows={5}
            placeholder="Please detail dates, location, staff names (if known), or specific observations..."
            value={formData.description}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem 0.9rem',
              borderRadius: '6px',
              background: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              color: 'var(--text-primary, #fff)',
              fontSize: '0.9rem',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Optional References */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color, #334155)'
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Related Visit ID (Optional)
            </label>
            <input
              type="text"
              name="visitId"
              placeholder="e.g. V202600123"
              value={formData.visitId}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                background: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-primary, #fff)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Inpatient Admission ID (Optional)
            </label>
            <input
              type="text"
              name="admissionId"
              placeholder="e.g. ADM10023"
              value={formData.admissionId}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                background: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-primary, #fff)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Invoice / Bill ID (Optional)
            </label>
            <input
              type="text"
              name="invoiceId"
              placeholder="e.g. INV20260915-01"
              value={formData.invoiceId}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                background: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-primary, #fff)',
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>

        {/* Anonymous Option */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <input
            type="checkbox"
            id="anonymous"
            name="anonymous"
            checked={formData.anonymous}
            onChange={handleChange}
            style={{ marginTop: '0.2rem', cursor: 'pointer' }}
          />
          <label htmlFor="anonymous" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Submit Anonymously</strong> — Your name and patient profile will be omitted from the report. Note: Anonymity may prevent direct follow-up contact.
          </label>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/patient/feedback')}
            style={{
              padding: '0.7rem 1.25rem',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px solid var(--border-color, #334155)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.5rem',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <FilePlus size={16} />
            {loading ? 'Submitting...' : 'Register Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitFeedback;
