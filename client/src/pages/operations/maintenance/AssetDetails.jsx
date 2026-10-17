import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Cpu,
  ArrowLeft,
  Calendar,
  Clock,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  RefreshCw,
  PlusCircle,
  Tag,
  Activity,
  History
} from 'lucide-react';
import maintenanceService from '../../../services/maintenanceService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  // Status Change Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('AVAILABLE');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchAssetHistory = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getAssetHistory(id);
      setHistoryData(res.data?.data || null);
      if (res.data?.data?.asset) {
        setNewStatus(res.data.data.asset.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetHistory();
  }, [id]);

  const handleStatusChange = async (e) => {
    e.preventDefault();
    try {
      setUpdatingStatus(true);
      await maintenanceService.updateAssetStatus(id, newStatus, statusReason);
      setShowStatusModal(false);
      setStatusReason('');
      fetchAssetHistory();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update asset status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading asset dossier...</div>;
  }

  if (!historyData || !historyData.asset) {
    return <div className="p-8 text-center text-red-500">Asset dossier not found.</div>;
  }

  const { asset, timeline = [], workOrders = [], requests = [], calibrations = [], contracts = [] } = historyData;

  return (
    <div className="asset-details-page p-6 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          to="/operations/maintenance/assets"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Asset Master
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStatusModal(true)}
            className="px-3.5 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Change Status
          </button>

          <Link
            to="/operations/maintenance/requests"
            state={{ defaultAssetId: asset._id }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Report Issue
          </Link>
        </div>
      </div>

      {/* Equipment Dossier Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                {asset.assetTag}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            </div>
            <p className="text-sm text-gray-500">
              {asset.manufacturer || 'Unknown Manufacturer'} • Model: {asset.model || 'N/A'} • Serial: <span className="font-mono">{asset.serialNumber || 'N/A'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-400">Current Status</div>
              <StatusBadge status={asset.status} />
            </div>

            <div className="text-right pl-3 border-l">
              <div className="text-xs text-gray-400">Criticality</div>
              <span className={`text-xs px-2.5 py-1 rounded font-bold ${
                asset.criticality === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                asset.criticality === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {asset.criticality}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-gray-400 block">Category</span>
            <span className="font-semibold text-gray-800">{asset.categoryId?.name || 'General'}</span>
          </div>

          <div>
            <span className="text-gray-400 block">Department</span>
            <span className="font-semibold text-gray-800">{asset.departmentId?.name || 'Central Facility'}</span>
          </div>

          <div>
            <span className="text-gray-400 block">Installation Date</span>
            <span className="font-semibold text-gray-800">
              {asset.installationDate ? new Date(asset.installationDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block">Warranty Coverage</span>
            <span className={`font-semibold ${
              asset.warrantyEndDate && new Date(asset.warrantyEndDate) > new Date() ? 'text-emerald-600' : 'text-gray-500'
            }`}>
              {asset.warrantyEndDate ? `Until ${new Date(asset.warrantyEndDate).toLocaleDateString()}` : 'No Warranty Recorded'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-semibold">
        {[
          { key: 'timeline', label: 'Lifecycle Timeline', count: timeline.length },
          { key: 'workOrders', label: 'Work Orders', count: workOrders.length },
          { key: 'requests', label: 'Requests', count: requests.length },
          { key: 'calibrations', label: 'Calibrations', count: calibrations.length },
          { key: 'contracts', label: 'AMC & Contracts', count: contracts.length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-normal">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Complete Historical Equipment Timeline
          </h3>

          <div className="relative pl-6 border-l-2 border-blue-200 space-y-6">
            {timeline.length === 0 ? (
              <p className="text-sm text-gray-400">No events logged for this asset yet.</p>
            ) : (
              timeline.map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full"></div>
                  <div className="bg-gray-50 hover:bg-blue-50/40 p-4 rounded-xl border border-gray-200/60 transition-colors">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span className="font-semibold text-blue-600 uppercase tracking-wider">{item.event.replace(/_/g, ' ')}</span>
                      <span>{new Date(item.date).toLocaleString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{item.details}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Work Orders */}
      {activeTab === 'workOrders' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="py-3 px-4">WO Number</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Downtime</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">No work orders recorded for this asset.</td>
                </tr>
              ) : (
                workOrders.map((wo) => (
                  <tr key={wo._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{wo.workOrderId}</td>
                    <td className="py-3 px-4 text-xs">{wo.maintenanceType}</td>
                    <td className="py-3 px-4 text-xs font-bold">{wo.priority}</td>
                    <td className="py-3 px-4 text-xs">
                      {wo.assignedTechnicianId?.firstName ? `${wo.assignedTechnicianId.firstName} ${wo.assignedTechnicianId.lastName}` : wo.assignedVendorId?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={wo.status} /></td>
                    <td className="py-3 px-4 text-xs font-mono">{wo.downtimeDurationMinutes ? `${wo.downtimeDurationMinutes}m` : '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/operations/maintenance/work-orders/${wo._id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Headline</th>
                <th className="py-3 px-4">Issue Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reported At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">No requests filed for this equipment.</td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-700">{r.requestId}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{r.title}</td>
                    <td className="py-3 px-4 text-xs">{r.issueType}</td>
                    <td className="py-3 px-4 text-xs font-bold">{r.priority}</td>
                    <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3 px-4 text-xs text-gray-500">{new Date(r.requestedAt || r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Calibrations */}
      {activeTab === 'calibrations' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="py-3 px-4">Calibration ID</th>
                <th className="py-3 px-4">Certificate #</th>
                <th className="py-3 px-4">Performed Date</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {calibrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">No calibration logs registered.</td>
                </tr>
              ) : (
                calibrations.map((cal) => (
                  <tr key={cal._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{cal.calibrationId}</td>
                    <td className="py-3 px-4 text-xs font-mono">{cal.certificateNumber || '—'}</td>
                    <td className="py-3 px-4 text-xs">{new Date(cal.performedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-indigo-700">{new Date(cal.dueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        cal.result === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cal.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">{cal.performedByName || 'Authorized BioMed'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Contracts */}
      {activeTab === 'contracts' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="py-3 px-4">Contract ID</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">No AMC or service contracts linked to this asset.</td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-800">{c.contractId}</td>
                    <td className="py-3 px-4 text-xs font-semibold">{c.vendorId?.name || 'Vendor'}</td>
                    <td className="py-3 px-4 text-xs">{c.contractType}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{new Date(c.startDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-emerald-700">{new Date(c.endDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && (
        <Modal
          title="Update Equipment Operational Status"
          onClose={() => setShowStatusModal(false)}
        >
          <form onSubmit={handleStatusChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="ACTIVE">ACTIVE (Clinically Operational)</option>
                <option value="AVAILABLE">AVAILABLE (Standby Ready)</option>
                <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE (Technician Working)</option>
                <option value="OUT_OF_SERVICE">OUT OF SERVICE (Hazardous / Decommissioned)</option>
                <option value="PENDING_INSPECTION">PENDING INSPECTION (Awaiting Verification)</option>
                <option value="QUARANTINED">QUARANTINED (Contaminated / Isolated)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason / Authorization Notes *</label>
              <textarea
                rows={3}
                required
                placeholder="Specify clinical or engineering authorization reason..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingStatus}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm"
              >
                {updatingStatus ? 'Updating...' : 'Confirm Status Change'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AssetDetails;
