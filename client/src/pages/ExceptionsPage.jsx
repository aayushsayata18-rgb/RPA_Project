import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export const ExceptionsPage = () => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedException, setSelectedException] = useState(null);
  const [resolution, setResolution] = useState('');

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/exceptions');
      setExceptions(res.data.exceptions || []);
    } catch (err) {
      console.error('Failed to load exceptions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedException) return;

    try {
      await api.put(`/exceptions/${selectedException.exceptionId}/resolve`, { resolution });
      setSelectedException(null);
      setResolution('');
      fetchExceptions();
    } catch (err) {
      alert(err.message || 'Failed to resolve exception.');
    }
  };

  const columns = [
    { header: 'Exception ID', accessor: 'exceptionId', render: (row) => <code style={{ color: '#f87171' }}>{row.exceptionId}</code> },
    { header: 'Module', accessor: 'module', render: (row) => <span className="badge badge-secondary">{row.module}</span> },
    { header: 'Type', accessor: 'exceptionType', render: (row) => <strong>{row.exceptionType}</strong> },
    { header: 'Description', accessor: 'description' },
    { header: 'Severity', accessor: 'severity', render: (row) => <StatusBadge status={row.severity} /> },
    { header: 'Status', accessor: 'currentStatus', render: (row) => <StatusBadge status={row.currentStatus} /> },
    {
      header: 'Action',
      accessor: 'actions',
      render: (row) => (
        row.currentStatus === 'OPEN' ? (
          <button
            className="btn btn-primary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            onClick={() => setSelectedException(row)}
          >
            Review & Resolve
          </button>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resolved</span>
        )
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exception Case Management</h1>
          <p className="page-subtitle">Central Human-In-The-Loop Review Center (00_MASTER.md Section 39)</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchExceptions}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="card">
        <DataTable columns={columns} data={exceptions} emptyMessage="No open exception cases requiring human attention." />
      </div>

      {/* Resolution Modal */}
      <Modal
        isOpen={!!selectedException}
        onClose={() => setSelectedException(null)}
        title={`Resolve Exception: ${selectedException?.exceptionId}`}
      >
        {selectedException && (
          <form onSubmit={handleResolve}>
            <div style={{ marginBottom: '1rem', padding: '0.8rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px', fontSize: '0.85rem' }}>
              <p><strong>Module:</strong> {selectedException.module}</p>
              <p><strong>Entity:</strong> {selectedException.entityType} ({selectedException.entityId})</p>
              <p><strong>Description:</strong> {selectedException.description}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Human Resolution / Approval Decision</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Explain the verified resolution (e.g., Manual insurer approval verified, overridden with reference #)..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedException(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success">
                <CheckCircle size={16} /> Confirm Resolution
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
