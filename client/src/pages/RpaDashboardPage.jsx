import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Bot, Play, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const RpaDashboardPage = () => {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ TOTAL: 0, RUNNING: 0, SUCCESS: 0, FAILED: 0, EXCEPTION: 0 });
  const [loading, setLoading] = useState(true);
  const [showRunModal, setShowRunModal] = useState(false);
  const [newJob, setNewJob] = useState({
    jobName: 'Insurance Policy Real-Time Verification',
    module: 'INSURANCE',
    targetSystem: 'INSURANCE_PORTAL',
    action: 'VERIFY_POLICY',
    entityType: 'InsurancePolicy',
    entityId: 'POL-10023'
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rpa/jobs');
      setJobs(res.data.jobs || []);
      setStats(res.data.statusCounts || {});
    } catch (err) {
      console.error('Failed to load RPA jobs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rpa/jobs', newJob);
      setShowRunModal(false);
      fetchJobs();
    } catch (err) {
      alert(err.message || 'Failed to trigger RPA job.');
    }
  };

  const columns = [
    { header: 'Job ID', accessor: 'jobId', render: (row) => <code style={{ color: '#38bdf8' }}>{row.jobId}</code> },
    { header: 'Job Name', accessor: 'jobName', render: (row) => <strong>{row.jobName}</strong> },
    { header: 'Module', accessor: 'module', render: (row) => <span className="badge badge-secondary">{row.module}</span> },
    { header: 'Target System', accessor: 'targetSystem' },
    { header: 'Status', accessor: 'status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Retries', accessor: 'retryCount', render: (row) => `${row.retryCount}/${row.maxRetries}` },
    { header: 'Created At', accessor: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleTimeString() }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">RPA Automation Center</h1>
          <p className="page-subtitle">Robot Framework Worker Orchestration & Execution Monitoring</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchJobs}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowRunModal(true)}>
            <Play size={16} /> Trigger RPA Job
          </button>
        </div>
      </div>

      {/* RPA Metric Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <StatCard title="Total Jobs" value={stats.TOTAL || 0} icon={Bot} color="#0284c7" />
        <StatCard title="Running / Queued" value={stats.RUNNING || 0} icon={Clock} color="#f59e0b" />
        <StatCard title="Successful" value={stats.SUCCESS || 0} icon={CheckCircle} color="#10b981" />
        <StatCard title="Failed / Exceptions" value={(stats.FAILED || 0) + (stats.EXCEPTION || 0)} icon={AlertTriangle} color="#ef4444" />
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3>Robot Framework Automation Jobs</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Idempotent • API & Browser Workers
          </span>
        </div>

        <DataTable columns={columns} data={jobs} emptyMessage="No RPA jobs recorded yet. Trigger one above." />
      </div>

      {/* Trigger RPA Job Modal */}
      <Modal isOpen={showRunModal} onClose={() => setShowRunModal(false)} title="Trigger RPA Automation Worker">
        <form onSubmit={handleCreateJob}>
          <div className="form-group">
            <label className="form-label">Job Name</label>
            <input
              type="text"
              className="form-control"
              value={newJob.jobName}
              onChange={(e) => setNewJob({ ...newJob, jobName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hospital Module</label>
            <select
              className="form-control"
              value={newJob.module}
              onChange={(e) => setNewJob({ ...newJob, module: e.target.value })}
            >
              <option value="PATIENT_REGISTRATION">Patient Registration</option>
              <option value="APPOINTMENTS">Appointment Management</option>
              <option value="INSURANCE">Insurance Verification</option>
              <option value="CLAIMS">Insurance Claims</option>
              <option value="BILLING">Billing Reconciliation</option>
              <option value="WORKFORCE">Doctor Schedule Sync</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target External System</label>
            <input
              type="text"
              className="form-control"
              value={newJob.targetSystem}
              onChange={(e) => setNewJob({ ...newJob, targetSystem: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Entity ID Reference</label>
            <input
              type="text"
              className="form-control"
              value={newJob.entityId}
              onChange={(e) => setNewJob({ ...newJob, entityId: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowRunModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Queue Robot Worker
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
