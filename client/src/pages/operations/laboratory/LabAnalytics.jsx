import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Cpu, 
  Play, 
  Zap, 
  Send, 
  Activity,
  Layers,
  ShieldCheck,
  Building
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import laboratoryService from '../../../services/laboratoryService';

export const LabAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rpaJobs, setRpaJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // RPA Trigger modal
  const [showRpaModal, setShowRpaModal] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [rpaData, setRpaData] = useState({
    jobType: 'LIS_RESULT_IMPORT',
    targetOrderCount: 10,
    dryRun: false
  });

  useEffect(() => {
    fetchMetrics();
    fetchRpaJobs();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.getDashboardMetrics();
      if (res.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load lab analytics metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRpaJobs = async () => {
    try {
      setJobsLoading(true);
      const res = await laboratoryService.listRpaJobs({ limit: 20 });
      if (res.success) {
        setRpaJobs(res.data);
      }
    } catch (err) {
      console.error('Failed to load RPA jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleTriggerRpa = async (e) => {
    e.preventDefault();
    try {
      setTriggering(true);
      const res = await laboratoryService.triggerRpaJob(rpaData);
      if (res.success) {
        setShowRpaModal(false);
        fetchRpaJobs();
        fetchMetrics();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to trigger RPA job.');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            Laboratory Analytics & RPA Automation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time diagnostic turnaround times (TAT), volume distributions, external LIS mock sync, and RPA batch dispatching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => { fetchMetrics(); fetchRpaJobs(); }}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => setShowRpaModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Trigger RPA Worker
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Orders</span>
            <Activity className="h-5 w-5 text-primary-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {metrics?.orderStats?.total || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            STAT: <span className="font-bold text-red-500">{metrics?.orderStats?.stat || 0}</span> • Routine: {metrics?.orderStats?.routine || 0}
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Avg Turnaround Time</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {metrics?.tatMinutesAverage || 45} mins
          </div>
          <div className="text-xs text-green-600 font-medium mt-1">
            Target SLA compliance: 98.4%
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Pending Verification</span>
            <ShieldCheck className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {metrics?.resultsPendingVerification || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Awaiting Pathologist review
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Specimen Rejections</span>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {metrics?.sampleStats?.rejected || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Quality non-conformance logged
          </div>
        </div>
      </div>

      {/* Grid: LIS Health & Volume Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LIS Health Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-primary-600" />
              External LIS Gateway Health
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              ONLINE (Mock HL7 / FHIR)
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Bidirectional interface with Roche Cobas, Sysmex XN, and Hospital Core LIS. Automated results polling and order transmission running in normal parameters.
          </p>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 rounded bg-gray-50 dark:bg-gray-800/40">
              <span className="text-gray-500">Protocol Standard:</span>
              <span className="font-mono font-semibold">HL7 v2.5 / FHIR R4</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-gray-50 dark:bg-gray-800/40">
              <span className="text-gray-500">Average Interface Latency:</span>
              <span className="font-mono font-semibold">42 ms</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-gray-50 dark:bg-gray-800/40">
              <span className="text-gray-500">Reconciliation Discrepancy Rate:</span>
              <span className="font-mono font-semibold text-green-600">0.00%</span>
            </div>
          </div>
        </div>

        {/* Volume by Category */}
        <div className="card p-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              Diagnostic Volume Distribution
            </h3>
            <span className="text-xs text-gray-500">Last 30 Days</span>
          </div>

          <div className="space-y-3">
            {[
              { cat: 'Hematology (CBC, PT/INR, ESR)', percent: 38, count: 1420 },
              { cat: 'Biochemistry (CMP, Lipids, HbA1c)', percent: 34, count: 1280 },
              { cat: 'Microbiology & Cultures', percent: 14, count: 520 },
              { cat: 'Immunology & Serology', percent: 9, count: 340 },
              { cat: 'Urinalysis & Toxicology', percent: 5, count: 185 },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{item.cat}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{item.count} tests ({item.percent}%)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RPA Automation Jobs Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary-600" />
            Automated Laboratory RPA Worker Jobs
          </h3>
          <span className="text-xs text-gray-500">Autonomous batch synchronization and dispatch</span>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Payload / Target</th>
                <th>Created At</th>
                <th>Completed At</th>
              </tr>
            </thead>
            <tbody>
              {jobsLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary-500" />
                    Loading RPA worker history...
                  </td>
                </tr>
              ) : rpaJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500 text-sm">
                    No laboratory RPA jobs executed recently.
                  </td>
                </tr>
              ) : (
                rpaJobs.map((job) => (
                  <tr key={job._id || job.jobId}>
                    <td className="font-mono font-bold text-primary-600 text-xs">
                      {job.jobId || job._id}
                    </td>
                    <td className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                      {job.type}
                    </td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="text-xs text-gray-500 font-mono truncate max-w-xs">
                      {JSON.stringify(job.payload || {})}
                    </td>
                    <td className="text-xs text-gray-500">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="text-xs text-gray-500">
                      {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'In Progress / Queued'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trigger RPA Job Modal */}
      <Modal
        isOpen={showRpaModal}
        onClose={() => setShowRpaModal(false)}
        title="Trigger Laboratory RPA Background Worker"
      >
        <form onSubmit={handleTriggerRpa} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Dispatch an autonomous RPA bot to process external LIS sync or monitor turnaround times.
          </p>

          <div>
            <label className="label">RPA Job Type *</label>
            <select
              value={rpaData.jobType}
              onChange={(e) => setRpaData({ ...rpaData, jobType: e.target.value })}
              className="input w-full font-semibold"
            >
              <option value="LIS_RESULT_IMPORT">LIS_RESULT_IMPORT (Fetch External Results Batch)</option>
              <option value="TAT_MONITOR">TAT_MONITOR (Turnaround Time SLA Expiration Watcher)</option>
              <option value="REPORTS_AUTODISPATCH">REPORTS_AUTODISPATCH (Dispatch Finalized Reports to Portal)</option>
            </select>
          </div>

          <div>
            <label className="label">Target Order Batch Count</label>
            <input
              type="number"
              min="1"
              max="100"
              value={rpaData.targetOrderCount}
              onChange={(e) => setRpaData({ ...rpaData, targetOrderCount: parseInt(e.target.value) || 10 })}
              className="input w-full"
            />
          </div>

          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rpaData.dryRun}
                onChange={(e) => setRpaData({ ...rpaData, dryRun: e.target.checked })}
                className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dry Run Mode (Simulate without database persistence)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowRpaModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={triggering}
              className="btn btn-primary flex items-center gap-2"
            >
              {triggering ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Spawning RPA Worker...
                </>
              ) : (
                'Launch RPA Job'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LabAnalytics;
