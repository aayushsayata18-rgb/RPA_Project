import React, { useState, useEffect } from 'react';
import { ShieldCheck, PlusCircle, Calendar, Building, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import maintenanceService from '../../../services/maintenanceService';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';

export const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Renew Modal
  const [selectedContract, setSelectedContract] = useState(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewForm, setRenewForm] = useState({
    newStartDate: '',
    newEndDate: '',
    newCost: 0,
    terms: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getContracts();
      setContracts(res.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const openRenew = (c) => {
    setSelectedContract(c);
    setRenewForm({
      newStartDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : '',
      newEndDate: '',
      newCost: c.cost || 0,
      terms: c.terms || ''
    });
    setShowRenewModal(true);
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContract) return;
    try {
      setSubmitting(true);
      await maintenanceService.renewContract(selectedContract._id, renewForm);
      setShowRenewModal(false);
      fetchContracts();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Renewal failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contracts-page p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/operations/maintenance" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-violet-600" />
              Equipment AMC & Service Contracts
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            Annual maintenance contracts, warranty agreements, vendor coverage, and renewal tracking
          </p>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Contract ID</th>
                <th className="py-3 px-4">Contract #</th>
                <th className="py-3 px-4">Vendor Partner</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Covered Assets</th>
                <th className="py-3 px-4">Start - End Date</th>
                <th className="py-3 px-4">Annual Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">Loading contracts...</td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">No active maintenance contracts found.</td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c._id} className="hover:bg-violet-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-violet-700">{c.contractId}</td>
                    <td className="py-3 px-4 font-mono text-xs">{c.contractNumber}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{c.vendorId?.name || 'Vendor'}</td>
                    <td className="py-3 px-4 text-xs font-bold">{c.contractType}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {c.coveredAssets?.length || 0} equipment units
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(c.startDate).toLocaleDateString()} - <strong className="text-gray-900">{new Date(c.endDate).toLocaleDateString()}</strong>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-emerald-600">₹{c.cost?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openRenew(c)}
                        className="px-2.5 py-1 text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 rounded font-semibold"
                      >
                        Renew
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renew Modal */}
      {showRenewModal && selectedContract && (
        <Modal title={`Renew Contract: ${selectedContract.contractId}`} onClose={() => setShowRenewModal(false)}>
          <form onSubmit={handleRenewSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Start Date</label>
                <input
                  type="date"
                  required
                  value={renewForm.newStartDate}
                  onChange={(e) => setRenewForm({ ...renewForm, newStartDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New End Date</label>
                <input
                  type="date"
                  required
                  value={renewForm.newEndDate}
                  onChange={(e) => setRenewForm({ ...renewForm, newEndDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Revised Annual Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={renewForm.newCost}
                onChange={(e) => setRenewForm({ ...renewForm, newCost: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Updated Scope / Terms</label>
              <textarea
                rows={2}
                value={renewForm.terms}
                onChange={(e) => setRenewForm({ ...renewForm, terms: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowRenewModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg shadow-sm"
              >
                {submitting ? 'Renewing...' : 'Confirm Renewal'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Contracts;
