import React, { useState, useEffect } from 'react';
import { ShieldCheck, Moon, Bell, Check, Save } from 'lucide-react';
import api from '../../services/api';

export const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState([
    { notificationType: 'APPOINTMENT_REMINDER', label: 'Appointment Reminders & Updates', smsEnabled: true, emailEnabled: true, inAppEnabled: true },
    { notificationType: 'BILLING_INVOICE_GENERATED', label: 'Billing Invoices & Receipts', smsEnabled: true, emailEnabled: true, inAppEnabled: true },
    { notificationType: 'LAB_REPORT_RELEASED', label: 'Diagnostic Lab & Imaging Reports', smsEnabled: true, emailEnabled: true, inAppEnabled: true },
    { notificationType: 'FEEDBACK_RESPONSE_AVAILABLE', label: 'Grievance & Feedback Updates', smsEnabled: true, emailEnabled: true, inAppEnabled: true },
    { notificationType: 'PROMOTIONAL', label: 'Hospital Health Camps & Community Notices', smsEnabled: false, emailEnabled: false, inAppEnabled: false }
  ]);
  const [quietHours, setQuietHours] = useState({ enabled: true, start: '22:00', end: '07:00' });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/notifications/preferences')
      .then((res) => {
        if (res.data?.success && res.data.data?.length > 0) {
          const fetched = res.data.data;
          setPreferences((prev) =>
            prev.map((item) => {
              const found = fetched.find((f) => f.notificationType === item.notificationType);
              return found ? { ...item, ...found } : item;
            })
          );
          if (fetched[0]?.quietHours) {
            setQuietHours(fetched[0].quietHours);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleToggle = (type, channel) => {
    setPreferences((prev) =>
      prev.map((p) => (p.notificationType === type ? { ...p, [channel]: !p[channel] } : p))
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const pref of preferences) {
        await api.patch('/notifications/preferences', {
          notificationType: pref.notificationType,
          smsEnabled: pref.smsEnabled,
          emailEnabled: pref.emailEnabled,
          inAppEnabled: pref.inAppEnabled,
          quietHours
        });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving preferences', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', color: '#f8fafc' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Communication Preferences</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Configure how and when the hospital sends you alerts and notifications.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            background: savedSuccess ? '#10b981' : '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {savedSuccess ? <Check size={16} /> : <Save size={16} />}
          {savedSuccess ? 'Preferences Saved' : 'Save Preferences'}
        </button>
      </div>

      {/* Quiet Hours Section */}
      <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Moon size={18} color="#38bdf8" />
            <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Quiet Hours</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={quietHours.enabled}
              onChange={(e) => setQuietHours({ ...quietHours, enabled: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: '#38bdf8' }}
            />
            <span>Enable Quiet Hours</span>
          </label>
        </div>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          Non-critical alerts will be queued and delivered after quiet hours end. Emergency and mandatory billing receipts bypass quiet hours.
        </p>
        {quietHours.enabled && (
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>From</label>
              <input
                type="time"
                value={quietHours.start}
                onChange={(e) => setQuietHours({ ...quietHours, start: e.target.value })}
                style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: '6px', padding: '6px 12px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Until</label>
              <input
                type="time"
                value={quietHours.end}
                onChange={(e) => setQuietHours({ ...quietHours, end: e.target.value })}
                style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: '6px', padding: '6px 12px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Channel Toggles Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '0.75rem 0' }}>Notification Category</th>
            <th style={{ padding: '0.75rem 0', textAlign: 'center' }}>SMS</th>
            <th style={{ padding: '0.75rem 0', textAlign: 'center' }}>Email</th>
            <th style={{ padding: '0.75rem 0', textAlign: 'center' }}>In-App Portal</th>
          </tr>
        </thead>
        <tbody>
          {preferences.map((p) => (
            <tr key={p.notificationType} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <td style={{ padding: '1rem 0', fontWeight: '500' }}>{p.label}</td>
              <td style={{ padding: '1rem 0', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={p.smsEnabled}
                  onChange={() => handleToggle(p.notificationType, 'smsEnabled')}
                  style={{ width: '16px', height: '16px', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
              </td>
              <td style={{ padding: '1rem 0', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={p.emailEnabled}
                  onChange={() => handleToggle(p.notificationType, 'emailEnabled')}
                  style={{ width: '16px', height: '16px', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
              </td>
              <td style={{ padding: '1rem 0', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={p.inAppEnabled}
                  onChange={() => handleToggle(p.notificationType, 'inAppEnabled')}
                  style={{ width: '16px', height: '16px', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
