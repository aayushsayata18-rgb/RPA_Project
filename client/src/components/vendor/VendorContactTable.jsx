import React, { useState } from 'react';
import { Mail, Phone, Star, Plus, Trash2, Edit3, UserCheck } from 'lucide-react';
import vendorService from '../../services/vendorService';

export const VendorContactTable = ({ vendorId, contacts = [], onRefresh, canEdit = true }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    email: '',
    phone: '',
    contactType: 'PRIMARY',
    isPrimary: false
  });

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await vendorService.createContact(vendorId, formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        designation: '',
        department: '',
        email: '',
        phone: '',
        contactType: 'SALES',
        isPrimary: false
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Are you sure you want to remove this contact?')) return;
    try {
      await vendorService.deleteContact(vendorId, contactId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Authorized Personnel & Contacts ({contacts.length})
        </h4>
        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: 'none',
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} /> Add Contact
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Name & Title</th>
              <th style={{ padding: '0.75rem 1rem' }}>Department</th>
              <th style={{ padding: '0.75rem 1rem' }}>Contact Details</th>
              <th style={{ padding: '0.75rem 1rem' }}>Role Type</th>
              <th style={{ padding: '0.75rem 1rem' }}>Primary</th>
              {canEdit && <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No contacts registered for this vendor yet.
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.vendorContactId} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.designation || 'Staff'}</div>
                  </td>
                  <td style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)' }}>
                    {c.department || '—'}
                  </td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                      <Mail size={13} style={{ color: '#38bdf8' }} /> {c.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      <Phone size={13} style={{ color: '#10b981' }} /> {c.phone}
                    </div>
                  </td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38bdf8'
                      }}
                    >
                      {c.contactType}
                    </span>
                  </td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    {c.isPrimary ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: '#eab308',
                          fontWeight: 600,
                          fontSize: '0.78rem'
                        }}
                      >
                        <Star size={14} fill="#eab308" /> Primary
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Secondary</span>
                    )}
                  </td>
                  {canEdit && (
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(c.vendorContactId)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.3rem',
                          borderRadius: '4px'
                        }}
                        title="Delete Contact"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
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
              maxWidth: '480px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Add Vendor Contact</h3>
            <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Contact Role
                  </label>
                  <select
                    value={formData.contactType}
                    onChange={(e) => setFormData({ ...formData, contactType: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="PRIMARY">PRIMARY</option>
                    <option value="SALES">SALES</option>
                    <option value="ACCOUNTS">ACCOUNTS</option>
                    <option value="LOGISTICS">LOGISTICS</option>
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isPrimary}
                      onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    />
                    Designate as Primary
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#38bdf8', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
