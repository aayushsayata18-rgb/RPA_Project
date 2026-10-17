import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, CheckCircle2, ArrowRight, RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import maintenanceService from '../../../services/maintenanceService';
import { StatusBadge } from '../../../components/common/StatusBadge';

export const PartsRequests = () => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchParts = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getPartRequests({ status: statusFilter });
      setParts(res.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      await maintenanceService.approvePartRequest(id);
      fetchParts();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Approval failed');
    }
  };

  const handleIssue = async (id, reqQty, unitCost) => {
    const qty = prompt(`Enter quantity to issue:`, reqQty);
    if (!qty) return;
    try {
      await maintenanceService.issuePart(id, { quantityIssued: Number(qty), unitCost });
      fetchParts();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Issue failed');
    }
  };

  return (
    <div className="parts-requests-page p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/operations/maintenance" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-amber-600" />
              Spare Parts & Consumables Requisitions
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            Inventory requisition integration, issue tracking, and work order cost allocation
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="ISSUED">ISSUED</option>
          <option value="RETURNED">RETURNED</option>
        </select>
      </div>

      {/* Parts Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Work Order</th>
                <th className="py-3 px-4">Part Name & Code</th>
                <th className="py-3 px-4">Qty Req / Issued</th>
                <th className="py-3 px-4">Unit Cost</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">Loading parts requests...</td>
                </tr>
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">No spare part requisitions found.</td>
                </tr>
              ) : (
                parts.map((p) => (
                  <tr key={p._id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-800">{p.requestId}</td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/operations/maintenance/work-orders/${p.workOrderId?._id || p.workOrderId}`}
                        className="font-mono text-xs font-bold text-blue-600 hover:underline"
                      >
                        {p.workOrderId?.workOrderId || 'WO'}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{p.partName}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.partNumber || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      {p.quantityRequested} / <span className="text-emerald-700">{p.quantityIssued || 0}</span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">₹{p.unitCost || 0}</td>
                    <td className="py-3 px-4 text-xs font-mono font-bold text-gray-900">₹{p.totalCost || 0}</td>
                    <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                    <td className="py-3 px-4 text-right">
                      {p.status === 'REQUESTED' && (
                        <button
                          onClick={() => handleApprove(p._id)}
                          className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold"
                        >
                          Approve
                        </button>
                      )}
                      {(p.status === 'APPROVED' || p.status === 'REQUESTED') && (
                        <button
                          onClick={() => handleIssue(p._id, p.quantityRequested, p.unitCost)}
                          className="ml-2 px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold"
                        >
                          Issue Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartsRequests;
