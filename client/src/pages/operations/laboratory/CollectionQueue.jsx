import React, { useState, useEffect } from 'react';
import { 
  Syringe, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Barcode, 
  User, 
  FlaskConical,
  ChevronRight
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import laboratoryService from '../../../services/laboratoryService';

export const CollectionQueue = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [selectedSample, setSelectedSample] = useState(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const [collectData, setCollectData] = useState({
    collectorName: 'Nurse Clara Vance',
    collectorId: 'STF-NURSE-04',
    collectionSite: 'Left Antecubital Fossa',
    fastingStatus: 'CONFIRMED',
    notes: ''
  });

  useEffect(() => {
    fetchQueue();
  }, [priority]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.getCollectionQueue({
        priority,
        search
      });
      if (res.success) {
        setSamples(res.data);
      }
    } catch (err) {
      console.error('Failed to load collection queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCollect = (sample) => {
    setSelectedSample(sample);
    setCollectData({
      collectorName: 'Nurse Clara Vance',
      collectorId: 'STF-NURSE-04',
      collectionSite: 'Left Antecubital Fossa',
      fastingStatus: 'CONFIRMED',
      notes: ''
    });
    setShowCollectModal(true);
  };

  const handleConfirmCollection = async (e) => {
    e.preventDefault();
    if (!selectedSample) return;

    try {
      setCollecting(true);
      const res = await laboratoryService.collectSample(selectedSample.sampleId, {
        collectedBy: collectData.collectorName,
        collectorId: collectData.collectorId,
        collectionSite: collectData.collectionSite,
        fastingStatus: collectData.fastingStatus,
        notes: collectData.notes
      });

      if (res.success) {
        setShowCollectModal(false);
        setSelectedSample(null);
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record sample collection');
    } finally {
      setCollecting(false);
    }
  };

  const getPriorityStyle = (prio) => {
    switch (prio) {
      case 'STAT':
        return 'border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/20';
      case 'URGENT':
        return 'border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10';
      default:
        return 'border-l-4 border-l-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Syringe className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            Phlebotomy & Sample Collection Queue
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Worklist of accessioned specimens awaiting phlebotomy, specimen labeling, and verification.
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

      {/* Filter and Search Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Accession #, Patient Name, or Barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchQueue()}
              className="input pl-9 w-full"
            />
          </div>

          <div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="input w-full font-medium"
            >
              <option value="">All Priorities (STAT first)</option>
              <option value="STAT">STAT Priority Only</option>
              <option value="URGENT">Urgent Priority Only</option>
              <option value="ROUTINE">Routine Priority Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-12 text-center text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-500" />
            Loading collection worklist...
          </div>
        ) : samples.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">All Caught Up!</h3>
            <p className="text-xs text-gray-400 mt-1">There are no pending specimens in the collection queue.</p>
          </div>
        ) : (
          samples.map((sample) => (
            <div 
              key={sample.sampleId} 
              className={`card p-4 transition-shadow hover:shadow-md ${getPriorityStyle(sample.labOrderId?.priority || sample.priority)}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
                    <FlaskConical className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-base text-gray-900 dark:text-white">
                        {sample.accessionNumber}
                      </span>
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Barcode className="h-3 w-3" /> {sample.barcode}
                      </span>
                      <span className={`badge font-bold text-xs ${
                        (sample.labOrderId?.priority || sample.priority) === 'STAT' ? 'badge-error animate-pulse' :
                        (sample.labOrderId?.priority || sample.priority) === 'URGENT' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {sample.labOrderId?.priority || sample.priority || 'ROUTINE'}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {sample.patientName || sample.labOrderId?.patientName || 'Unknown Patient'}
                      </span>
                      <span>Specimen: <strong className="text-gray-900 dark:text-white">{sample.specimenType}</strong></span>
                      <span>Tube: <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{sample.containerType}</span></span>
                      <span>Order: <span className="font-mono text-xs">{sample.labOrderId?.labOrderId || sample.labOrderId}</span></span>
                    </div>

                    {sample.collectionInstructions && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 italic">
                        Instructions: {sample.collectionInstructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <button
                    onClick={() => handleOpenCollect(sample)}
                    className="btn btn-primary flex items-center gap-1.5"
                  >
                    <Syringe className="h-4 w-4" />
                    Collect Specimen
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Collect Sample Modal */}
      <Modal
        isOpen={showCollectModal}
        onClose={() => setShowCollectModal(false)}
        title="Record Phlebotomy & Sample Collection"
      >
        {selectedSample && (
          <form onSubmit={handleConfirmCollection} className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-2 text-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Accession Number:</span>
                <span className="font-mono font-bold text-primary-600">{selectedSample.accessionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Barcode Identifier:</span>
                <span className="font-mono font-medium">{selectedSample.barcode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Required Specimen:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSample.specimenType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Container Tube:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedSample.containerType}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Collector Staff Name *</label>
                <input
                  type="text"
                  required
                  value={collectData.collectorName}
                  onChange={(e) => setCollectData({ ...collectData, collectorName: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">Collector Staff ID *</label>
                <input
                  type="text"
                  required
                  value={collectData.collectorId}
                  onChange={(e) => setCollectData({ ...collectData, collectorId: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Anatomical Collection Site</label>
                <input
                  type="text"
                  value={collectData.collectionSite}
                  onChange={(e) => setCollectData({ ...collectData, collectionSite: e.target.value })}
                  className="input w-full"
                  placeholder="e.g. Left Antecubital, Right Arm, Midstream"
                />
              </div>

              <div>
                <label className="label">Fasting Status</label>
                <select
                  value={collectData.fastingStatus}
                  onChange={(e) => setCollectData({ ...collectData, fastingStatus: e.target.value })}
                  className="input w-full"
                >
                  <option value="CONFIRMED">Fasting Confirmed</option>
                  <option value="NOT_FASTING">Not Fasting</option>
                  <option value="UNKNOWN">Not Known</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Collection Notes (Optional)</label>
              <textarea
                rows="2"
                placeholder="Any difficulties, patient comfort, or specimen notes..."
                value={collectData.notes}
                onChange={(e) => setCollectData({ ...collectData, notes: e.target.value })}
                className="input w-full"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowCollectModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={collecting}
                className="btn btn-primary flex items-center gap-2"
              >
                {collecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Confirm Collection & Mark Ready for Bench'
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default CollectionQueue;
