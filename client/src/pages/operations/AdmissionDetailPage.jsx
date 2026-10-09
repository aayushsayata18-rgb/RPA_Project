import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import admissionService from '../../services/admissionService';
import {
  Bed,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Building,
  User,
  Activity,
  Printer,
  Zap,
  AlertCircle,
  Sliders,
  Check,
  Lock
} from 'lucide-react';

export const AdmissionDetailPage = () => {
  const { id, admissionId, requestId } = useParams();
  const targetId = id || admissionId || requestId;
  const navigate = useNavigate();

  const [admissionData, setAdmissionData] = useState(null);
  const [requestData, setRequestData] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [history, setHistory] = useState([]);
  const [bed, setBed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Override modal
  const [overrideItemCode, setOverrideItemCode] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if ID is an Admission ID (ADM...) or Request ID (ADMREQ...)
      if (targetId.startsWith('ADMREQ')) {
        const res = await admissionService.getAdmissionRequestById(targetId);
        setRequestData(res.data);
        setChecklist(res.checklist);
        setHistory(res.history || []);
        setBed(res.bed);
        if (res.data?.admissionId) {
          const admRes = await admissionService.getAdmissionById(res.data.admissionId);
          setAdmissionData(admRes.data);
        }
      } else {
        const res = await admissionService.getAdmissionById(targetId);
        setAdmissionData(res.data);
        setRequestData(res.request);
        setChecklist(res.checklist);
        setHistory(res.history || []);
        setBed(res.bed);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch admission details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      fetchDetails();
    }
  }, [targetId]);

  const handleUpdateChecklistItem = async (code, newStatus) => {
    if (!checklist) return;
    try {
      setError(null);
      await admissionService.updateChecklistItem(checklist.checklistId, code, newStatus);
      setSuccess(`Checklist item ${code} updated.`);
      fetchDetails();
    } catch (err) {
      setError(err.message || 'Failed to update checklist item');
    }
  };

  const handleConfirmOverride = async () => {
    if (!checklist || !overrideItemCode || !overrideReason.trim()) return;
    try {
      setError(null);
      await admissionService.overrideChecklistItem(checklist.checklistId, overrideItemCode, overrideReason);
      setSuccess(`Item ${overrideItemCode} overridden with administrative justification.`);
      setOverrideItemCode(null);
      setOverrideReason('');
      fetchDetails();
    } catch (err) {
      setError(err.message || 'Checklist override failed');
    }
  };

  const handleTriggerSync = async () => {
    const admId = admissionData?.admissionId || requestData?.admissionId;
    if (!admId) return;
    try {
      setError(null);
      const res = await admissionService.syncExternalSystem(admId);
      if (res.success) {
        setSuccess(`RPA Synchronization completed! External ID: ${res.data.externalAdmissionId}`);
      } else {
        setError(`RPA Sync failed: ${res.error}`);
      }
      fetchDetails();
    } catch (err) {
      setError(err.message || 'RPA sync error');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading admission record details...</div>;
  }

  if (error && !requestData && !admissionData) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <div>{error}</div>
        </div>
        <button
          onClick={() => navigate('/operations/admissions')}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admissions Desk
        </button>
      </div>
    );
  }

  const activeRecord = admissionData || requestData || {};
  const isAdmitted = !!admissionData || activeRecord.status === 'ADMITTED';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          {isAdmitted && (
            <button
              onClick={handleTriggerSync}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5" /> Trigger RPA Sync
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print Admission Slip
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <div className="text-xs font-medium">{error}</div>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <div className="text-xs font-medium">{success}</div>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg ${
                isAdmitted ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
              }`}
            >
              <Bed className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {admissionData?.admissionId || requestData?.admissionRequestId}
                </h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isAdmitted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {activeRecord.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  Source: {activeRecord.source}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Correlation ID: <span className="font-mono text-slate-600">{activeRecord.correlationId}</span>
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="text-slate-400">Created Timestamp</div>
            <div className="font-semibold text-slate-800 text-sm mt-0.5">
              {new Date(activeRecord.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Core Metadata 4-Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-slate-400 font-medium">Patient Name & ID</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {activeRecord.patientName || activeRecord.patientId}
            </div>
            <div className="font-mono text-teal-800 font-semibold">{activeRecord.patientId}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-slate-400 font-medium">Allocated Ward & Bed</div>
            <div className="font-bold text-emerald-700 text-sm mt-0.5">
              Bed: {activeRecord.assignedBedNumber || 'Pending Allocation'}
            </div>
            <div className="text-slate-500">{activeRecord.assignedWardName || activeRecord.assignedWardId || 'N/A'}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-slate-400 font-medium">Admitting Doctor</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {activeRecord.admittingDoctorName || activeRecord.requestingDoctorName || 'Authorized Doctor'}
            </div>
            <div className="text-slate-500">{activeRecord.admittingDepartmentName || 'General Medicine'}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-slate-400 font-medium">External Sync / HIS</div>
            <div className="font-bold text-indigo-700 text-sm mt-0.5">
              {admissionData?.externalSyncStatus || 'NOT_REQUIRED'}
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              {admissionData?.externalAdmissionId || 'Internal Record'}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Checklist & Bed Detail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Checklist */}
          {checklist && (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    Admission Administrative Checklist
                  </h2>
                  <p className="text-xs text-slate-500">
                    Checklist ID: <span className="font-mono text-teal-800">{checklist.checklistId}</span>
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    checklist.allRequiredCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {checklist.overallStatus}
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                {checklist.items?.map((item) => (
                  <div key={item.code} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {item.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        {item.title}
                        {item.type === 'REQUIRED' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                            REQUIRED
                          </span>
                        )}
                        {item.isOverridden && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            OVERRIDDEN
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[11px] pl-6">
                        {item.notes} {item.completedBy ? `• By: ${item.completedBy}` : ''}
                        {item.overrideReason ? ` • Override: "${item.overrideReason}"` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status !== 'COMPLETED' && (
                        <>
                          <button
                            onClick={() => handleUpdateChecklistItem(item.code, 'COMPLETED')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-semibold text-[11px]"
                          >
                            Mark Done
                          </button>
                          <button
                            onClick={() => setOverrideItemCode(item.code)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-semibold text-[11px]"
                          >
                            Override
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Order Context */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              Clinical Requirement Reference
            </h3>
            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-200/70">
              <div className="font-semibold text-slate-900">
                {activeRecord.clinicalRequirementReference || 'No explicit clinical order text provided.'}
              </div>
              <div className="flex items-center gap-4 text-slate-500 pt-1 border-t border-slate-200/50">
                <span>
                  Clinical Category Required:{' '}
                  <strong className="text-slate-800">{activeRecord.clinicalRequiredCategory || 'GENERAL_WARD'}</strong>
                </span>
                <span>
                  Patient Preference:{' '}
                  <strong className="text-slate-800">{activeRecord.accommodationPreference || 'GENERAL_WARD'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Bed Details & Transition Audit History */}
        <div className="space-y-6">
          {/* Bed Detail Card */}
          {bed && (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-600" />
                Physical Bed Specification
              </h3>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bed Number:</span>
                  <span className="font-bold text-slate-900">{bed.bedNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ward:</span>
                  <span className="font-semibold text-slate-800">{bed.wardName || bed.wardId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Daily Room Rate:</span>
                  <span className="font-mono text-teal-700 font-bold">₹{bed.dailyRate} / day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Isolation Capable:</span>
                  <span className="font-semibold text-slate-800">{bed.isIsolationCapable ? 'Yes' : 'Standard'}</span>
                </div>
                {bed.equipment?.length > 0 && (
                  <div className="pt-2 border-t border-emerald-200/50">
                    <span className="text-slate-500 font-medium">Equipment Installed:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {bed.equipment.map((eq, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-[10px] text-emerald-900 font-medium">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit History Timeline */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              State Transition Audit Trail
            </h3>
            <div className="space-y-3 text-xs">
              {history.map((h, index) => (
                <div key={index} className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 flex-shrink-0"></div>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900">{h.action?.replace(/_/g, ' ')}</div>
                    <div className="text-[11px] text-slate-500">
                      Actor: <span className="font-medium text-slate-700">{h.actorName || h.actorRole}</span> •{' '}
                      {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {h.reason && <div className="text-[11px] text-slate-600 italic">"{h.reason}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {overrideItemCode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-purple-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              Administrative Checklist Override
            </h3>
            <p className="text-xs text-slate-500">
              Provide mandatory administrative justification to override item{' '}
              <span className="font-mono font-bold text-slate-900">{overrideItemCode}</span>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Override Reason / Policy Clause *</label>
              <textarea
                rows={3}
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Emergency care exception authorized by Administrative Director..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setOverrideItemCode(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOverride}
                disabled={!overrideReason.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionDetailPage;
