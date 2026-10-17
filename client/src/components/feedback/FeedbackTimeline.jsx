import React from 'react';
import {
  Clock,
  CheckCircle,
  FileText,
  UserCheck,
  Send,
  Search,
  RotateCcw,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const FeedbackTimeline = ({ feedback, investigation, assignmentHistory = [] }) => {
  if (!feedback) return null;

  const events = [];

  // 1. Submission
  if (feedback.createdAt) {
    events.push({
      id: 'evt-submitted',
      timestamp: new Date(feedback.createdAt),
      title: 'Feedback Submitted',
      description: `Case registered via ${feedback.source || 'Portal'}. Feedback ID: ${feedback.feedbackId}`,
      icon: FileText,
      color: '#38bdf8'
    });
  }

  // 2. Assignment History
  assignmentHistory.forEach((asgn, idx) => {
    events.push({
      id: `evt-asgn-${idx}`,
      timestamp: new Date(asgn.assignedAt),
      title: `Assigned to ${asgn.toUserName || asgn.toDepartmentName || 'Department'}`,
      description: asgn.reason || 'Assigned for investigation and administrative follow-up.',
      icon: UserCheck,
      color: '#2dd4bf'
    });
  });

  // 3. Investigation
  if (investigation?.startedAt) {
    events.push({
      id: 'evt-inv-start',
      timestamp: new Date(investigation.startedAt),
      title: 'Investigation Initiated',
      description: `Investigator: ${investigation.investigatorName}`,
      icon: Search,
      color: '#c084fc'
    });
  }

  if (investigation?.approvedAt) {
    events.push({
      id: 'evt-inv-approved',
      timestamp: new Date(investigation.approvedAt),
      title: 'Investigation Findings Approved',
      description: `Conclusion: ${investigation.conclusion || 'Investigation completed successfully.'}`,
      icon: CheckCircle,
      color: '#a855f7'
    });
  }

  // 4. Response
  if (feedback.response?.respondedAt) {
    events.push({
      id: 'evt-resp-draft',
      timestamp: new Date(feedback.response.respondedAt),
      title: 'Response Drafted',
      description: `Drafted by ${feedback.response.respondedByName || 'Staff'}`,
      icon: Clock,
      color: '#94a3b8'
    });
  }

  if (feedback.response?.approvedAt) {
    events.push({
      id: 'evt-resp-approved',
      timestamp: new Date(feedback.response.approvedAt),
      title: 'Response Approved',
      description: `Approved by ${feedback.response.approvedByName || 'Supervisor'}`,
      icon: CheckCircle,
      color: '#34d399'
    });
  }

  if (feedback.response?.status === 'SENT') {
    events.push({
      id: 'evt-resp-sent',
      timestamp: new Date(feedback.response.approvedAt || feedback.updatedAt),
      title: 'Official Response Dispatched',
      description: 'Patient notification sent.',
      icon: Send,
      color: '#06b6d4'
    });
  }

  // 5. Resolution
  if (feedback.resolution?.resolvedAt) {
    events.push({
      id: 'evt-resolved',
      timestamp: new Date(feedback.resolution.resolvedAt),
      title: 'Case Resolved',
      description: feedback.resolution.summary || 'Administrative resolution recorded.',
      icon: CheckCircle,
      color: '#10b981'
    });
  }

  // 6. Closure
  if (feedback.closure?.closedAt) {
    events.push({
      id: 'evt-closed',
      timestamp: new Date(feedback.closure.closedAt),
      title: 'Case Closed',
      description: feedback.closure.notes || 'Formal case closure concluded.',
      icon: CheckCircle,
      color: '#64748b'
    });
  }

  // 7. Reopening
  if (feedback.reopen?.reopenedAt) {
    events.push({
      id: 'evt-reopened',
      timestamp: new Date(feedback.reopen.reopenedAt),
      title: 'Case Reopened',
      description: `Reopened by ${feedback.reopen.reopenedByName || 'Patient'}: "${feedback.reopen.reason}"`,
      icon: RotateCcw,
      color: '#f43f5e'
    });
  }

  // Sort chronologically
  events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div style={{ position: 'relative', paddingLeft: '1.5rem', marginTop: '1rem' }}>
      {/* Vertical line connecting events */}
      <div
        style={{
          position: 'absolute',
          left: '7px',
          top: '8px',
          bottom: '8px',
          width: '2px',
          backgroundColor: 'var(--border-color, #334155)'
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {events.map((evt) => {
          const Icon = evt.icon;
          return (
            <div key={evt.id} style={{ position: 'relative', display: 'flex', gap: '1rem' }}>
              {/* Event node dot */}
              <div
                style={{
                  position: 'absolute',
                  left: '-1.5rem',
                  top: '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: evt.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 10px ${evt.color}60`
                }}
              />

              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  flex: 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: evt.color, fontSize: '0.85rem' }}>
                    <Icon size={14} />
                    <span>{evt.title}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                    {evt.timestamp.toLocaleString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.4 }}>
                  {evt.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
