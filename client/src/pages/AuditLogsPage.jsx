import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { History, RefreshCw, Filter } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = moduleFilter ? `/audit?module=${moduleFilter}` : '/audit';
      const res = await api.get(url);
      setLogs(res.data.events || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const columns = [
    { header: 'Event ID', accessor: 'eventId', render: (row) => <code style={{ color: '#38bdf8' }}>{row.eventId}</code> },
    { header: 'Timestamp', accessor: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleString() },
    { header: 'User / Role', accessor: 'userId', render: (row) => `${row.userId} (${row.role})` },
    { header: 'Action', accessor: 'action', render: (row) => <strong>{row.action}</strong> },
    { header: 'Module', accessor: 'module', render: (row) => <span className="badge badge-secondary">{row.module}</span> },
    { header: 'Entity', accessor: 'entityType', render: (row) => `${row.entityType}:${row.entityId}` },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Details', accessor: 'details' }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Immutable Audit Log Center</h1>
          <p className="page-subtitle">Complete Traceability for Every Administrative Action (00_MASTER.md Section 41 & 69)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            className="form-control"
            style={{ width: '180px' }}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="">All Modules</option>
            <option value="AUTH">Authentication</option>
            <option value="CONFIG">Configuration</option>
            <option value="PATIENT_REGISTRATION">Patient Registration</option>
            <option value="APPOINTMENTS">Appointments</option>
            <option value="BILLING">Billing & Payments</option>
            <option value="RPA">RPA Automations</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchLogs}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={logs} emptyMessage="No audit logs match current filters." />
      </div>
    </div>
  );
};
