import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronRight,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowUpDown,
  RefreshCw,
  FilePlus,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';
import feedbackService from '../../../services/feedbackService';
import { FeedbackStatusBadge } from '../../../components/feedback/FeedbackStatusBadge';
import { PriorityBadge } from '../../../components/feedback/PriorityBadge';
import { SLAIndicator } from '../../../components/feedback/SLAIndicator';
import { RatingInput } from '../../../components/feedback/RatingInput';

export const FeedbackList = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [slaStatus, setSlaStatus] = useState('');
  const [search, setSearch] = useState('');

  // Quick Reassign Modal
  const [reassignTarget, setReassignTarget] = useState(null);
  const [reassignDept, setReassignDept] = useState('');
  const [reassignStaff, setReassignStaff] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);

  useEffect(() => {
    fetchList();
  }, [page, status, priority, type, category, slaStatus]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        status: status || undefined,
        priority: priority || undefined,
        type: type || undefined,
        category: category || undefined,
        slaStatus: slaStatus || undefined,
        search: search || undefined
      };
      const res = await feedbackService.getFeedbackList(params);
      setItems(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load feedback list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchList();
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignTarget) return;
    try {
      setReassignLoading(true);
      await feedbackService.assignFeedback(reassignTarget.feedbackId, {
        departmentName: reassignDept,
        assignedToName: reassignStaff,
        reason: reassignReason
      });
      setReassignTarget(null);
      setReassignDept('');
      setReassignStaff('');
      setReassignReason('');
      fetchList();
    } catch (err) {
      alert(`Reassign failed: ${err.message}`);
    } finally {
      setReassignLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', margin: '0 0 0.35rem 0', color: 'var(--text-primary, #f8fafc)' }}>
            Patient Feedback & Grievance Directory
          </h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: 0, fontSize: '0.88rem' }}>
            Administrative registry with role isolation, SLA breach tracking, and investigative routing
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => fetchList()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color, #334155)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by Feedback ID, Patient, Subject, or Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem 0.6rem 2.4rem',
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
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Filter Cases
          </button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'var(--bg-input, #0f172a)', border: '1px solid var(--border-color, #334155)', color: '#fff', fontSize: '0.82rem' }}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="INVESTIGATION">In Investigation</option>
            <option value="RESPONSE_SENT">Response Sent</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REOPENED">Reopened</option>
            <option value="ESCALATED">Escalated</option>
          </select>

          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'var(--bg-input, #0f172a)', border: '1px solid var(--border-color, #334155)', color: '#fff', fontSize: '0.82rem' }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select
            value={slaStatus}
            onChange={(e) => {
              setSlaStatus(e.target.value);
              setPage(1);
            }}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'var(--bg-input, #0f172a)', border: '1px solid var(--border-color, #334155)', color: '#fff', fontSize: '0.82rem' }}
          >
            <option value="">All SLA States</option>
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk</option>
            <option value="BREACHED">Breached</option>
            <option value="PAUSED">Paused</option>
          </select>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'var(--bg-input, #0f172a)', border: '1px solid var(--border-color, #334155)', color: '#fff', fontSize: '0.82rem' }}
          >
            <option value="">All Feedback Types</option>
            <option value="COMPLAINT">Complaint</option>
            <option value="SERVICE_FEEDBACK">Service Feedback</option>
            <option value="SUGGESTION">Suggestion</option>
            <option value="COMPLIMENT">Compliment</option>
            <option value="BILLING_FEEDBACK">Billing</option>
          </select>

          {(status || priority || type || slaStatus || search) && (
            <button
              onClick={() => {
                setStatus('');
                setPriority('');
                setType('');
                setCategory('');
                setSlaStatus('');
                setSearch('');
                setPage(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reset Filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Total Cases: <strong>{total}</strong>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}
      >
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading records...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No feedback cases match the current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.87rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color, #334155)', color: 'var(--text-muted, #94a3b8)' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Feedback ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Patient</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Subject & Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Department / Assignee</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Priority</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>SLA Target</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Rating</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.feedbackId}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#38bdf8' }}>
                      <Link
                        to={`/operations/feedback/${item.feedbackId}`}
                        style={{ color: '#38bdf8', textDecoration: 'none' }}
                      >
                        {item.feedbackId}
                      </Link>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.patientId || 'Guest'}</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.subject}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.type.replace('_', ' ')} • {item.category}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                        {item.assignedDepartmentName || 'Unassigned'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.assignedToName || 'No staff assigned'}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <PriorityBadge priority={item.priority} />
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <FeedbackStatusBadge status={item.status} />
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <SLAIndicator dueAt={item.dueAt} slaStatus={item.slaStatus} status={item.status} />
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {item.rating ? (
                        <span style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.82rem' }}>
                          {item.rating} ★
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setReassignTarget(item)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-color, #334155)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                          title="Quick Reassign"
                        >
                          <UserCheck size={13} />
                        </button>

                        <Link
                          to={`/operations/feedback/${item.feedbackId}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '4px',
                            background: '#0284c7',
                            color: '#fff',
                            textDecoration: 'none',
                            fontSize: '0.78rem',
                            fontWeight: '600'
                          }}
                        >
                          Dossier <ChevronRight size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border-color, #334155)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}
        >
          <div>
            Page {page} of {totalPages}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color, #334155)',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color, #334155)',
                color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Reassign Modal */}
      {reassignTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
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
              maxWidth: '480px',
              width: '100%'
            }}
          >
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              Reassign Case: {reassignTarget.feedbackId}
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Subject: {reassignTarget.subject}
            </p>

            <form onSubmit={handleReassignSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Target Department Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Housekeeping / Biomedical / Finance"
                  value={reassignDept}
                  onChange={(e) => setReassignDept(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    background: 'var(--bg-input, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Assignee Staff Name / ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Supervisor Alice / EMP-HK-001"
                  value={reassignStaff}
                  onChange={(e) => setReassignStaff(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    background: 'var(--bg-input, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Reassignment Reason / Transfer Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify operational reason for transfer..."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    background: 'var(--bg-input, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setReassignTarget(null)}
                  style={{
                    padding: '0.5rem 1rem',
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
                  disabled={reassignLoading}
                  style={{
                    padding: '0.5rem 1.15rem',
                    borderRadius: '6px',
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '600',
                    cursor: reassignLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {reassignLoading ? 'Saving...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
