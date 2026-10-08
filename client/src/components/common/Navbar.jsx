import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, User, Activity } from 'lucide-react';
import api from '../../services/api';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/notifications?unreadOnly=true')
        .then((res) => setNotifications(res.data || []))
        .catch(() => {});
    }
  }, [user]);

  return (
    <header style={{
      height: '70px',
      background: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(2, 132, 199, 0.4)'
        }}>
          <Activity size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
            MediSync <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: '600' }}>RPA Platform</span>
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Notifications Dropdown Trigger */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '46px',
              width: '320px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: '1rem',
              zIndex: 100
            }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Notifications ({notifications.length})
              </h4>
              {notifications.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No unread alerts.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                  {notifications.map((n) => (
                    <div key={n.notificationId} style={{
                      padding: '0.6rem',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '6px',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{ fontWeight: '600', color: '#38bdf8' }}>{n.title}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{n.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: '600' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700' }}>
              {user?.role?.replace(/_/g, ' ')}
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              cursor: 'pointer'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
