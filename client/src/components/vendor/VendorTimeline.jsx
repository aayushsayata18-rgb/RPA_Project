import React, { useState } from 'react';
import { History, MessageSquare, Send, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import vendorService from '../../services/vendorService';

export const VendorTimeline = ({ vendorId, communications = [], auditLogs = [], onRefresh }) => {
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msgData, setMsgData] = useState({
    subject: '',
    message: '',
    communicationType: 'Portal Message',
    direction: 'OUTBOUND'
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await vendorService.logCommunication(vendorId, msgData);
      setShowMsgModal(false);
      setMsgData({ subject: '', message: '', communicationType: 'Portal Message', direction: 'OUTBOUND' });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
      {/* Communications Feed */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MessageSquare size={16} style={{ color: '#38bdf8' }} /> Communications & Notice Feed ({communications.length})
          </h4>
          <button
            onClick={() => setShowMsgModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: 'none',
              background: '#38bdf8',
              color: '#0f172a',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Send size={13} /> Log Message
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '420px', overflowY: 'auto' }}>
          {communications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No messages or communications recorded.
            </div>
          ) : (
            communications.map((c) => (
              <div
                key={c.communicationId || c._id}
                style={{
                  padding: '0.8rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${c.direction === 'OUTBOUND' ? '#38bdf8' : '#10b981'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{c.subject}</div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(c.timestamp || c.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem', whiteSpace: 'pre-wrap' }}>
                  {c.message}
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.4rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <span>From: <strong style={{ color: 'var(--text-primary)' }}>{c.sender}</strong></span>
                  <span>To: <strong style={{ color: 'var(--text-primary)' }}>{c.recipient}</strong></span>
                  <span>Type: {c.communicationType}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Timeline */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '1.25rem'
        }}
      >
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <History size={16} style={{ color: '#a855f7' }} /> Master Audit Timeline
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxHeight: '420px', overflowY: 'auto' }}>
          {auditLogs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No audit milestones found.
            </div>
          ) : (
            auditLogs.map((a) => (
              <div key={a._id || a.eventId} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.82rem' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(168, 85, 247, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a855f7',
                    flexShrink: 0
                  }}
                >
                  <Clock size={12} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.action}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{a.details || a.description}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {new Date(a.createdAt).toLocaleString()} • {a.userId}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Log Message Modal */}
      {showMsgModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              width: '100%',
              maxWidth: '460px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Log Communication</h3>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Channel / Type
                </label>
                <select
                  value={msgData.communicationType}
                  onChange={(e) => setMsgData({ ...msgData, communicationType: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  <option value="Portal Message">Portal Message</option>
                  <option value="Email">Email</option>
                  <option value="Phone Log">Phone Call Log</option>
                  <option value="System Notification">System Notification</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inquiry regarding order schedule"
                  value={msgData.subject}
                  onChange={(e) => setMsgData({ ...msgData, subject: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Message Content *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Enter message details..."
                  value={msgData.message}
                  onChange={(e) => setMsgData({ ...msgData, message: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowMsgModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#38bdf8', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Logging...' : 'Save Communication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
