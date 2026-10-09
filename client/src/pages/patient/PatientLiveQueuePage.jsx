import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import opdService from '../../services/opdService';
import { OPDTokenCard } from '../../components/opd/OPDTokenCard';
import {
  Layers,
  RefreshCw,
  Clock,
  Radio,
  Sparkles,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

export const PatientLiveQueuePage = () => {
  const { tokenId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchTokenDetails = async () => {
    try {
      const targetId = tokenId || user?.patientId || user?.userId;
      if (!targetId) {
        setError('No active token or patient identifier found.');
        setLoading(false);
        return;
      }

      const res = await opdService.getPatientToken(targetId);
      setData(res.data);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No active OPD Token found for today.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenDetails();
    // Auto polling every 8 seconds for live updates
    const interval = setInterval(() => {
      fetchTokenDetails();
    }, 8000);
    return () => clearInterval(interval);
  }, [tokenId, user]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      {/* Back and Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => navigate('/patient/check-in')}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} /> Check-In Desk
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: '700',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.12)',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px'
            }}
          >
            <Radio size={12} className="animate-pulse" /> LIVE SYNC ACTIVE
          </span>
          <button
            onClick={fetchTokenDetails}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading live queue status...
        </div>
      ) : error || !data?.token ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center'
          }}
        >
          <AlertCircle size={48} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.5rem' }}>
            No Active OPD Token Found
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {error || 'You do not have an active queue token for today. Please perform check-in for your scheduled appointment.'}
          </p>
          <button onClick={() => navigate('/patient/check-in')} className="btn btn-primary">
            Go to OPD Check-In
          </button>
        </div>
      ) : (
        <div>
          {/* Main Token Card */}
          <OPDTokenCard
            token={data.token}
            patientsAhead={data.patientsAhead}
            estimatedWaitMinutes={data.estimatedWaitMinutes}
          />

          {/* Department Queue Live Info */}
          {data.queue && (
            <div
              style={{
                marginTop: '1.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '1rem',
                padding: '1.5rem'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f1f5f9', margin: '0 0 1rem' }}>
                {data.token.departmentName} Queue Status
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently Serving</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#a855f7' }}>
                    {data.queue.currentToken || 'None'}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Queue State</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: data.queue.status === 'OPEN' ? '#10b981' : '#f59e0b' }}>
                    {data.queue.status}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last Synced</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {lastRefreshed.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientLiveQueuePage;
