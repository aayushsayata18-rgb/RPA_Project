import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  FileEdit, 
  RefreshCw, 
  UserCheck, 
  Info,
  Clock,
  Eye,
  XCircle,
  FileCheck2
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import laboratoryService from '../../../services/laboratoryService';

export const VerificationQueue = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [criticalOnly, setCriticalOnly] = useState(false);

  // Verification Modal
  const [selectedResult, setSelectedResult] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyData, setVerifyData] = useState({
    verifiedBy: 'Dr. Arthur Campbell (Pathologist)',
    pathologistId: 'DOC-PATH-01',
    pathologistNotes: ''
  });

  // Amendment Modal
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amending, setAmending] = useState(false);
  const [amendData, setAmendData] = useState({
    amendedBy: 'Dr. Arthur Campbell (Pathologist)',
    amendmentReason: '',
    parameters: []
  });

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.getVerificationQueue();
      if (res.success) {
        setResults(res.data);
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerify = (result) => {
    setSelectedResult(result);
    setVerifyData({
      verifiedBy: 'Dr. Arthur Campbell (Pathologist)',
      pathologistId: 'DOC-PATH-01',
      pathologistNotes: 'Clinical parameters reviewed. Normal biological variations verified against patient clinical history.'
    });
    setShowVerifyModal(true);
  };

  const handleConfirmVerify = async (e) => {
    e.preventDefault();
    if (!selectedResult) return;

    try {
      setVerifying(true);
      const res = await laboratoryService.verifyResult(selectedResult.resultId, {
        verifiedBy: verifyData.verifiedBy,
        pathologistId: verifyData.pathologistId,
        pathologistNotes: verifyData.pathologistNotes
      });
      if (res.success) {
        setShowVerifyModal(false);
        setSelectedResult(null);
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleOpenAmend = (result) => {
    setSelectedResult(result);
    setAmendData({
      amendedBy: 'Dr. Arthur Campbell (Pathologist)',
      amendmentReason: '',
      parameters: result.parameters.map(p => ({ ...p }))
    });
    setShowAmendModal(true);
  };

  const handleConfirmAmend = async (e) => {
    e.preventDefault();
    if (!selectedResult) return;
    if (!amendData.amendmentReason.trim()) {
      alert('An audit-logged clinical amendment reason is mandatory.');
      return;
    }

    try {
      setAmending(true);
      const res = await laboratoryService.amendResult(selectedResult.resultId, {
        amendedBy: amendData.amendedBy,
        amendmentReason: amendData.amendmentReason,
        parameters: amendData.parameters
      });
      if (res.success) {
        setShowAmendModal(false);
        setSelectedResult(null);
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Amendment failed.');
    } finally {
      setAmending(false);
    }
  };

  const filteredResults = results.filter(r => {
    if (criticalOnly && !r.hasCriticalFlag) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.resultId?.toLowerCase().includes(q) ||
      r.labOrderId?.toLowerCase().includes(q) ||
      (r.testName || '').toLowerCase().includes(q) ||
      (r.enteredBy || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            Pathologist Verification & Quality Review Queue
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Segregation-of-duties review queue: Pathologists verify technical results before clinical release.
          </p>
        </div>

        <button 
          onClick={fetchQueue}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Filter and Critical Toggle */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Result ID, Order ID, Test Name, or Technician..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={criticalOnly}
            onChange={(e) => setCriticalOnly(e.target.checked)}
            className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
          />
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Critical Values Only
          </span>
        </label>
      </div>

      {/* Verification Queue Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 text-center text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-500" />
            Loading verification queue...
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Queue is Clear!</h3>
            <p className="text-xs text-gray-400 mt-1">All analytical results have been verified or no pending entries require review.</p>
          </div>
        ) : (
          filteredResults.map((res) => (
            <div 
              key={res.resultId}
              className={`card p-5 border-l-4 transition hover:shadow-md ${
                res.hasCriticalFlag ? 'border-l-red-500 bg-red-50/20' : 'border-l-primary-500'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-bold text-lg text-primary-600 dark:text-primary-400">
                      {res.resultId}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-base">
                      {res.testName || res.testCode}
                    </span>
                    <StatusBadge status={res.status} />
                    {res.hasCriticalFlag && (
                      <span className="badge badge-error animate-pulse font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        CRITICAL VALUE
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Order: <strong className="text-gray-700 dark:text-gray-300 font-mono">{res.labOrderId}</strong></span>
                    <span>Sample: <strong className="text-gray-700 dark:text-gray-300 font-mono">{res.sampleId}</strong></span>
                    <span>Entered by: <strong className="text-gray-700 dark:text-gray-300">{res.enteredBy}</strong></span>
                    <span>Entered at: {new Date(res.enteredAt || res.createdAt).toLocaleString()}</span>
                  </div>

                  {/* Parameters Table Preview */}
                  <div className="mt-3 overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="table w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th>Parameter</th>
                          <th>Measured Value</th>
                          <th>Reference Range</th>
                          <th>Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {res.parameters?.map((p, idx) => (
                          <tr key={idx}>
                            <td className="font-medium text-gray-900 dark:text-white">{p.name}</td>
                            <td className="font-bold font-mono">
                              {p.value} {p.unit}
                            </td>
                            <td className="text-gray-500">{p.referenceRange || 'N/A'}</td>
                            <td>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                p.flag === 'CRITICAL' ? 'bg-red-100 text-red-800 animate-pulse' :
                                p.flag === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                                p.flag === 'LOW' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {p.flag}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {res.technicianNotes && (
                    <p className="text-xs italic text-gray-600 dark:text-gray-400 mt-2">
                      Technician Note: {res.technicianNotes}
                    </p>
                  )}
                </div>

                {/* Pathologist Actions */}
                <div className="flex md:flex-col items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleOpenVerify(res)}
                    className="btn btn-primary btn-sm flex items-center gap-1.5 w-full justify-center"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Verify Result
                  </button>

                  <button
                    onClick={() => handleOpenAmend(res)}
                    className="btn btn-secondary btn-sm flex items-center gap-1.5 w-full justify-center"
                  >
                    <FileEdit className="h-4 w-4" />
                    Amend Values
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Verify Result Modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title="Pathologist Verification & Medical Clearance"
      >
        {selectedResult && (
          <form onSubmit={handleConfirmVerify} className="space-y-4">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200 flex items-start gap-2">
              <UserCheck className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
              <div>
                <strong>Segregation of Duties Confirmed:</strong> You are validating this test as the reviewing Pathologist. Once verified, this report can be finalized and made accessible to clinicians and patients.
              </div>
            </div>

            <div className="text-sm space-y-1">
              <div>Result ID: <strong className="font-mono">{selectedResult.resultId}</strong></div>
              <div>Test: <strong>{selectedResult.testName || selectedResult.testCode}</strong></div>
              <div>Entered By Technician: <strong>{selectedResult.enteredBy}</strong></div>
            </div>

            <div>
              <label className="label">Verifying Pathologist Name *</label>
              <input
                type="text"
                required
                value={verifyData.verifiedBy}
                onChange={(e) => setVerifyData({ ...verifyData, verifiedBy: e.target.value })}
                className="input w-full font-semibold"
              />
            </div>

            <div>
              <label className="label">Pathologist Clinical Comments & Sign-off Notes</label>
              <textarea
                rows="3"
                value={verifyData.pathologistNotes}
                onChange={(e) => setVerifyData({ ...verifyData, pathologistNotes: e.target.value })}
                className="input w-full"
                placeholder="Diagnostic correlation notes, clinical impression, or consultation advice..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifying}
                className="btn btn-primary flex items-center gap-2"
              >
                {verifying ? 'Verifying...' : 'Authorize & Verify Result'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Controlled Amendment Modal */}
      <Modal
        isOpen={showAmendModal}
        onClose={() => setShowAmendModal(false)}
        title="Controlled Result Amendment (Audit Logged)"
      >
        {selectedResult && (
          <form onSubmit={handleConfirmAmend} className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
              <strong>Mandatory Compliance Rule:</strong> Modifying verified laboratory records creates an immutable versioned audit history. A formal clinical justification is legally required.
            </div>

            <div>
              <label className="label">Reason for Amendment *</label>
              <textarea
                required
                rows="2"
                placeholder="e.g. Dilution factor correction, technical calibration adjustment, re-run verification..."
                value={amendData.amendmentReason}
                onChange={(e) => setAmendData({ ...amendData, amendmentReason: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label font-bold">Updated Parameter Values</label>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {amendData.parameters.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-1/3 truncate">{p.name}</span>
                    <input
                      type="text"
                      value={p.value}
                      onChange={(e) => {
                        const updated = [...amendData.parameters];
                        updated[idx].value = e.target.value;
                        setAmendData({ ...amendData, parameters: updated });
                      }}
                      className="input input-sm w-1/3 font-semibold"
                    />
                    <select
                      value={p.flag}
                      onChange={(e) => {
                        const updated = [...amendData.parameters];
                        updated[idx].flag = e.target.value;
                        setAmendData({ ...amendData, parameters: updated });
                      }}
                      className="input input-sm w-1/3 text-xs"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="LOW">LOW</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowAmendModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={amending || !amendData.amendmentReason.trim()}
                className="btn btn-primary flex items-center gap-2"
              >
                {amending ? 'Saving Amendment...' : 'Submit Versioned Amendment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default VerificationQueue;
