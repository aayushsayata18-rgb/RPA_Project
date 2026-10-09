import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import opdService from '../../services/opdService';
import doctorService from '../../services/doctorService';
import { QueueStatusBadge } from '../../components/opd/QueueStatusBadge';
import { PriorityAssignModal } from '../../components/opd/PriorityAssignModal';
import { SkipTokenModal } from '../../components/opd/SkipTokenModal';
import {
  Stethoscope,
  PhoneCall,
  Play,
  CheckCircle2,
  UserX,
  RotateCcw,
  Sliders,
  Sparkles,
  Users,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
  FileText,
  User
} from 'lucide-react';

export const DoctorOpdQueuePage = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(user?.doctorId || 'DOC1002');
  const [queues, setQueues] = useState([]);
  const [activeQueue, setActiveQueue] = useState(null);
  const [queueDetails, setQueueDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals
  const [priorityModalToken, setPriorityModalToken] = useState(null);
  const [skipModalToken, setSkipModalToken] = useState(null);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const docRes = await doctorService.getDoctors();
      setDoctors(docRes.data || []);

      const qRes = await opdService.getQueues();
      const allQ = qRes.data || [];
      setQueues(allQ);

      // Find matching queue for doctor or department
      const matchQ = allQ.find((q) => q.doctorId === selectedDoctorId) || allQ[0];
      if (matchQ) {
        setActiveQueue(matchQ);
        const detailsRes = await opdService.getQueueById(matchQ.queueId);
        setQueueDetails(detailsRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load doctor OPD queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
    const interval = setInterval(() => {
      if (activeQueue) {
        opdService.getQueueById(activeQueue.queueId).then((res) => {
          setQueueDetails(res.data);
        }).catch(() => {});
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedDoctorId]);

  // Actions
  const handleCallToken = async (tokenId) => {
    try {
      setActionLoading(true);
      setError(null);
      await opdService.callToken(tokenId);
      setSuccessMsg('Patient token called. Waiting room notified.');
      fetchDoctorData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async (tokenId) => {
    try {
      setActionLoading(true);
      setError(null);
      await opdService.startService(tokenId);
      setSuccessMsg('Consultation started.');
      fetchDoctorData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteService = async (tokenId) => {
    try {
      setActionLoading(true);
      setError(null);
      await opdService.completeService(tokenId, consultationNotes);
      setSuccessMsg('Consultation completed and encounter recorded.');
      setConsultationNotes('');
      fetchDoctorData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnToken = async (tokenId) => {
    try {
      setActionLoading(true);
      setError(null);
      await opdService.returnToken(tokenId, 'Returned by consulting doctor');
      setSuccessMsg('Patient returned to waiting list.');
      fetchDoctorData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const activeTokens = queueDetails?.tokens?.all || [];
  const inServiceToken = activeTokens.find((t) => t.status === 'IN_SERVICE');
  const calledToken = activeTokens.find((t) => t.status === 'CALLED');
  const waitingTokens = queueDetails?.tokens?.waiting || [];
  const skippedTokens = queueDetails?.tokens?.skipped || [];
  const completedTokens = queueDetails?.tokens?.completed || [];

  const currentServingToken = inServiceToken || calledToken;
  const nextCandidate = waitingTokens.length > 0 ? waitingTokens[0] : null;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
      {/* Top Header */}
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
          <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.08em' }}>
            Clinical Portal &bull; Consultation Room
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0.2rem 0 0', color: '#f8fafc' }}>
            Doctor OPD Consultation Cockpit
          </h1>
        </div>

        {/* Doctor Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}
          >
            {doctors.map((d) => (
              <option key={d.doctorId} value={d.doctorId}>
                {d.name} ({d.specialty})
              </option>
            ))}
          </select>

          <button onClick={fetchDoctorData} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Main Grid: Active Consultation Cockpit + Queue Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
        {/* Left Column: Currently Serving Patient & Active Encounter */}
        <div>
          {currentServingToken ? (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
                border: currentServingToken.status === 'IN_SERVICE' ? '2px solid #10b981' : '2px solid #a855f7',
                borderRadius: '1.25rem',
                padding: '2rem',
                marginBottom: '1.5rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Currently Serving Patient
                  </div>
                  <h2 style={{ fontSize: '3.25rem', fontWeight: '900', color: currentServingToken.status === 'IN_SERVICE' ? '#6ee7b7' : '#d8b4fe', margin: '0.25rem 0' }}>
                    {currentServingToken.tokenNumber}
                  </h2>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#f8fafc' }}>
                    {currentServingToken.patientName}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Patient ID: {currentServingToken.patientId} &bull; Appt Time: {currentServingToken.expectedAppointmentTime}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <QueueStatusBadge status={currentServingToken.status} priority={currentServingToken.priorityType} />
                  <button
                    onClick={() => setPriorityModalToken(currentServingToken)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    <Sliders size={12} /> Change Priority
                  </button>
                </div>
              </div>

              {/* Consultation Notes Input */}
              {currentServingToken.status === 'IN_SERVICE' && (
                <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: '#f1f5f9' }}>
                    Consultation Summary / Clinical Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter diagnosis, prescription, or clinical remarks..."
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {currentServingToken.status === 'CALLED' && (
                  <>
                    <button
                      onClick={() => handleStartService(currentServingToken.tokenId)}
                      disabled={actionLoading}
                      className="btn btn-primary"
                      style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', fontWeight: '800', background: '#10b981', borderColor: '#10b981' }}
                    >
                      <Play size={18} /> Start Consultation
                    </button>
                    <button
                      onClick={() => setSkipModalToken(currentServingToken)}
                      disabled={actionLoading}
                      className="btn btn-secondary"
                      style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                    >
                      <UserX size={18} /> Skip (Patient Not In Room)
                    </button>
                  </>
                )}

                {currentServingToken.status === 'IN_SERVICE' && (
                  <button
                    onClick={() => handleCompleteService(currentServingToken.tokenId)}
                    disabled={actionLoading}
                    className="btn btn-primary"
                    style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: '800', background: '#10b981', borderColor: '#10b981' }}
                  >
                    <CheckCircle2 size={18} /> Complete Consultation
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '1.25rem',
                padding: '3rem',
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <Stethoscope size={48} color="#38bdf8" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.5rem' }}>
                No Patient Currently in Consultation
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                {nextCandidate
                  ? `Next waiting candidate is ${nextCandidate.tokenNumber} (${nextCandidate.patientName}). Click below to call them into the room.`
                  : 'All checked-in patients have been served. Waiting for new check-ins.'}
              </p>

              {nextCandidate && (
                <button
                  onClick={() => handleCallToken(nextCandidate.tokenId)}
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', fontWeight: '800' }}
                >
                  <PhoneCall size={18} /> Call Next: {nextCandidate.tokenNumber}
                </button>
              )}
            </div>
          )}

          {/* Quick Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.75rem',
              padding: '1.25rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Waiting in Line</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#38bdf8' }}>{waitingTokens.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed Today</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981' }}>{completedTokens.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Skipped Patients</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f59e0b' }}>{skippedTokens.length}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Queue Stream & Skipped Roster */}
        <div>
          {/* Waiting Stream */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '1rem',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f1f5f9', margin: '0 0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Waiting Roster ({waitingTokens.length})</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Priority Sorted</span>
            </h3>

            {waitingTokens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No patients currently waiting.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {waitingTokens.map((t, idx) => (
                  <div
                    key={t.tokenId}
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.65rem',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '800', color: '#38bdf8', fontSize: '1rem' }}>
                          {t.tokenNumber}
                        </span>
                        <QueueStatusBadge priority={t.priorityType} />
                      </div>
                      <div style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '0.9rem' }}>
                        {t.patientName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Scheduled: {t.expectedAppointmentTime || '10:00'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleCallToken(t.tokenId)}
                        disabled={actionLoading}
                        title="Call Patient"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        <PhoneCall size={14} color="#a855f7" /> Call
                      </button>
                      <button
                        onClick={() => setPriorityModalToken(t)}
                        title="Set Priority"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem' }}
                      >
                        <Sliders size={14} color="#38bdf8" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skipped Patients List */}
          {skippedTokens.length > 0 && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '1rem',
                padding: '1.25rem'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b', margin: '0 0 1rem' }}>
                Skipped Patients ({skippedTokens.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {skippedTokens.map((t) => (
                  <div
                    key={t.tokenId}
                    style={{
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '0.65rem',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '800', color: '#f59e0b' }}>{t.tokenNumber}</span> &bull; {t.patientName}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Reason: {t.skipReason || 'Patient not in room'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleReturnToken(t.tokenId)}
                      disabled={actionLoading}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#10b981' }}
                    >
                      <RotateCcw size={14} /> Return
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PriorityAssignModal
        token={priorityModalToken}
        isOpen={Boolean(priorityModalToken)}
        onClose={() => setPriorityModalToken(null)}
        onSubmit={async (tokenId, pType, pReason) => {
          await opdService.assignPriority(tokenId, pType, pReason);
          setSuccessMsg(`Priority updated for ${priorityModalToken.tokenNumber}`);
          fetchDoctorData();
        }}
      />

      <SkipTokenModal
        token={skipModalToken}
        isOpen={Boolean(skipModalToken)}
        onClose={() => setSkipModalToken(null)}
        onSubmit={async (tokenId, skipReason) => {
          await opdService.skipToken(tokenId, skipReason);
          setSuccessMsg(`Token ${skipModalToken.tokenNumber} marked as SKIPPED`);
          fetchDoctorData();
        }}
      />
    </div>
  );
};

export default DoctorOpdQueuePage;
