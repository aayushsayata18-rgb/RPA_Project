import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Sliders, Clock, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { NotificationPreferences } from '../../components/notifications/NotificationPreferences';
import api from '../../services/api';

export const PatientNotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/my');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      }
    } catch (e) {
      console.error('Error fetching patient notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter((x) => !x.isRead)) {
      await handleMarkRead(n.notificationId);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ padding: '2rem', color: '#f8fafc', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>My Notifications & Alerts</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Review appointments, medical billing receipts, diagnostic releases, and communication preferences
          </p>
        </div>

        {activeTab === 'inbox' && unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('inbox')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'inbox' ? '2px solid #38bdf8' : '2px solid transparent',
            color: activeTab === 'inbox' ? '#38bdf8' : '#94a3b8',
            padding: '10px 16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.95rem'
          }}
        >
          <Bell size={18} />
          Notifications Inbox
          {unreadCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'preferences' ? '2px solid #38bdf8' : '2px solid transparent',
            color: activeTab === 'preferences' ? '#38bdf8' : '#94a3b8',
            padding: '10px 16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.95rem'
          }}
        >
          <Sliders size={18} />
          Delivery Preferences
        </button>
      </div>

      {/* Tab 1: Inbox */}
      {activeTab === 'inbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--border-color)', color: '#94a3b8' }}>
              <Bell size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <h3 style={{ margin: '0 0 0.5rem', color: '#f1f5f9' }}>You have no notifications</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>You're all caught up! New clinical and administrative updates will appear here.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.notificationId}
                style={{
                  background: n.isRead ? 'var(--bg-card)' : 'rgba(56, 189, 248, 0.08)',
                  border: n.isRead ? '1px solid var(--border-color)' : '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  position: 'relative'
                }}
              >
                {!n.isRead && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '6px',
                      height: '24px',
                      borderRadius: '3px',
                      background: '#38bdf8'
                    }}
                  />
                )}
                <div style={{ marginLeft: n.isRead ? 0 : '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' }}>
                      {n.type?.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: '700', color: '#f1f5f9' }}>
                    {n.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {n.message}
                  </p>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.notificationId)}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#94a3b8',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Preferences */}
      {activeTab === 'preferences' && <NotificationPreferences />}
    </div>
  );
};
