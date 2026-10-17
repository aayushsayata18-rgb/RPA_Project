import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  CheckCircle,
  Clock,
  History,
  X,
  Save,
  ShieldAlert,
  Code
} from 'lucide-react';
import api from '../../../services/api';

export const TemplateManagementPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(null);

  // Form fields
  const [templateCode, setTemplateCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [channel, setChannel] = useState('ALL');
  const [language, setLanguage] = useState('en-IN');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [variablesInput, setVariablesInput] = useState('');
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [msg, setMsg] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/templates');
      if (res.data?.success) {
        setTemplates(res.data.data || []);
      }
    } catch (e) {
      console.error('Error fetching templates', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setTemplateCode('');
    setName('');
    setType('');
    setChannel('ALL');
    setLanguage('en-IN');
    setSubject('');
    setBody('');
    setVariablesInput('');
    setApprovalRequired(false);
    setChangeReason('Initial version');
    setIsModalOpen(true);
  };

  const openEditModal = (tmpl) => {
    setEditingTemplate(tmpl);
    setTemplateCode(tmpl.templateCode);
    setName(tmpl.name);
    setType(tmpl.type || tmpl.event);
    setChannel(tmpl.channel || 'ALL');
    setLanguage(tmpl.language || 'en-IN');
    setSubject(tmpl.subject || tmpl.subjectTemplate || '');
    setBody(tmpl.body || tmpl.bodyTemplate || '');
    setVariablesInput((tmpl.variables || []).join(', '));
    setApprovalRequired(tmpl.approvalRequired || false);
    setChangeReason(`Updated to version ${(tmpl.version || 1) + 1}`);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const vars = variablesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.post('/notifications/templates', {
        templateCode,
        name,
        type: type || templateCode,
        channel,
        language,
        subject,
        body,
        variables: vars,
        approvalRequired,
        changeReason
      });

      setMsg(`Template ${templateCode} saved with version preservation.`);
      setIsModalOpen(false);
      fetchTemplates();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(`Save failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleApprove = async (tmplId) => {
    try {
      await api.post(`/notifications/templates/${tmplId}/approve`);
      setMsg('Template approved successfully.');
      fetchTemplates();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(`Approval failed: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', color: '#f8fafc', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>Template Management Engine</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Version-controlled templates, strict placeholder variable validation, and approval workflow
          </p>
        </div>
        <button
          onClick={openCreateModal}
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
          <Plus size={16} /> New Template
        </button>
      </div>

      {msg && (
        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '1.5rem', color: '#34d399', fontWeight: '600' }}>
          ✓ {msg}
        </div>
      )}

      {/* Templates Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'rgba(30, 41, 59, 0.7)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Template Code</th>
              <th style={{ padding: '0.85rem 1rem' }}>Name & Type</th>
              <th style={{ padding: '0.85rem 1rem' }}>Channel / Language</th>
              <th style={{ padding: '0.85rem 1rem' }}>Version</th>
              <th style={{ padding: '0.85rem 1rem' }}>Variables Required</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  Loading templates...
                </td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No templates configured.
                </td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr key={t._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: '700' }}>
                    {t.templateCode}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.type || t.event}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ color: '#cbd5e1', fontWeight: '500' }}>{t.channel || 'ALL'}</span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '6px' }}>({t.language || 'en-IN'})</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', fontSize: '0.75rem' }}>
                      v{t.version || 1}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                      {(t.variables || []).slice(0, 3).map((v) => (
                        <span key={v} style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.06)', color: '#94a3b8', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                          {`{{${v}}}`}
                        </span>
                      ))}
                      {(t.variables || []).length > 3 && (
                        <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>+{(t.variables || []).length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {t.approvalRequired && !t.approvedAt ? (
                      <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        Pending Approval
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        Active
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        onClick={() => openEditModal(t)}
                        title="Edit / Bump Version"
                        style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      {t.versionHistory && t.versionHistory.length > 0 && (
                        <button
                          onClick={() => setViewingHistory(t)}
                          title="View Version Audit History"
                          style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', color: '#c084fc', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
                        >
                          <History size={14} />
                        </button>
                      )}
                      {t.approvalRequired && !t.approvedAt && (
                        <button
                          onClick={() => handleApprove(t._id)}
                          title="Approve Template Version"
                          style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Version Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '14px', width: '640px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
                {editingTemplate ? `Edit Template (Will Bump to v${(editingTemplate.version || 1) + 1})` : 'Create New Template'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Template Code *</label>
                  <input
                    type="text"
                    value={templateCode}
                    onChange={(e) => setTemplateCode(e.target.value.toUpperCase())}
                    disabled={!!editingTemplate}
                    required
                    placeholder="e.g. LAB_REPORT_RELEASED"
                    style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Display Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Diagnostic Lab Report Released"
                    style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Notification Type</label>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setType(e.target.value.toUpperCase())}
                    placeholder="e.g. LAB_REPORT_RELEASED"
                    style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="ALL">ALL (SMS, Email, In-App)</option>
                    <option value="SMS">SMS Only</option>
                    <option value="EMAIL">Email Only</option>
                    <option value="IN_APP">In-App Portal Only</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="en-IN"
                    style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Subject Line / Header</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject with {{variables}} e.g. Diagnostic Lab Report - {{orderNumber}}"
                  style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Message Body *</label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  placeholder="Body content with variables e.g. Dear {{patientName}}, your report for {{testName}} is ready."
                  style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', lineHeight: '1.5' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Required Variables (comma separated)
                </label>
                <input
                  type="text"
                  value={variablesInput}
                  onChange={(e) => setVariablesInput(e.target.value)}
                  placeholder="e.g. patientName, testName, orderNumber"
                  style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#38bdf8', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Audit Reason for Change</label>
                <input
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Updated wording for clarity"
                  style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="approvalReq"
                  checked={approvalRequired}
                  onChange={(e) => setApprovalRequired(e.target.checked)}
                  style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
                />
                <label htmlFor="approvalReq" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  Require manager approval before activating this version
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
                  style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Save size={16} /> Save Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {viewingHistory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '14px', width: '600px', maxWidth: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '1.5rem', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>
                Version History: {viewingHistory.templateCode}
              </h3>
              <button onClick={() => setViewingHistory(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(viewingHistory.versionHistory || []).map((h, i) => (
                <div key={i} style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: '700', color: '#38bdf8' }}>Version {h.version}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {h.modifiedAt ? new Date(h.modifiedAt).toLocaleString() : 'Past record'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    <strong>Subject:</strong> {h.subject || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#0f172a', padding: '0.5rem', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                    {h.body}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                    Changed by {h.modifiedBy || 'System'}: <em>{h.changeReason || 'N/A'}</em>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
