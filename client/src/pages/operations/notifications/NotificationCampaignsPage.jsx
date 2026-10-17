import React, { useState, useEffect } from 'react';
import {
  Send,
  Plus,
  Users,
  CheckCircle,
  Play,
  Clock,
  AlertTriangle,
  X,
  FileText
} from 'lucide-react';
import api from '../../../services/api';

export const NotificationCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [msg, setMsg] = useState(null);

  // New campaign form state
  const [name, setName] = useState('');
  const [targetGroup, setTargetGroup] = useState('ALL_PATIENTS');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [channels, setChannels] = useState(['SMS', 'IN_APP']);
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [scheduledAt, setScheduledAt] = useState('');
  const [previewCount, setPreviewCount] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/campaigns');
      if (res.data?.success) {
        setCampaigns(res.data.data || []);
      }
    } catch (e) {
      console.error('Error fetching campaigns', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handlePreviewAudience = async (grp) => {
    setPreviewing(true);
    try {
      const res = await api.post('/notifications/campaigns/preview', { targetGroup: grp });
      if (res.data?.success) {
        setPreviewCount(res.data.data.recipientCount);
      }
    } catch (e) {
      console.error('Preview error', e);
    } finally {
      setPreviewing(false);
    }
  };

  const handleOpenModal = () => {
    setName('');
    setTargetGroup('ALL_PATIENTS');
    setCustomSubject('');
    setCustomBody('');
    setChannels(['SMS', 'IN_APP']);
    setApprovalRequired(true);
    setScheduledAt('');
    setPreviewCount(null);
    setIsModalOpen(true);
    handlePreviewAudience('ALL_PATIENTS');
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notifications/campaigns', {
        name,
        audienceDefinition: { targetGroup },
        customSubject,
        customBody,
        channels,
        approvalRequired,
        scheduledAt: scheduledAt || null
      });

      setMsg('Bulk notification campaign created successfully.');
      setIsModalOpen(false);
      fetchCampaigns();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(`Campaign creation failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/notifications/campaigns/${id}/approve`);
      setMsg('Campaign approved for execution.');
      fetchCampaigns();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(`Approval error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleExecute = async (id) => {
    if (!window.confirm('Execute broadcast campaign now?')) return;
    try {
      await api.post(`/notifications/campaigns/${id}/execute`);
      setMsg('Broadcast campaign executed across target audience.');
      fetchCampaigns();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(`Execution error: ${err.response?.data?.message || err.message}`);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'COMPLETED':
        return <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>COMPLETED</span>;
      case 'PROCESSING':
        return <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>PROCESSING</span>;
      case 'PENDING_APPROVAL':
        return <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>APPROVAL REQUIRED</span>;
      case 'APPROVED':
        return <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>READY / APPROVED</span>;
      default:
        return <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>{st}</span>;
    }
  };

  return (
    <div style={{ padding: '2rem', color: '#f8fafc', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>Bulk Notification Campaigns</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Authorized mass communications with audience safety previews and dual authorization
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          style={{
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> New Broadcast Campaign
        </button>
      </div>

      {msg && (
        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '1.5rem', color: '#34d399', fontWeight: '600' }}>
          ✓ {msg}
        </div>
      )}

      {/* Campaigns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', color: '#94a3b8' }}>Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: '3rem', color: '#94a3b8' }}>No bulk campaigns created.</div>
        ) : (
          campaigns.map((c) => (
            <div
              key={c.campaignId}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.8rem', fontWeight: '700' }}>
                    {c.campaignId}
                  </span>
                  {getStatusBadge(c.status)}
                </div>

                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '700' }}>{c.name}</h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>
                  {c.customSubject || 'No Subject'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#0f172a', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Target Audience</span>
                    <strong style={{ color: '#e2e8f0' }}>{c.audienceDefinition?.targetGroup?.replace(/_/g, ' ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Audience Size</span>
                    <strong style={{ color: '#38bdf8' }}>{c.recipientCount || 0} Recipients</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Channels</span>
                    <span style={{ color: '#cbd5e1' }}>{(c.channels || []).join(', ')}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Created By</span>
                    <span style={{ color: '#cbd5e1' }}>{c.createdBy || 'ADMIN'}</span>
                  </div>
                </div>

                {c.deliveryStats?.total > 0 && (
                  <div style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#34d399' }}>Delivered: {c.deliveryStats.delivered}</span>
                      <span style={{ color: '#f87171' }}>Failed: {c.deliveryStats.failed}</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          background: '#10b981',
                          width: `${Math.round((c.deliveryStats.delivered / c.deliveryStats.total) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                {c.status === 'PENDING_APPROVAL' && (
                  <button
                    onClick={() => handleApprove(c.campaignId)}
                    style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    <CheckCircle size={14} /> Authorize Campaign
                  </button>
                )}
                {(c.status === 'APPROVED' || c.status === 'SCHEDULED') && (
                  <button
                    onClick={() => handleExecute(c.campaignId)}
                    style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    <Play size={14} /> Execute Dispatch Now
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Campaign Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '14px', width: '560px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Create Broadcast Campaign</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Campaign Title *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Hospital Maintenance Downtime Announcement"
                  style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Target Audience</label>
                <select
                  value={targetGroup}
                  onChange={(e) => {
                    setTargetGroup(e.target.value);
                    handlePreviewAudience(e.target.value);
                  }}
                  style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
                >
                  <option value="ALL_PATIENTS">All Active Patients</option>
                  <option value="INPATIENTS">Currently Admitted Inpatients</option>
                  <option value="OPD_TODAY">Today's OPD Queue Patients</option>
                  <option value="ALL_STAFF">All Hospital Staff & Doctors</option>
                </select>
              </div>

              {/* Safety Preview Box (Section 62) */}
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#38bdf8" />
                  <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>Audience Preview Count:</span>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#38bdf8' }}>
                  {previewing ? 'Calculating...' : `${previewCount ?? 0} Recipients`}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Subject Header</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  required
                  placeholder="Official Hospital Announcement"
                  style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Message Body *</label>
                <textarea
                  rows={4}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  required
                  placeholder="Dear Patient/Staff, please be advised..."
                  style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="campAppr"
                  checked={approvalRequired}
                  onChange={(e) => setApprovalRequired(e.target.checked)}
                  style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
                />
                <label htmlFor="campAppr" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  Require supervisory authorization prior to execution (Safety gate)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
