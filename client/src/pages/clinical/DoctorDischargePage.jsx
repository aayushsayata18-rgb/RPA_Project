import React, { useState, useEffect } from 'react';
import { CheckCircle, FileText, User, Activity, Clock, Plus, AlertTriangle, RefreshCw, Search } from 'lucide-react';
import dischargeService from '../../services/dischargeService';
import admissionService from '../../services/admissionService';

export const DoctorDischargePage = () => {
  const [requests, setRequests] = useState([]);
  const [activeAdmissions, setActiveAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clinicalDecisionReference: '',
    clinicalSummaryNotes: '',
    requestType: 'PLANNED',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [reqRes, admRes] = await Promise.all([
        dischargeService.getDischargeRequests(),
        admissionService.getAdmissions({ status: 'ADMITTED' })
      ]);
      setRequests(reqRes.data || []);
      setActiveAdmissions(admRes.data?.admissions || admRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch clinical discharge data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDischargeModal = (adm) => {
    setSelectedAdmission(adm);
    setFormData({
      clinicalDecisionReference: `Authorized clinical discharge approved for ${adm.patientName}. Hemodynamically stable, treatment completed.`,
      clinicalSummaryNotes: 'Patient vitals stable. Wound dressing clear. Prescribed follow-up in 1 week.',
      requestType: 'PLANNED',
      notes: 'Authorized medical clearance recorded.'
    });
    setIsModalOpen(true);
  };

  const handleSubmitDischargeOrder = async (e) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    setSubmitting(true);
    setErrorMsg('');
    setMessage('');
    try {
      await dischargeService.createDischargeRequest({
        admissionId: selectedAdmission.admissionId,
        patientId: selectedAdmission.patientId,
        doctorName: selectedAdmission.admittingDoctorName || 'Dr. Attending Doctor',
        requestType: formData.requestType,
        clinicalDecisionReference: formData.clinicalDecisionReference,
        clinicalSummaryNotes: formData.clinicalSummaryNotes,
        notes: formData.notes
      });
      setMessage(`Clinical discharge order successfully submitted for ${selectedAdmission.patientName} (${selectedAdmission.admissionId}).`);
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit clinical discharge order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Clinical Discharge Orders</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Authorize medical discharge for admitted inpatients. The administrative workflow handles billing, payments and bed release.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Active Admitted Patients vs Recent Clinical Discharge Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Active Inpatients */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <User className="text-indigo-600 w-5 h-5" /> Active Admitted Inpatients ({activeAdmissions.length})
            </h2>
            <p className="text-xs text-slate-500 mb-4">Select an admitted patient to issue medical discharge clearance.</p>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {activeAdmissions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No active inpatients in ward.</div>
              ) : (
                activeAdmissions.map((adm) => (
                  <div key={adm._id || adm.admissionId} className="p-4 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 rounded-xl transition flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{adm.patientName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Adm: <span className="font-semibold text-slate-700">{adm.admissionId}</span> • Ward: {adm.assignedWardName || 'Ward'} (Bed: {adm.assignedBedNumber || 'N/A'})
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Doctor: {adm.admittingDoctorName || 'Dr. Verma'}</div>
                    </div>
                    <button
                      onClick={() => handleOpenDischargeModal(adm)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Order Discharge
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Submitted Clinical Discharge Orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FileText className="text-emerald-600 w-5 h-5" /> Submitted Clinical Orders ({requests.length})
            </h2>
            <p className="text-xs text-slate-500 mb-4">Track progress of doctor discharge orders through administrative pipeline.</p>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {requests.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No clinical discharge requests submitted today.</div>
              ) : (
                requests.map((req) => (
                  <div key={req._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{req.patientName}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Order ID: {req.requestId} • Admission: {req.admissionId}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 bg-white p-2 rounded border border-slate-200/60 max-w-sm">
                        {req.clinicalDecisionReference}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Submit Doctor Discharge Order */}
      {isModalOpen && selectedAdmission && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="text-indigo-600 w-5 h-5" /> Authorize Clinical Discharge
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Patient: <strong className="text-slate-800">{selectedAdmission.patientName}</strong> ({selectedAdmission.admissionId})
            </p>

            <form onSubmit={handleSubmitDischargeOrder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Discharge Type
                </label>
                <select
                  value={formData.requestType}
                  onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="PLANNED">Planned Discharge (Treatment Finished)</option>
                  <option value="EMERGENCY">Emergency Discharge</option>
                  <option value="TRANSFER_OUT">Transfer-Out Discharge</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Clinical Clearance Decision Reference *
                </label>
                <textarea
                  rows="3"
                  value={formData.clinicalDecisionReference}
                  onChange={(e) => setFormData({ ...formData, clinicalDecisionReference: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Clinical Summary & Follow-up Advice
                </label>
                <textarea
                  rows="2"
                  value={formData.clinicalSummaryNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalSummaryNotes: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="animate-spin w-4 h-4" />}
                  Submit Clinical Discharge Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDischargePage;
