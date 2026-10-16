import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  FlaskConical, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  FileEdit,
  Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../components/common/StatusBadge';
import laboratoryService from '../../../services/laboratoryService';

export const ProcessingQueue = () => {
  const navigate = useNavigate();
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProcessingQueue();
  }, []);

  const fetchProcessingQueue = async () => {
    try {
      setLoading(true);
      // Fetch samples in ACCEPTED or IN_PROCESS
      const res = await laboratoryService.listSamples({
        limit: 100
      });
      if (res.success) {
        // Filter to in bench analytical process
        const filtered = (res.data || []).filter(s => 
          ['ACCEPTED', 'IN_PROCESS', 'RECEIVED'].includes(s.status)
        );
        setSamples(filtered);
      }
    } catch (err) {
      console.error('Failed to load processing queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSamples = samples.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.accessionNumber?.toLowerCase().includes(q) ||
      s.barcode?.toLowerCase().includes(q) ||
      (s.patientName || s.labOrderId?.patientName || '').toLowerCase().includes(q) ||
      s.specimenType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            Analytical Processing Bench Workstation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Active specimens undergoing biochemical, hematological, or microbiological testing.
          </p>
        </div>

        <button 
          onClick={fetchProcessingQueue}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Workstation
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Accession #, Barcode, Specimen, or Patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
      </div>

      {/* Bench Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full card p-12 text-center text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-500" />
            Loading bench analytical queue...
          </div>
        ) : filteredSamples.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-gray-500">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Bench is Clear</h3>
            <p className="text-xs text-gray-400 mt-1">No specimens are currently in active bench processing.</p>
          </div>
        ) : (
          filteredSamples.map((sample) => (
            <div key={sample.sampleId} className="card p-5 hover:border-primary-500 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-lg text-primary-600 dark:text-primary-400">
                      {sample.accessionNumber}
                    </span>
                    <div className="text-xs font-mono text-gray-500">
                      Barcode: {sample.barcode}
                    </div>
                  </div>
                  <StatusBadge status={sample.status} />
                </div>

                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 text-xs space-y-1.5 border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Patient:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {sample.patientName || sample.labOrderId?.patientName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Specimen:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{sample.specimenType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Container:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{sample.containerType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Storage / Bench:</span>
                    <span className="font-mono">{sample.storageLocation || 'Bench 1'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5 text-gray-400" />
                  Ready for Entry
                </span>

                <button
                  onClick={() => navigate(`/operations/laboratory/results/entry?sampleId=${sample.sampleId}&accessionNumber=${sample.accessionNumber}&labOrderId=${sample.labOrderId?.labOrderId || sample.labOrderId}`)}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  <FileEdit className="h-3.5 w-3.5" />
                  Enter Results
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProcessingQueue;
