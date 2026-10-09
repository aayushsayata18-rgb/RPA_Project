import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bedService } from '../../services/bedService';
import {
  BedDouble,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Sparkles,
  Wrench,
  ShieldCheck,
  Activity,
  History,
  CheckCircle2,
  Ban
} from 'lucide-react';

export const BedDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bed, setBed] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBedDetail = async () => {
      setLoading(true);
      try {
        const [bedRes, histRes] = await Promise.all([
          bedService.getBedById(id),
          bedService.getBedHistory(id)
        ]);
        if (bedRes.data?.data) setBed(bedRes.data.data);
        if (histRes.data?.data) setHistory(histRes.data.data);
      } catch (err) {
        setError('Failed to load bed details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBedDetail();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading bed profile...</div>;
  }

  if (error || !bed) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#f87171' }}>{error || 'Bed record not found.'}</p>
        <button onClick={() => navigate('/operations/beds')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Bed Desk
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ padding: '0.5rem 0' }}>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Bed List</span>
      </button>

      {/* Main Bed Profile Card */}
      <div className="glass-card" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  padding: '0.4rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8'
                }}
              >
                <BedDouble size={24} />
              </span>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc' }}>
                Bed {bed.bedNumber}
              </h1>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              ID: {bed.bedId} • Ward: {bed.wardName} ({bed.wardId}) • Room: {bed.roomNumber || 'Open Bay'}
            </div>
          </div>

          <span
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontWeight: '600',
              fontSize: '0.85rem',
              background:
                bed.status === 'AVAILABLE'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : bed.status === 'OCCUPIED'
                  ? 'rgba(56, 189, 248, 0.15)'
                  : 'rgba(234, 179, 8, 0.15)',
              color:
                bed.status === 'AVAILABLE'
                  ? '#4ade80'
                  : bed.status === 'OCCUPIED'
                  ? '#38bdf8'
                  : '#facc15',
              border: '1px solid currentColor'
            }}
          >
            {bed.status}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginTop: '1.75rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Category Type</div>
            <div style={{ fontWeight: '600', color: '#f8fafc', marginTop: '0.2rem' }}>{bed.bedType}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Daily Base Rate</div>
            <div style={{ fontWeight: '600', color: '#f8fafc', marginTop: '0.2rem' }}>₹{bed.dailyRate}/day</div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Gender Policy</div>
            <div style={{ fontWeight: '600', color: '#f8fafc', marginTop: '0.2rem' }}>{bed.genderPolicy || 'ANY'}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Isolation Capable</div>
            <div style={{ fontWeight: '600', color: bed.isIsolationCapable ? '#4ade80' : 'var(--text-muted)', marginTop: '0.2rem' }}>
              {bed.isIsolationCapable ? 'YES' : 'NO'}
            </div>
          </div>
        </div>

        {/* Current Occupant Details */}
        {bed.status === 'OCCUPIED' && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}
          >
            <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1rem', color: '#38bdf8' }}>
              Current Occupying Patient
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.88rem' }}>
              <div><strong>Patient Name:</strong> {bed.currentPatientName}</div>
              <div><strong>Patient ID:</strong> {bed.currentPatientId}</div>
              <div><strong>Admission Episode:</strong> {bed.currentAdmissionId}</div>
            </div>
          </div>
        )}
      </div>

      {/* Audit History Timeline */}
      <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <History size={20} color="#38bdf8" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
            Lifecycle Status History & Audit Log
          </h2>
        </div>

        {!history || history.statusHistory?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No audit events logged yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {history.statusHistory.map((h, idx) => (
              <div
                key={h._id || idx}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderLeft: `4px solid ${
                    h.newStatus === 'OCCUPIED'
                      ? '#38bdf8'
                      : h.newStatus === 'AVAILABLE'
                      ? '#22c55e'
                      : '#a855f7'
                  }`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#f8fafc' }}>
                    {h.previousStatus ? `${h.previousStatus} → ` : ''}{h.newStatus}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {h.reason || 'Status update logged by system/user'}
                  </div>
                  {h.patientId && (
                    <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                      Patient: {h.patientId} • Reference: {h.referenceType} ({h.referenceId || 'N/A'})
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <div>{new Date(h.timestamp).toLocaleDateString()}</div>
                  <div>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div>User: {h.changedByUserName || 'System'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BedDetailPage;
