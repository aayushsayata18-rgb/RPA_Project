import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Sliders, Edit3, Save, RefreshCw } from 'lucide-react';

export const HospitalConfigPage = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState(null);
  const [editValue, setEditValue] = useState('');

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/configuration');
      setConfigs(res.data || []);
    } catch (err) {
      console.error('Failed to load configurations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleEditClick = (config) => {
    setEditingConfig(config);
    setEditValue(config.value);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingConfig) return;

    try {
      await api.put(`/configuration/${editingConfig.configKey}`, {
        value: editingConfig.valueType === 'NUMBER' ? Number(editValue) : editValue
      });
      setEditingConfig(null);
      fetchConfigs();
    } catch (err) {
      alert(err.message || 'Failed to update configuration.');
    }
  };

  const columns = [
    { header: 'Key', accessor: 'configKey', render: (row) => <code style={{ color: '#38bdf8' }}>{row.configKey}</code> },
    { header: 'Display Name', accessor: 'displayName', render: (row) => <strong>{row.displayName}</strong> },
    { header: 'Category', accessor: 'category', render: (row) => <span className="badge badge-secondary">{row.category}</span> },
    { header: 'Current Value', accessor: 'value', render: (row) => <span className="badge badge-info">{String(row.value)}</span> },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Action',
      accessor: 'action',
      render: (row) => (
        <button
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
          onClick={() => handleEditClick(row)}
        >
          <Edit3 size={14} /> Edit
        </button>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospital Business Rules & Settings</h1>
          <p className="page-subtitle">Dynamic Configurable Parameters (00_MASTER.md Section 44 & 76)</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchConfigs}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="card">
        <DataTable columns={columns} data={configs} emptyMessage="No configuration settings found." />
      </div>

      {/* Edit Config Modal */}
      <Modal
        isOpen={!!editingConfig}
        onClose={() => setEditingConfig(null)}
        title={`Edit Rule: ${editingConfig?.displayName}`}
      >
        {editingConfig && (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Configuration Key</label>
              <input type="text" className="form-control" value={editingConfig.configKey} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Value ({editingConfig.valueType})</label>
              <input
                type={editingConfig.valueType === 'NUMBER' ? 'number' : 'text'}
                className="form-control"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                required
              />
              <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {editingConfig.description}
              </small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingConfig(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
