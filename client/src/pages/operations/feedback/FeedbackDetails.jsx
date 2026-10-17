import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Send,
  MessageSquare,
  FileCheck,
  UserCheck,
  Shield,
  ShieldAlert,
  Building,
  User,
  PauseCircle,
  PlayCircle,
  FilePlus,
  Flame,
  ChevronRight,
  Eye,
  Plus
} from 'lucide-react';
import feedbackService from '../../../services/feedbackService';
import { FeedbackStatusBadge } from '../../../components/feedback/FeedbackStatusBadge';
import { PriorityBadge } from '../../../components/feedback/PriorityBadge';
import { SLAIndicator } from '../../../components/feedback/SLAIndicator';
import { RatingInput } from '../../../components/feedback/RatingInput';
import { FeedbackTimeline } from '../../../components/feedback/FeedbackTimeline';

export const FeedbackDetails = () => {
  const { feedbackId } = useParams();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'investigation', 'response', 'notes', 'history'

  // Action states & modals
  const [noteText, setNoteText] = useState('');
  const [noteVisibility, setNoteVisibility] = useState('INTERNAL');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Investigation form
  const [invFindings, setInvFindings] = useState('');
  const [invConclusion, setInvConclusion] = useState('');
  const [invRecommendation, setInvRecommendation] = useState('');
  const [invSubmitting, setInvSubmitting] = useState(false);

  // Response form
  const [responseText, setResponseText] = useState('');
  const [respSubmitting, setRespSubmitting] = useState(false);

  // Resolution form
  const [resolveSummary, setResolveSummary] = useState('');
  const [resolveAction, setResolveAction] = useState('');
  const [resolveModal, setResolveModal] = useState(false);

  // Reopen form
  const [reopenReason, setReopenReason] = useState('');
  const [reopenModal, setReopenModal] = useState(false);

  useEffect(() => {
    fetchDossier();
  }, [feedbackId]);

  const fetchDossier = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await feedbackService.getFeedbackById(feedbackId);
      const data = res.data;
      setFeedback(data);

      if (data.investigation) {
        setInvFindings(data.investigation.findings || '');
        setInvConclusion(data.investigation.conclusion || '');
        setInvRecommendation(data.investigation.recommendation || '');
      }

      if (data.response?.text) {
        setResponseText(data.response.text);
      }
    } catch (err) {
      setError(err.message || 'Failed to load feedback dossier.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      setNoteSubmitting(true);
      await feedbackService.addInternalNote(feedbackId, {
        note: noteText.trim(),
        visibility: noteVisibility
      });
      setNoteText('');
      fetchDossier();
    } catch (err) {
      alert(`Note failed: ${err.message}`);
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleStartInvestigation = async () => {
    try {
      await feedbackService.startInvestigation(feedbackId, { notes: 'Supervisory investigation started.' });
      fetchDossier();
      setActiveTab('investigation');
    } catch (err) {
      alert(`Error starting investigation: ${err.message}`);
    }
  };

  const handleSaveInvestigation = async (status = 'IN_PROGRESS') => {
    if (!feedback?.investigation?.investigationId) return;
    try {
      setInvSubmitting(true);
      await feedbackService.updateInvestigation(feedbackId, {
        investigationId: feedback.investigation.investigationId,
        findings: invFindings,
        conclusion: invConclusion,
        recommendation: invRecommendation,
        status
      });
      fetchDossier();
    } catch (err) {
      alert(`Error saving investigation: ${err.message}`);
    } finally {
      setInvSubmitting(false);
    }
  };

  const handleApproveInvestigation = async () => {
    if (!feedback?.investigation?.investigationId) return;
    try {
      await feedbackService.approveInvestigation(feedbackId, {
        investigationId: feedback.investigation.investigationId,
        notes: 'Administrative signoff completed.'
      });
      fetchDossier();
    } catch (err) {
      alert(`Error approving investigation: ${err.message}`);
    }
  };

  const handleDraftResponse = async () => {
    if (!responseText.trim()) return;
    try {
      setRespSubmitting(true);
      await feedbackService.draftResponse(feedbackId, responseText.trim());
      fetchDossier();
    } catch (err) {
      alert(`Error drafting response: ${err.message}`);
    } finally {
      setRespSubmitting(false);
    }
  };

  const handleApproveResponse = async () => {
    try {
      await feedbackService.approveResponse(feedbackId);
      fetchDossier();
    } catch (err) {
      alert(`Error approving response: ${err.message}`);
    }
  };

  const handleSendResponse = async () => {
    try {
      await feedbackService.sendResponse(feedbackId);
      fetchDossier();
    } catch (err) {
      alert(`Error sending response: ${err.message}`);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    try {
      await feedbackService.resolveFeedback(feedbackId, {
        summary: resolveSummary,
        actionTaken: resolveAction
      });
      setResolveModal(false);
      fetchDossier();
    } catch (err) {
      alert(`Resolution failed: ${err.message}`);
    }
  };

  const handleCloseCase = async () => {
    if (!window.confirm('Are you sure you want to officially close this feedback case?')) return;
    try {
      await feedbackService.closeFeedback(feedbackId, { notes: 'Satisfactory closure confirmed.' });
      fetchDossier();
    } catch (err) {
      alert(`Closure error: ${err.message}`);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    try {
      await feedbackService.reopenFeedback(feedbackId, { reason: reopenReason });
      setReopenModal(false);
      setReopenReason('');
      fetchDossier();
    } catch (err) {
      alert(`Reopen error: ${err.message}`);
    }
  };

  const handleEscalate = async () => {
    const reason = window.prompt('Specify escalation reason:');
    if (!reason) return;
    try {
      await feedbackService.escalateFeedback(feedbackId, { reason });
      fetchDossier();
    } catch (err) {
      alert(`Escalation error: ${err.message}`);
    }
  };

  const handlePauseResumeSLA = async () => {
    if (feedback.slaStatus === 'PAUSED') {
      await feedbackService.resumeSLA(feedbackId);
      fetchDossier();
    } else {
      const reason = window.prompt('Enter reason for pausing SLA timer:');
      if (!reason) return;
      await feedbackService.pauseSLA(feedbackId, reason);
      fetchDossier();
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '3rem auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Feedback Dossier {feedbackId}...
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div style={{ maxWidth: '650px', margin: '3rem auto', textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-card, #1e293b)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color, #334155)' }}>
          <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Dossier Not Available</h3>
          <p style={{ color: 'var(--text-muted)' }}>{error || 'The requested feedback record could not be loaded.'}</p>
          <Link to="/operations/feedback/list" style={{ color: '#38bdf8' }}>Back to Directory</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1350px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          onClick={() => navigate('/operations/feedback/list')}
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
          <ArrowLeft size={16} /> Back to Feedback Console
        </button>

        {/* Action Buttons Toolbar */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {feedback.slaStatus === 'PAUSED' ? (
            <button
              onClick={handlePauseResumeSLA}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10b981',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <PlayCircle size={14} /> Resume SLA
            </button>
          ) : (
            <button
              onClick={handlePauseResumeSLA}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                background: 'rgba(234, 88, 12, 0.15)',
                border: '1px solid rgba(234, 88, 12, 0.4)',
                color: '#ea580c',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <PauseCircle size={14} /> Pause SLA
            </button>
          )}

          {feedback.status !== 'ESCALATED' && !['RESOLVED', 'CLOSED'].includes(feedback.status) && (
            <button
              onClick={handleEscalate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <ShieldAlert size={14} /> Escalate Case
            </button>
          )}

          {!['RESOLVED', 'CLOSED'].includes(feedback.status) && (
            <button
              onClick={() => setResolveModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                background: '#059669',
                color: '#fff',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={14} /> Mark Resolved
            </button>
          )}

          {feedback.status === 'RESOLVED' && (
            <button
              onClick={handleCloseCase}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                background: '#334155',
                color: '#fff',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={14} /> Close Case
            </button>
          )}

          {['RESOLVED', 'CLOSED'].includes(feedback.status) && (
            <button
              onClick={() => setReopenModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#fb7185',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={14} /> Reopen Case
            </button>
          )}
        </div>
      </div>

      {/* Main Dossier Header */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.45rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.04em' }}>
                {feedback.feedbackId}
              </span>
              <FeedbackStatusBadge status={feedback.status} />
              <PriorityBadge priority={feedback.priority} />
              {feedback.confidentiality?.restricted && (
                <span style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>
                  RESTRICTED ACCESS
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
              {feedback.subject}
            </h1>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Source: <strong>{feedback.source}</strong> | Submitter: <strong>{feedback.patientName}</strong> {feedback.patientId && `(${feedback.patientId})`}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Resolution SLA Status</div>
            <SLAIndicator dueAt={feedback.dueAt} slaStatus={feedback.slaStatus} status={feedback.status} />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Due: {feedback.dueAt ? new Date(feedback.dueAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Quick Context Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department</div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
              {feedback.assignedDepartmentName || 'Unassigned'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Staff</div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.88rem' }}>
              {feedback.assignedToName || 'Pending Assignment'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Associated Visit / Adm</div>
            <div style={{ fontWeight: '500', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {feedback.visitId || feedback.admissionId || 'Outpatient / General'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submitted Rating</div>
            <div style={{ marginTop: '0.15rem' }}>
              {feedback.rating ? <RatingInput value={feedback.rating} readOnly size={16} /> : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color, #334155)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {[
          { key: 'overview', label: 'Overview & Details', icon: Eye },
          { key: 'investigation', label: `Investigation (${feedback.investigation ? feedback.investigation.status : 'None'})`, icon: Search },
          { key: 'response', label: `Patient Response (${feedback.response?.status || 'None'})`, icon: Send },
          { key: 'notes', label: `Internal Notes (${feedback.internalNotes?.length || 0})`, icon: MessageSquare },
          { key: 'history', label: 'Audit Timeline', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.75rem 1.15rem',
                border: 'none',
                borderBottom: `2px solid ${isActive ? '#38bdf8' : 'transparent'}`,
                background: 'transparent',
                color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer',
                fontSize: '0.88rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>
              Full Complaint Narrative
            </h3>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.15rem', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: '1.6', border: '1px solid var(--border-color, #334155)', minHeight: '120px' }}>
              {feedback.description}
            </div>

            {feedback.resolution?.summary && (
              <div style={{ marginTop: '1.5rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '1.15rem' }}>
                <div style={{ fontWeight: '700', color: '#10b981', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  Resolution Summary
                </div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  {feedback.resolution.summary}
                </p>
                {feedback.resolution.actionTaken && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Action:</strong> {feedback.resolution.actionTaken}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>
              Patient Context & Identifiers
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Submitter: </span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{feedback.patientName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Patient ID: </span>
                <span style={{ fontWeight: '600', color: '#38bdf8' }}>{feedback.patientId || 'Not linked'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Contact: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{feedback.patientPhone || feedback.patientEmail || 'Not provided'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Invoice ID: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{feedback.invoiceId || 'None'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Confidentiality Level: </span>
                <span style={{ fontWeight: '600', color: feedback.confidentiality?.restricted ? '#f87171' : 'var(--text-primary)' }}>
                  {feedback.confidentiality?.level || 'NORMAL'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Investigation */}
      {activeTab === 'investigation' && (
        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '1.75rem' }}>
          {!feedback.investigation ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <Search size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No Active Investigation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>
                Initiate a formal administrative review to capture root causes, supervisor findings, and process recommendations.
              </p>
              <button
                onClick={handleStartInvestigation}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '6px',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Search size={16} /> Initiate Formal Investigation
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    Investigation Dossier: {feedback.investigation.investigationId}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Investigator: <strong>{feedback.investigation.investigatorName}</strong> | Status: <strong>{feedback.investigation.status}</strong>
                  </div>
                </div>

                {feedback.investigation.status !== 'APPROVED' && (
                  <button
                    onClick={handleApproveInvestigation}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    <CheckCircle2 size={14} /> Approve & Sign Off Investigation
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Investigative Findings
                </label>
                <textarea
                  rows={4}
                  value={invFindings}
                  onChange={(e) => setInvFindings(e.target.value)}
                  placeholder="Record factual observations, timeline checks, staff interviews..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    background: 'var(--bg-input, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Root Cause Conclusion
                  </label>
                  <textarea
                    rows={3}
                    value={invConclusion}
                    onChange={(e) => setInvConclusion(e.target.value)}
                    placeholder="Summarize the core root cause..."
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '6px',
                      background: 'var(--bg-input, #0f172a)',
                      border: '1px solid var(--border-color, #334155)',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Corrective Recommendation
                  </label>
                  <textarea
                    rows={3}
                    value={invRecommendation}
                    onChange={(e) => setInvRecommendation(e.target.value)}
                    placeholder="Recommendations to avoid recurrence..."
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '6px',
                      background: 'var(--bg-input, #0f172a)',
                      border: '1px solid var(--border-color, #334155)',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  disabled={invSubmitting}
                  onClick={() => handleSaveInvestigation('IN_PROGRESS')}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color, #334155)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={invSubmitting}
                  onClick={() => handleSaveInvestigation('COMPLETED')}
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '6px',
                    background: '#7c3aed',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {invSubmitting ? 'Saving...' : 'Mark Findings Completed'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Response */}
      {activeTab === 'response' && (
        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Official Patient-Facing Response
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Status: <strong>{feedback.response?.status || 'NONE'}</strong>
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
            Internal notes and investigation evidence are strictly separated. Only the text entered below will be made visible to the patient upon dispatch.
          </p>

          <div style={{ marginBottom: '1.25rem' }}>
            <textarea
              rows={5}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Draft official hospital response to patient..."
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '6px',
                background: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                color: '#fff',
                fontSize: '0.9rem',
                lineHeight: '1.5'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleDraftResponse}
              disabled={respSubmitting}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color, #334155)',
                color: '#fff',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {respSubmitting ? 'Saving...' : 'Save Draft Response'}
            </button>

            {feedback.response?.status !== 'APPROVED' && feedback.response?.status !== 'SENT' && (
              <button
                onClick={handleApproveResponse}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '6px',
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Approve Draft
              </button>
            )}

            {feedback.response?.status === 'APPROVED' && (
              <button
                onClick={handleSendResponse}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Send size={15} /> Dispatch Response to Patient
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Internal Notes */}
      {activeTab === 'notes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Notes Feed */}
          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              Internal Discussion & Notes
            </h3>

            {(!feedback.internalNotes || feedback.internalNotes.length === 0) ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No internal notes recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {feedback.internalNotes.map((note) => (
                  <div
                    key={note.noteId}
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid var(--border-color, #334155)',
                      borderRadius: '8px',
                      padding: '0.85rem 1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: '600', color: '#38bdf8', fontSize: '0.82rem' }}>
                        {note.authorName} ({note.authorRole})
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {note.note}
                    </p>
                    <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Visibility: {note.visibility}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Note Form */}
          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>
              Add Confidential Note
            </h3>

            <form onSubmit={handleAddNote}>
              <div style={{ marginBottom: '1rem' }}>
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type internal note (only visible to authorized staff)..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    background: 'var(--bg-input, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Visibility Level:
                </label>
                <select
                  value={noteVisibility}
                  onChange={(e) => setNoteVisibility(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: 'var(--bg-input, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: '#fff',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="INTERNAL">Internal (Assigned Department & Staff)</option>
                  <option value="RESTRICTED">Restricted (Designated Managers Only)</option>
                  <option value="MANAGEMENT_ONLY">Management Only (Executive Oversight)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={noteSubmitting}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: noteSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {noteSubmitting ? 'Saving Note...' : 'Add Note to Dossier'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 5: History & Progression */}
      {activeTab === 'history' && (
        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
            Complete Case Audit & Event Progression
          </h3>
          <FeedbackTimeline
            feedback={feedback}
            investigation={feedback.investigation}
            assignmentHistory={feedback.assignmentHistory}
          />
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '1.75rem', maxWidth: '520px', width: '100%' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Mark Feedback Resolved</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Document the administrative resolution and corrective measures taken.
            </p>

            <form onSubmit={handleResolveSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Resolution Summary:
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolveSummary}
                  onChange={(e) => setResolveSummary(e.target.value)}
                  placeholder="e.g. Protocol updated and corrective cleaning deployed..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: 'var(--bg-input, #0f172a)', border: '1px solid var(--border-color, #334155)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Action Taken:
                </label>
                <input
                  type="text"
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value)}
                  placeholder="e.g. Staggered shift rosters deployed"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'var(--bg-input, #0f172a)', border: '1px solid var(--border-color, #334155)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setResolveModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.15rem', borderRadius: '6px', background: '#059669', color: '#fff', border: 'none', fontWeight: '600' }}
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {reopenModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '1.75rem', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Reopen Case for Secondary Review</h3>
            <form onSubmit={handleReopenSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Reopening Reason:
                </label>
                <textarea
                  rows={4}
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Specify reason for reopening case..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: 'var(--bg-input, #0f172a)', border: '1px solid var(--border-color, #334155)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setReopenModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-color, #334155)', color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.15rem', borderRadius: '6px', background: '#f43f5e', color: '#fff', border: 'none', fontWeight: '600' }}
                >
                  Reopen Case
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
