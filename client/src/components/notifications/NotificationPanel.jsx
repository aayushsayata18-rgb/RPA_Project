import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Clock, X, ExternalLink, Bell } from 'lucide-react';

export const NotificationPanel = ({ notifications = [], onClose, onMarkAsRead, onRefresh }) => {
  const navigate = useNavigate();

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await onMarkAsRead(notif.notificationId);
    }
    if (notif.reference?.route) {
      onClose();
      navigate(notif.reference.route);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: '48px',
        width: '380px',
        maxWidth: '90vw',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        padding: '1rem',
        zIndex: 1000,
        color: '#f8fafc'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={18} color="#38bdf8" />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Notifications</h4>
          <span style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
            {notifications.filter((n) => !n.isRead).length} Unread
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: '4px' }}
        >
          <X size={18} />
        </button>
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
          <Bell size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>No recent notifications.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
          {notifications.map((n) => (
            <div
              key={n.notificationId}
              onClick={() => handleNotificationClick(n)}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: n.isRead ? 'rgba(30, 41, 59, 0.4)' : 'rgba(56, 189, 248, 0.08)',
                border: n.isRead ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(56, 189, 248, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {!n.isRead && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#38bdf8',
                    boxShadow: '0 0 6px #38bdf8'
                  }}
                />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#38bdf8', fontWeight: '700', letterSpacing: '0.04em' }}>
                  {n.type?.replace(/_/g, ' ')}
                </span>
                {n.priority === 'CRITICAL' || n.priority === 'HIGH' ? (
                  <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                    {n.priority}
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: n.isRead ? '500' : '700', color: '#f1f5f9', marginBottom: '0.2rem' }}>
                {n.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.4', marginBottom: '0.4rem' }}>
                {n.message}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {!n.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(n.notificationId);
                    }}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.7rem', textDecoration: 'underline' }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={() => {
            onClose();
            navigate('/portal/patient/notifications');
          }}
          style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
        >
          View All History →
        </button>
        <button
          onClick={onRefresh}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};
