import React, { useState, useEffect } from 'react';
import opdService from '../../services/opdService';
import appointmentService from '../../services/appointmentService';
import { QueueStatusBadge } from '../../components/opd/QueueStatusBadge';
import { PriorityAssignModal } from '../../components/opd/PriorityAssignModal';
import { TransferTokenModal } from '../../components/opd/TransferTokenModal';
import { SkipTokenModal } from '../../components/opd/SkipTokenModal';
import {
  Layers,
  Search,
  UserCheck,
  PhoneCall,
  Play,
  CheckCircle,
  UserX,
  RotateCcw,
  ArrowRightLeft,
  Pause,
  PlayCircle,
  XCircle,
  Bot,
  RefreshCw,
  AlertCircle,
  Sliders,
  Sparkles,
  Users,
  Clock
} from 'lucide-react';

export const OperationsOpdQueuePage = () => {
  const [queues, setQueues] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState(null);
  const [queueDetails, setQueueDetails] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Front-Desk Check-in Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [overrideAllowed, setOverrideAllowed] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  // Modals state
  const [priorityModalToken, setPriorityModalToken] = useState(null);
  const [transferModalToken, setTransferModalToken] = useState(null);
  const [skipModalToken, setSkipModalToken] = useState(null);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      const res = await opdService.getQueues();
      const list = res.data || [];
      setQueues(list);

      if (list.length > 0 && !selectedQueueId) {
        setSelectedQueueId(list[0].queueId);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load OPD Queues');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedQueueDetails = async (queueId) => {
    if (!queueId) return;
    try {
      const res = await opdService.getQueueById(queueId);
      setQueueDetails(res.data);
    } catch (err) {
      console.error('Failed to load queue details:', err);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  useEffect(() => {
    if (selectedQueueId) {
      fetchSelectedQueueDetails(selectedQueueId);
    }
  }, [selectedQueueId]);

  // Appointment Search for Front-Desk Check-In
  const handleSearchAppointments = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const res = await appointmentService.getAppointments({
        search: searchQuery.trim(),
        date: todayStr
      });
      setSearchResults(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Appointment search failed');
    } finally {
      setSearching(false);
    }
  };

  // Perform Front-Desk Check-in
  const handleFrontDeskCheckIn = async (appointmentId) => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await opdService.checkIn({
        appointmentId,
        channel: 'FRONT_DESK',
        override: overrideAllowed,
        overrideReason: overrideAllowed ? overrideReason || 'Front Desk Staff Override' : null
      });

      setSuccessMsg(`Successfully checked in! Generated Token: ${res.data.tokenNumber}`);
      setSearchResults([]);
      setSearchQuery('');
      setOverrideAllowed(false);
      setOverrideReason('');
      fetchQueues();
      if (selectedQueueId) fetchSelectedQueueDetails(selectedQueueId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Token Actions
  const handleCallToken = async (tokenId) => {
    try {
      setActionLoading(true);
      await opdService.callToken(tokenId);
      setSuccessMsg('Token called successfully');
      fetchQueues();
      fetchSelectedQueueDetails(selectedQueueId);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnToken = async (tokenId) => {
    try {
      setActionLoading(true);
      await opdService.returnToken(tokenId, 'Front-desk return to queue request');
      setSuccessMsg('Token returned to waiting queue');
      fetchQueues();
      fetchSelectedQueueDetails(selectedQueueId);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelToken = async (tokenId) => {
    if (!window.confirm('Are you sure you want to cancel this OPD Token?')) return;
    try {
      setActionLoading(true);
      await opdService.cancelToken(tokenId, 'Cancelled at front-desk request');
      setSuccessMsg('Token cancelled');
      fetchQueues();
      fetchSelectedQueueDetails(selectedQueueId);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Queue Lifecycle
  const handlePauseResumeQueue = async (queue) => {
    try {
      setActionLoading(true);
      if (queue.status === 'PAUSED') {
        await opdService.resumeQueue(queue.queueId);
        setSuccessMsg(`Queue ${queue.queueId} resumed`);
      } else {
        const reason = window.prompt('Enter reason for pausing queue:', 'DOCTOR_UNAVAILABLE');
        if (!reason) return;
        await opdService.pauseQueue(queue.queueId, reason);
        setSuccessMsg(`Queue ${queue.queueId} paused`);
      }
      fetchQueues();
      fetchSelectedQueueDetails(selectedQueueId);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Automated RPA Actions
  const handleProcessNoShows = async () => {
    try {
      setActionLoading(true);
      const res = await opdService.processNoShows({ gracePeriodMinutes: 15 });
      setSuccessMsg(`No-Show process completed. Evaluated: ${res.totalEvaluated}, Marked No-Show: ${res.processedCount}`);
      fetchQueues();
      fetchSelectedQueueDetails(selectedQueueId);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReconcileQueue = async () => {
    try {
      setActionLoading(true);
      const res = await opdService.reconcileQueue();
      setSuccessMsg(`Queue Reconciliation completed. Appointments: ${res.totalAppointments}, Tokens: ${res.totalTokens}, Discrepancies: ${res.discrepanciesCount}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const allTokens = queueDetails?.tokens?.all || [];
  const filteredTokens =
    statusFilter === 'ALL'
      ? allTokens
      : allTokens.filter((t) => t.status === statusFilter);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.08em' }}>
            Operations & Front-Desk
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0.2rem 0 0', color: '#f8fafc' }}>
            OPD Queue Management Desk
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleProcessNoShows}
            disabled={actionLoading}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Bot size={16} color="#38bdf8" /> Run No-Show Check
          </button>
          <button
            onClick={handleReconcileQueue}
            disabled={actionLoading}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RotateCcw size={16} /> Reconcile
          </button>
          <button
            onClick={() => {
              fetchQueues();
              if (selectedQueueId) fetchSelectedQueueDetails(selectedQueueId);
            }}
            className="btn btn-secondary"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Front-Desk Search & Fast Check-In Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <UserCheck size={20} color="#38bdf8" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#f1f5f9' }}>
            Front-Desk Patient Arrival & Check-In
          </h2>
        </div>

        <form onSubmit={handleSearchAppointments} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Search today's appointment by Appointment ID, Patient ID, Phone, or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <button type="submit" disabled={searching} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            {searching ? 'Searching...' : 'Search Appointment'}
          </button>
        </form>

        {/* Manager Override Checkbox */}
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={overrideAllowed}
              onChange={(e) => setOverrideAllowed(e.target.checked)}
            />
            <span>Enable Check-In Window Override (Late/Early Exception)</span>
          </label>

          {overrideAllowed && (
            <input
              type="text"
              placeholder="Enter override authorization reason..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.85rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                minWidth: '260px'
              }}
            />
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Found Appointments ({searchResults.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {searchResults.map((apt) => (
                <div
                  key={apt.appointmentId}
                  style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', color: '#f8fafc' }}>
                      {apt.patientName} ({apt.patientId}) &bull; {apt.startTime}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Dr. {apt.doctorName} &bull; {apt.departmentName} &bull; Ref: {apt.appointmentId}
                    </div>
                  </div>

                  <div>
                    {apt.status === 'CHECKED_IN' ? (
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.85rem' }}>
                        ALREADY CHECKED IN
                      </span>
                    ) : (
                      <button
                        onClick={() => handleFrontDeskCheckIn(apt.appointmentId)}
                        disabled={actionLoading}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        Check In & Generate Token
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Queues Selector Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '0.75rem' }}>
          Today's Department Queues ({queues.length})
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {queues.map((q) => {
            const isSelected = q.queueId === selectedQueueId;
            return (
              <div
                key={q.queueId}
                onClick={() => setSelectedQueueId(q.queueId)}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.1))'
                    : 'var(--bg-card)',
                  border: isSelected ? '2px solid #38bdf8' : '1px solid var(--border-color)',
                  borderRadius: '0.85rem',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '800', color: '#f1f5f9', fontSize: '1rem' }}>
                    {q.departmentName}
                  </span>
                  <QueueStatusBadge status={q.status} />
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Dr: {q.doctorName || 'Department General'} &bull; Room: {q.roomNumber || 'OPD'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Serving: <strong style={{ color: '#a855f7' }}>{q.currentToken || 'None'}</strong>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Waiting: <strong style={{ color: '#38bdf8' }}>{q.totalWaiting || 0}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Queue Token Stream Table */}
      {queueDetails && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '1.5rem'
          }}
        >
          {/* Queue Actions Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                {queueDetails.queue.departmentName} Token Flow
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Queue ID: {queueDetails.queue.queueId} &bull; Total Checked In: {queueDetails.summary.totalCheckedIn}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handlePauseResumeQueue(queueDetails.queue)}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {queueDetails.queue.status === 'PAUSED' ? (
                  <>
                    <PlayCircle size={16} color="#10b981" /> Resume Queue
                  </>
                ) : (
                  <>
                    <Pause size={16} color="#f59e0b" /> Pause Queue
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {['ALL', 'WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'SKIPPED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  border: statusFilter === st ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                  background: statusFilter === st ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: statusFilter === st ? '#38bdf8' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>TOKEN</th>
                  <th style={{ padding: '0.75rem' }}>PATIENT</th>
                  <th style={{ padding: '0.75rem' }}>DOCTOR</th>
                  <th style={{ padding: '0.75rem' }}>APPT TIME</th>
                  <th style={{ padding: '0.75rem' }}>CHANNEL</th>
                  <th style={{ padding: '0.75rem' }}>STATUS / PRIORITY</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No tokens in status '{statusFilter}' for this queue.
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((t) => (
                    <tr key={t.tokenId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '800', color: '#38bdf8' }}>
                        {t.tokenNumber}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{t.patientName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.patientId}</div>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#e2e8f0' }}>
                        {t.doctorName}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {t.expectedAppointmentTime || '10:00'}
                        {t.isLate && (
                          <span style={{ marginLeft: '0.35rem', fontSize: '0.7rem', color: '#f59e0b' }}>
                            (Late {t.lateMinutes}m)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t.checkInChannel === 'ONLINE_SELF_CHECKIN' ? 'Online Self' : 'Front Desk'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <QueueStatusBadge status={t.status} priority={t.priorityType} />
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {t.status === 'WAITING' && (
                            <button
                              onClick={() => handleCallToken(t.tokenId)}
                              title="Call Token"
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <PhoneCall size={14} color="#a855f7" />
                            </button>
                          )}

                          {t.status === 'CALLED' && (
                            <button
                              onClick={() => setSkipModalToken(t)}
                              title="Skip Token"
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <UserX size={14} color="#f59e0b" />
                            </button>
                          )}

                          {t.status === 'SKIPPED' && (
                            <button
                              onClick={() => handleReturnToken(t.tokenId)}
                              title="Return to Queue"
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <RotateCcw size={14} color="#10b981" />
                            </button>
                          )}

                          <button
                            onClick={() => setPriorityModalToken(t)}
                            title="Set Priority"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            <Sliders size={14} color="#38bdf8" />
                          </button>

                          <button
                            onClick={() => setTransferModalToken(t)}
                            title="Transfer Queue"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            <ArrowRightLeft size={14} color="#818cf8" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <PriorityAssignModal
        token={priorityModalToken}
        isOpen={Boolean(priorityModalToken)}
        onClose={() => setPriorityModalToken(null)}
        onSubmit={async (tokenId, pType, pReason) => {
          await opdService.assignPriority(tokenId, pType, pReason);
          setSuccessMsg(`Priority updated for ${priorityModalToken.tokenNumber}`);
          fetchQueues();
          fetchSelectedQueueDetails(selectedQueueId);
        }}
      />

      <TransferTokenModal
        token={transferModalToken}
        isOpen={Boolean(transferModalToken)}
        onClose={() => setTransferModalToken(null)}
        onSubmit={async (tokenId, transferData) => {
          await opdService.transferToken(tokenId, transferData);
          setSuccessMsg(`Token ${transferModalToken.tokenNumber} transferred successfully`);
          fetchQueues();
          fetchSelectedQueueDetails(selectedQueueId);
        }}
      />

      <SkipTokenModal
        token={skipModalToken}
        isOpen={Boolean(skipModalToken)}
        onClose={() => setSkipModalToken(null)}
        onSubmit={async (tokenId, skipReason) => {
          await opdService.skipToken(tokenId, skipReason);
          setSuccessMsg(`Token ${skipModalToken.tokenNumber} marked as SKIPPED`);
          fetchQueues();
          fetchSelectedQueueDetails(selectedQueueId);
        }}
      />
    </div>
  );
};

export default OperationsOpdQueuePage;
