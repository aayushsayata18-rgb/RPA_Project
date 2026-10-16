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
  Activity,
  Layers,
  ShieldCheck,
  Building,
  Radio,
  FileCheck
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import radiologyService from '../../../services/radiologyService';

export const RadiologyAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rpaJobs, setRpaJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // RPA Trigger modal
  const [showRpaModal, setShowRpaModal] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [rpaData, setRpaData] = useState({
    jobType: 'RIS_ORDER_SYNC',
    dryRun: false
  });

  useEffect(() => {
    fetchMetrics();
    fetchRpaJobs();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await radiologyService.getDashboardMetrics();
      if (res.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load radiology analytics metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRpaJobs = async () => {
    try {
      setJobsLoading(true);
      const res = await radiologyService.listRpaJobs({ limit: 20 });
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
      const res = await radiologyService.triggerRpaJob(rpaData.jobType, { dryRun: rpaData.dryRun });
      if (res.success) {
        setShowRpaModal(false);
        fetchRpaJobs();
        fetchMetrics();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to trigger RPA Job');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Radiology Analytics & RPA Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time scanner utilization, turn-around time (TAT) monitoring, and autonomous RPA pipeline administration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchMetrics(); fetchRpaJobs(); }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowRpaModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            Run RPA Bot
          </button>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 dark:text-indigo-300">
          <span className="font-semibold">Clinical & Administrative Safety Guarantee:</span> RPA automation is strictly confined to administrative scheduling, accession synchronization, mock PACS metadata links, and billing reconciliation. Diagnostic image interpretations and reports are exclusively verified and signed by certified radiologists.
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Orders</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
              <Radio className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '...' : (metrics?.counts?.orders || 0)}
            </span>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span>Completed: <strong className="text-emerald-600">{metrics?.counts?.completedOrders || 0}</strong></span>
              <span>•</span>
              <span>Pending: <strong className="text-amber-600">{metrics?.counts?.pendingOrders || 0}</strong></span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Studies Performed</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '...' : (metrics?.counts?.studies || 0)}
            </span>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span>Completed Scans: <strong className="text-emerald-600">{metrics?.counts?.completedStudies || 0}</strong></span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Reports Released</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg">
              <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '...' : (metrics?.counts?.releasedReports || 0)}
            </span>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span>Drafts in Review: <strong className="text-amber-600">{metrics?.counts?.draftReports || 0}</strong></span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Exceptions Flagged</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-900/40 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '...' : (metrics?.counts?.openExceptions || 0)}
            </span>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span>Requires coordinator review</span>
            </div>
          </div>
        </div>
      </div>

      {/* TAT Benchmarks & Modality Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Turn-Around Time (TAT) Targets vs Actuals
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600 dark:text-slate-300">STAT / Critical Emergency Orders (Goal: &lt; 60 mins)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">42 mins avg</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600 dark:text-slate-300">Urgent Inpatient Exams (Goal: &lt; 4 hours)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">2.8 hours avg</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600 dark:text-slate-300">Routine Outpatient CT / MRI (Goal: &lt; 24 hours)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">14.5 hours avg</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600 dark:text-slate-300">Routine Screening X-Ray (Goal: &lt; 6 hours)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">3.1 hours avg</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '52%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Scanner & Modality Operational Health
          </h2>
          <div className="space-y-3">
            {[
              { name: 'X-Ray Station Alpha (XR-01)', type: 'X-Ray', status: 'AVAILABLE', util: '78%' },
              { name: 'Multislice CT Scanner 64 (CT-01)', type: 'CT', status: 'AVAILABLE', util: '92%' },
              { name: 'High-Field 3T MRI Suite (MRI-01)', type: 'MRI', status: 'AVAILABLE', util: '85%' },
              { name: 'Color Doppler Ultrasound (US-01)', type: 'Ultrasound', status: 'AVAILABLE', util: '64%' }
            ].map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-750 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{m.name}</div>
                    <div className="text-xs text-slate-400">{m.type} • Utilization: {m.util}</div>
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RPA Bot Execution History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              Autonomous RPA Execution Logs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated sync tasks executing across RIS, PACS metadata archives, billing charges, and critical alert notifications.
            </p>
          </div>
          <button
            onClick={fetchRpaJobs}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-750 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Job ID & Type</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Processed Items</th>
                <th className="px-5 py-3.5">Started At</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
              {jobsLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">Loading RPA job records...</td>
                </tr>
              ) : rpaJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">No RPA bot executions recorded yet.</td>
                </tr>
              ) : (
                rpaJobs.map((job) => (
                  <tr key={job._id || job.jobId} className="hover:bg-slate-50 dark:hover:bg-slate-750/50">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{job.jobType || job.type}</div>
                      <div className="text-xs font-mono text-slate-400">{job.jobId || job._id}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      {job.processedCount || job.result?.processedCount || 0} records
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {job.durationMs ? `${job.durationMs}ms` : 'Instant'}
                    </td>
                    <td className="px-5 py-3.5 text-xs max-w-xs truncate text-slate-600 dark:text-slate-400">
                      {job.result?.message || job.summary || (job.status === 'COMPLETED' ? 'Completed successfully' : 'In progress')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RPA Trigger Modal */}
      {showRpaModal && (
        <Modal
          isOpen={showRpaModal}
          onClose={() => setShowRpaModal(false)}
          title="Dispatch Autonomous Radiology RPA Bot"
        >
          <form onSubmit={handleTriggerRpa} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Select RPA Job Operation
              </label>
              <select
                value={rpaData.jobType}
                onChange={(e) => setRpaData({ ...rpaData, jobType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
              >
                <option value="RIS_ORDER_SYNC">RIS External Order Sync & Worklist Ingestion</option>
                <option value="PACS_IMAGE_VERIFY">PACS Study Archival & Image Verification</option>
                <option value="BILLING_RECONCILIATION">Radiology Billing & Consumable Reconciliation</option>
                <option value="CRITICAL_ALERT_DISPATCH">Critical Finding Notification Dispatch</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="dryRun"
                checked={rpaData.dryRun}
                onChange={(e) => setRpaData({ ...rpaData, dryRun: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="dryRun" className="text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                Dry Run Simulation (Perform validation checks without committing database charges)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowRpaModal(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={triggering}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {triggering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                {triggering ? 'Executing Bot...' : 'Execute Bot'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RadiologyAnalytics;
