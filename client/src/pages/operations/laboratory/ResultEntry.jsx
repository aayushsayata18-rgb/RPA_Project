import React, { useState, useEffect } from 'react';
import { 
  useSearchParams, 
  useNavigate 
} from 'react-router-dom';
import { 
  FileEdit, 
  ArrowLeft, 
  Save, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Info,
  ShieldAlert,
  FlaskConical
} from 'lucide-react';
import laboratoryService from '../../../services/laboratoryService';

export const ResultEntry = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const querySampleId = searchParams.get('sampleId') || '';
  const queryAccession = searchParams.get('accessionNumber') || '';
  const queryOrderId = searchParams.get('labOrderId') || '';

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Tests Catalog for selection
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedTestObj, setSelectedTestObj] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    labOrderId: queryOrderId,
    sampleId: querySampleId,
    labTestId: '',
    enteredBy: 'Tech Michael Chen',
    technicianId: 'STF-TECH-01',
    methodology: 'Automated Photometric Analysis',
    technicianNotes: '',
    parameters: []
  });

  useEffect(() => {
    loadTestCatalog();
  }, []);

  useEffect(() => {
    if (selectedTestId) {
      const found = availableTests.find(t => t.labTestId === selectedTestId);
      setSelectedTestObj(found);
      if (found && found.parameters) {
        // Initialize parameter entry rows with reference ranges
        const initialParams = found.parameters.map(p => ({
          name: p.name,
          value: '',
          unit: p.unit || '',
          referenceRange: p.referenceRange || '',
          flag: 'NORMAL',
          isCritical: false
        }));
        setFormData(prev => ({
          ...prev,
          labTestId: found.labTestId,
          parameters: initialParams
        }));
      }
    }
  }, [selectedTestId, availableTests]);

  const loadTestCatalog = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.listTests({ status: 'ACTIVE', limit: 100 });
      if (res.success) {
        setAvailableTests(res.data);
        if (res.data.length > 0) {
          setSelectedTestId(res.data[0].labTestId);
        }
      }
    } catch (err) {
      console.error('Failed to load test catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleParamChange = (index, field, value) => {
    const updated = [...formData.parameters];
    updated[index][field] = value;

    // Check for critical flag auto-suggestion
    if (field === 'flag' && value === 'CRITICAL') {
      updated[index].isCritical = true;
    } else if (field === 'flag') {
      updated[index].isCritical = false;
    }

    setFormData(prev => ({ ...prev, parameters: updated }));
  };

  const handleSubmit = async (submitForVerification = true) => {
    if (!formData.labOrderId || !formData.sampleId || !formData.labTestId) {
      alert('Please fill in Order ID, Sample ID, and select a Diagnostic Test.');
      return;
    }

    // Verify all parameters have values
    const emptyParam = formData.parameters.find(p => p.value === '');
    if (emptyParam) {
      if (!window.confirm(`Parameter "${emptyParam.name}" has no value entered. Do you wish to continue?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        labOrderId: formData.labOrderId,
        sampleId: formData.sampleId,
        labTestId: formData.labTestId,
        enteredBy: formData.enteredBy,
        technicianId: formData.technicianId,
        methodology: formData.methodology,
        technicianNotes: formData.technicianNotes,
        parameters: formData.parameters,
        status: submitForVerification ? 'ENTERED' : 'DRAFT'
      };

      const res = await laboratoryService.enterResult(payload);
      if (res.success) {
        alert(submitForVerification 
          ? 'Results recorded and submitted to Pathologist Verification Queue!' 
          : 'Draft results saved successfully.');
        navigate('/operations/laboratory/processing');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit test results.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/operations/laboratory/processing')}
            className="btn btn-secondary btn-sm p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileEdit className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              Laboratory Result Entry
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Record quantitative and qualitative analytical values with automated reference snapshotting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="btn btn-secondary flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </div>
      </div>

      {/* Clinical Safety & Regulatory Banner */}
      <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Segregation of Duties Enforcement:</strong> Under Clinical Laboratory Standards, the entering technician cannot independently verify or release these results. Once submitted, a qualified Pathologist or Senior Medical Technologist must review and verify.
        </div>
      </div>

      {/* Context Form: Order & Sample Identification */}
      <div className="card p-5 space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-base border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary-600" />
          Requisition & Specimen Identification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Lab Order ID *</label>
            <input
              type="text"
              required
              placeholder="e.g. ORD-LAB-20261016-0001"
              value={formData.labOrderId}
              onChange={(e) => setFormData({ ...formData, labOrderId: e.target.value })}
              className="input w-full font-mono font-semibold"
            />
          </div>

          <div>
            <label className="label">Sample Accession / ID *</label>
            <input
              type="text"
              required
              placeholder="e.g. ACC-20261016-0001 or ID"
              value={formData.sampleId}
              onChange={(e) => setFormData({ ...formData, sampleId: e.target.value })}
              className="input w-full font-mono font-semibold"
            />
          </div>

          <div>
            <label className="label">Diagnostic Test *</label>
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="input w-full font-medium"
            >
              {availableTests.map(t => (
                <option key={t.labTestId} value={t.labTestId}>
                  [{t.code}] {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="label">Technician Name *</label>
            <input
              type="text"
              required
              value={formData.enteredBy}
              onChange={(e) => setFormData({ ...formData, enteredBy: e.target.value })}
              className="input w-full"
            />
          </div>

          <div>
            <label className="label">Technician Staff ID</label>
            <input
              type="text"
              value={formData.technicianId}
              onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
              className="input w-full font-mono text-xs"
            />
          </div>

          <div>
            <label className="label">Methodology / Analyzer</label>
            <input
              type="text"
              value={formData.methodology}
              onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
              className="input w-full"
              placeholder="e.g. Automated Photometric, Sysmex XN, Cobas c501"
            />
          </div>
        </div>
      </div>

      {/* Parameter Entry Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Analytical Test Parameters ({formData.parameters.length})
          </h3>
          <span className="text-xs text-gray-500">
            Reference intervals captured as verified snapshot upon entry
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Parameter</th>
                <th style={{ width: '25%' }}>Result Value</th>
                <th style={{ width: '15%' }}>Unit</th>
                <th style={{ width: '20%' }}>Reference Interval</th>
                <th style={{ width: '15%' }}>Abnormal Flag</th>
              </tr>
            </thead>
            <tbody>
              {formData.parameters.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-400">
                    No parameters found for selected test catalog item.
                  </td>
                </tr>
              ) : (
                formData.parameters.map((param, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="font-medium text-gray-900 dark:text-white">
                      {param.name}
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Enter value..."
                        value={param.value}
                        onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                        className={`input w-full font-semibold ${
                          param.flag === 'CRITICAL' ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/20' :
                          param.flag === 'HIGH' || param.flag === 'LOW' ? 'border-amber-500 text-amber-700' : ''
                        }`}
                      />
                    </td>
                    <td>
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {param.unit || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {param.referenceRange || 'Reference not configured'}
                      </span>
                    </td>
                    <td>
                      <select
                        value={param.flag}
                        onChange={(e) => handleParamChange(index, 'flag', e.target.value)}
                        className={`input text-xs font-bold w-full ${
                          param.flag === 'CRITICAL' ? 'text-red-600 bg-red-50 border-red-500' :
                          param.flag === 'HIGH' ? 'text-amber-600' :
                          param.flag === 'LOW' ? 'text-blue-600' : 'text-green-600'
                        }`}
                      >
                        <option value="NORMAL">NORMAL</option>
                        <option value="HIGH">HIGH (Elevated)</option>
                        <option value="LOW">LOW (Decreased)</option>
                        <option value="CRITICAL">CRITICAL (Panic)</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technician Notes */}
      <div className="card p-5">
        <label className="label font-bold text-gray-900 dark:text-white">
          Technician Bench Notes / Technical Observations
        </label>
        <textarea
          rows="3"
          placeholder="e.g. Sample was clear and non-hemolyzed. Calibration curve within acceptable 2-SD limits..."
          value={formData.technicianNotes}
          onChange={(e) => setFormData({ ...formData, technicianNotes: e.target.value })}
          className="input w-full"
        />
      </div>
    </div>
  );
};

export default ResultEntry;
