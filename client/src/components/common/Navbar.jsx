import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Activity } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';

export const Navbar = () => {
  const { user, logout } = useAuth();

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
        {/* Global Notification Bell with Real-time Count & Drawer (Section 85) */}
        <NotificationBell />


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
