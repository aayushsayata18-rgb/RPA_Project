import React, { useState, useEffect } from 'react';
import { 
  XCircle, 
  Search, 
  AlertTriangle, 
  RefreshCw, 
  User, 
  FlaskConical, 
  Calendar, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../components/common/StatusBadge';
import laboratoryService from '../../../services/laboratoryService';

export const RejectedSamples = () => {
  const navigate = useNavigate();
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');

  useEffect(() => {
    fetchRejectedSamples();
  }, [reasonFilter]);

  const fetchRejectedSamples = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.listSamples({
        status: 'REJECTED',
        limit: 100
      });
      if (res.success) {
        setSamples(res.data);
      }
    } catch (err) {
      console.error('Failed to load rejected samples:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSamples = samples.filter(s => {
    if (reasonFilter && s.rejectionReason !== reasonFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.accessionNumber?.toLowerCase().includes(q) ||
      s.barcode?.toLowerCase().includes(q) ||
      (s.patientName || s.labOrderId?.patientName || '').toLowerCase().includes(q) ||
      s.rejectionReason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <XCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
            Rejected Specimens & Quality Log
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Audit history of non-conforming specimens (hemolyzed, clotted, QNS) with recollection tracking.
          </p>
        </div>

        <button 
          onClick={fetchRejectedSamples}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Log
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Accession #, Barcode, Patient, or Reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-full"
            />
          </div>

          <div>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="input w-full font-medium"
            >
              <option value="">All Rejection Reasons</option>
              <option value="HEMOLYZED">HEMOLYZED</option>
              <option value="CLOTTED">CLOTTED</option>
              <option value="LIPEMIC">LIPEMIC</option>
              <option value="INSUFFICIENT_VOLUME">INSUFFICIENT_VOLUME (QNS)</option>
              <option value="LEAKING_CONTAINER">LEAKING_CONTAINER</option>
              <option value="WRONG_CONTAINER">WRONG_CONTAINER</option>
              <option value="UNLABELED_SPECIMEN">UNLABELED_SPECIMEN</option>
              <option value="LABEL_MISMATCH">LABEL_MISMATCH</option>
              <option value="TEMPERATURE_EXCURSION">TEMPERATURE_EXCURSION</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rejections Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Accession #</th>
                <th>Patient</th>
                <th>Specimen / Container</th>
                <th>Rejection Reason</th>
                <th>Rejected By</th>
                <th>Rejected At</th>
                <th>Corrective Action</th>
                <th className="text-right">Exception</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-500" />
                    Loading rejected specimens...
                  </td>
                </tr>
              ) : filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No rejected specimens found.
                  </td>
                </tr>
              ) : (
                filteredSamples.map((sample) => (
                  <tr key={sample.sampleId} className="hover:bg-red-50/20">
                    <td className="font-mono font-bold text-red-600 dark:text-red-400">
                      {sample.accessionNumber}
                    </td>
                    <td>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {sample.patientName || sample.labOrderId?.patientName || 'Unknown Patient'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {sample.patientId || sample.labOrderId?.patientId}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">
                        {sample.specimenType}
                      </div>
                      <div className="text-xs font-mono text-gray-500">
                        {sample.containerType}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-error font-bold">
                        {sample.rejectionReason}
                      </span>
                      {sample.rejectionComments && (
                        <p className="text-xs text-gray-500 truncate max-w-xs mt-1">
                          {sample.rejectionComments}
                        </p>
                      )}
                    </td>
                    <td className="text-xs text-gray-700 dark:text-gray-300">
                      {sample.rejectedBy || 'Lab Tech'}
                    </td>
                    <td className="text-xs text-gray-500">
                      {sample.rejectedAt ? new Date(sample.rejectedAt).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        {sample.actionRequired || 'RECOLLECT_IMMEDIATELY'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => navigate('/operations/laboratory/exceptions')}
                        className="btn btn-secondary btn-sm flex items-center gap-1 ml-auto"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                        View
                      </button>
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

export default RejectedSamples;
