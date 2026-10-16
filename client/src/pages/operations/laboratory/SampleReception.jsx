import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Search, 
  Barcode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Thermometer, 
  Building2, 
  ArrowRight,
  ShieldAlert,
  Archive
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import laboratoryService from '../../../services/laboratoryService';

export const SampleReception = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanInput, setScanInput] = useState('');
  const [activeTab, setActiveTab] = useState('COLLECTED'); // 'COLLECTED', 'RECEIVED'
  
  // Quick Receive Modal
  const [selectedSample, setSelectedSample] = useState(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [receiveData, setReceiveData] = useState({
    receivedBy: 'Tech Michael Chen',
    receiverId: 'STF-TECH-01',
    storageLocation: 'RACK-B-04',
    temperatureCondition: 'REFRIGERATED_4C'
  });

  // Rejection Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectData, setRejectData] = useState({
    rejectedBy: 'Tech Michael Chen',
    rejectionReason: 'HEMOLYZED',
    rejectionComments: '',
    actionRequired: 'RECOLLECT_IMMEDIATELY'
  });

  useEffect(() => {
    fetchSamples();
  }, [activeTab]);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.listSamples({
        status: activeTab,
        limit: 100
      });
      if (res.success) {
        setSamples(res.data);
      }
    } catch (err) {
      console.error('Failed to load reception samples:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    try {
      setLoading(true);
      // Search by accession or barcode
      const res = await laboratoryService.listSamples({
        search: scanInput.trim()
      });
      if (res.success && res.data.length > 0) {
        setSamples(res.data);
      } else {
        alert(`No sample found with barcode/accession "${scanInput}"`);
      }
    } catch (err) {
      alert('Error searching for scanned barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceive = (sample) => {
    setSelectedSample(sample);
    setShowReceiveModal(true);
  };

  const handleConfirmReceive = async (e) => {
    e.preventDefault();
    if (!selectedSample) return;

    try {
      setReceiving(true);
      const res = await laboratoryService.receiveSample(selectedSample.sampleId, receiveData);
      if (res.success) {
        setShowReceiveModal(false);
        setSelectedSample(null);
        fetchSamples();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to receive sample.');
    } finally {
      setReceiving(false);
    }
  };

  const handleAcceptDirectly = async (sample) => {
    try {
      const res = await laboratoryService.acceptSample(sample.sampleId);
      if (res.success) {
        fetchSamples();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept sample.');
    }
  };

  const handleOpenReject = (sample) => {
    setSelectedSample(sample);
    setRejectData({
      rejectedBy: 'Tech Michael Chen',
      rejectionReason: 'HEMOLYZED',
      rejectionComments: '',
      actionRequired: 'RECOLLECT_IMMEDIATELY'
    });
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedSample) return;

    try {
      setRejecting(true);
      const res = await laboratoryService.rejectSample(selectedSample.sampleId, rejectData);
      if (res.success) {
        setShowRejectModal(false);
        setSelectedSample(null);
        fetchSamples();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject sample.');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Inbox className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            Laboratory Bench Receiving & Accessioning
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Intake incoming specimens, verify tube integrity, log storage conditions, or initiate rejection exceptions.
          </p>
        </div>

        <button 
          onClick={fetchSamples}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Bench
        </button>
      </div>

      {/* Barcode Fast Scan Input */}
      <div className="card p-4 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-950/20 dark:to-indigo-950/20 border-primary-200 dark:border-primary-800">
        <form onSubmit={handleScanSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Barcode className="absolute left-3.5 top-3 h-5 w-5 text-primary-600 dark:text-primary-400" />
            <input
              type="text"
              placeholder="Scan Barcode or Type Accession Number (e.g. ACC-20261016-0001)..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="input pl-11 w-full font-mono text-base bg-white dark:bg-gray-800"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full md:w-auto flex items-center justify-center gap-2">
            <Search className="h-4 w-4" />
            Lookup Specimen
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-4">
        <button
          onClick={() => setActiveTab('COLLECTED')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'COLLECTED'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Incoming Collected Specimens</span>
        </button>
        <button
          onClick={() => setActiveTab('RECEIVED')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'RECEIVED'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Received (Awaiting Acceptance / Check-in)</span>
        </button>
      </div>

      {/* Samples Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Accession #</th>
                <th>Barcode</th>
                <th>Patient</th>
                <th>Specimen</th>
                <th>Container</th>
                <th>Collected At</th>
                <th>Status</th>
                <th className="text-right">Bench Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-500" />
                    Loading specimens...
                  </td>
                </tr>
              ) : samples.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No specimens in this queue state.
                  </td>
                </tr>
              ) : (
                samples.map((sample) => (
                  <tr key={sample.sampleId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="font-mono font-bold text-primary-600 dark:text-primary-400">
                      {sample.accessionNumber}
                    </td>
                    <td className="font-mono text-xs">{sample.barcode}</td>
                    <td>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {sample.patientName || sample.labOrderId?.patientName || 'Unknown Patient'}
                      </div>
                      <div className="text-xs text-gray-500">ID: {sample.patientId || sample.labOrderId?.patientId}</div>
                    </td>
                    <td>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {sample.specimenType}
                      </span>
                    </td>
                    <td className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                      {sample.containerType}
                    </td>
                    <td className="text-xs text-gray-500">
                      {sample.collectedAt ? new Date(sample.collectedAt).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      <StatusBadge status={sample.status} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sample.status === 'COLLECTED' && (
                          <button
                            onClick={() => handleOpenReceive(sample)}
                            className="btn btn-primary btn-sm flex items-center gap-1"
                          >
                            <Inbox className="h-3.5 w-3.5" />
                            Receive at Bench
                          </button>
                        )}

                        {sample.status === 'RECEIVED' && (
                          <button
                            onClick={() => handleAcceptDirectly(sample)}
                            className="btn btn-primary btn-sm flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Accept Sample
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenReject(sample)}
                          className="btn btn-danger btn-sm flex items-center gap-1"
                          title="Reject Damaged / Clotted / Hemolyzed Specimen"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bench Receive Modal */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title="Check-In Sample to Laboratory Bench"
      >
        {selectedSample && (
          <form onSubmit={handleConfirmReceive} className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-1 text-sm border border-gray-200 dark:border-gray-700">
              <div className="font-bold text-gray-900 dark:text-white">
                Accession: {selectedSample.accessionNumber}
              </div>
              <div className="text-xs text-gray-500">
                Specimen: {selectedSample.specimenType} • Container: {selectedSample.containerType}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Receiving Tech Name</label>
                <input
                  type="text"
                  required
                  value={receiveData.receivedBy}
                  onChange={(e) => setReceiveData({ ...receiveData, receivedBy: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">Bench Storage Location</label>
                <input
                  type="text"
                  required
                  value={receiveData.storageLocation}
                  onChange={(e) => setReceiveData({ ...receiveData, storageLocation: e.target.value })}
                  className="input w-full"
                  placeholder="e.g. RACK-B-04, CENTRIFUGE-1"
                />
              </div>
            </div>

            <div>
              <label className="label">Preservation / Storage Temperature</label>
              <select
                value={receiveData.temperatureCondition}
                onChange={(e) => setReceiveData({ ...receiveData, temperatureCondition: e.target.value })}
                className="input w-full"
              >
                <option value="ROOM_TEMPERATURE_20_25C">Room Temperature (20°C - 25°C)</option>
                <option value="REFRIGERATED_4C">Refrigerated (2°C - 8°C)</option>
                <option value="FROZEN_MINUS_20C">Frozen (-20°C)</option>
                <option value="ULTRA_LOW_MINUS_80C">Ultra-Low Freezer (-80°C)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={receiving}
                className="btn btn-primary flex items-center gap-2"
              >
                {receiving ? 'Logging Check-in...' : 'Confirm Bench Reception'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reject Sample Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Specimen (Quality Non-Conformance)"
      >
        {selectedSample && (
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200">
              <AlertTriangle className="h-5 w-5 inline mr-1 text-red-600" />
              <strong>Warning:</strong> Rejecting this sample will log an official Laboratory Exception and notify clinical nursing staff for recollection.
            </div>

            <div>
              <label className="label">Rejection Reason *</label>
              <select
                value={rejectData.rejectionReason}
                onChange={(e) => setRejectData({ ...rejectData, rejectionReason: e.target.value })}
                className="input w-full font-semibold"
              >
                <option value="HEMOLYZED">HEMOLYZED (Ruptured red blood cells)</option>
                <option value="CLOTTED">CLOTTED (Clots in anticoagulated tube)</option>
                <option value="LIPEMIC">LIPEMIC (Excess blood fats)</option>
                <option value="ICTERIC">ICTERIC (Extreme bilirubin elevation)</option>
                <option value="INSUFFICIENT_VOLUME">INSUFFICIENT_VOLUME (QNS - Quantity Not Sufficient)</option>
                <option value="LEAKING_CONTAINER">LEAKING_CONTAINER (Broken or unsealed tube)</option>
                <option value="WRONG_CONTAINER">WRONG_CONTAINER (Incorrect tube color/additive)</option>
                <option value="UNLABELED_SPECIMEN">UNLABELED_SPECIMEN (Missing accession label)</option>
                <option value="LABEL_MISMATCH">LABEL_MISMATCH (Patient ID does not match requisition)</option>
                <option value="TEMPERATURE_EXCURSION">TEMPERATURE_EXCURSION (Exceeded cold chain limit)</option>
                <option value="TRANSIT_DELAY">TRANSIT_DELAY (Specimen stability expired)</option>
                <option value="CONTAMINATED">CONTAMINATED (Foreign matter or IV fluid dilution)</option>
                <option value="OTHER">OTHER (Clinical / Technical non-conformance)</option>
              </select>
            </div>

            <div>
              <label className="label">Immediate Corrective Action</label>
              <select
                value={rejectData.actionRequired}
                onChange={(e) => setRejectData({ ...rejectData, actionRequired: e.target.value })}
                className="input w-full"
              >
                <option value="RECOLLECT_IMMEDIATELY">Recollect Specimen Immediately</option>
                <option value="NOTIFY_ORDERING_PHYSICIAN">Notify Ordering Physician</option>
                <option value="CANCEL_TEST">Cancel Test Requisition</option>
              </select>
            </div>

            <div>
              <label className="label">Observations / Rejection Comments *</label>
              <textarea
                required
                rows="3"
                placeholder="Describe why sample cannot be run (e.g. gross 3+ hemolysis observed post centrifugation)..."
                value={rejectData.rejectionComments}
                onChange={(e) => setRejectData({ ...rejectData, rejectionComments: e.target.value })}
                className="input w-full"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rejecting || !rejectData.rejectionComments.trim()}
                className="btn btn-danger flex items-center gap-2"
              >
                {rejecting ? 'Recording Rejection...' : 'Confirm Rejection & Raise Exception'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default SampleReception;
