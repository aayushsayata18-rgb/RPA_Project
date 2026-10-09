import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import admissionService from '../../services/admissionService';
import patientService from '../../services/patientService';
import doctorService from '../../services/doctorService';
import {
  Bed,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Search,
  PlusCircle,
  FileText,
  Building,
  Activity,
  Send,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

export const DoctorAdmissionRequestPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedPatients, setSearchedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVisits, setPatientVisits] = useState([]);
  const [selectedVisitId, setSelectedVisitId] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    clinicalRequirementReference: 'CLINREQ-CARD-001',
    clinicalRequiredCategory: 'GENERAL_WARD',
    accommodationPreference: 'GENERAL_WARD',
    priority: 'NORMAL',
    source: 'OPD',
    notes: ''
  });

  const [activeTab, setActiveTab] = useState('new_request'); // 'new_request' | 'my_requests'

  const fetchDoctorRequests = async () => {
    try {
      setLoading(true);
      const res = await admissionService.getAdmissionRequests({
        doctorId: user?.doctorId || user?.id
      });
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load admission orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorRequests();
  }, []);

  const handleSearchPatient = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setError(null);
      const res = await patientService.searchPatients(searchQuery);
      setSearchedPatients(res.data || []);
      if (res.data && res.data.length === 0) {
        setError('No matching patients found. Check Patient ID or Mobile number.');
      }
    } catch (err) {
      setError(err.message || 'Search failed');
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSelectedVisitId('');
    try {
      const res = await patientService.getPatientVisits(patient.patientId);
      const visits = res.data || [];
      setPatientVisits(visits);
      if (visits.length > 0) {
        setSelectedVisitId(visits[0].visitId);
      } else {
        // Mock fallback visit if patient doesn't have an active visit
        setSelectedVisitId(`V-${patient.patientId}-01`);
      }
    } catch (err) {
      console.warn(err);
      setSelectedVisitId(`V-${patient.patientId}-01`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please search and select a patient first.');
      return;
    }
    if (!formData.clinicalRequirementReference.trim()) {
      setError('Clinical Requirement Reference is mandatory.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = {
        patientId: selectedPatient.patientId,
        visitId: selectedVisitId || `V202610001`,
        source: formData.source,
        requestedBy: user?.doctorId || user?.id || 'DOC1001',
        requestingDoctorId: user?.doctorId || user?.id || 'DOC1001',
        clinicalRequirementReference: formData.clinicalRequirementReference,
        clinicalRequiredCategory: formData.clinicalRequiredCategory,
        accommodationPreference: formData.accommodationPreference,
        priority: formData.priority,
        notes: formData.notes
      };

      const res = await admissionService.createAdmissionRequest(payload);
      setSuccess(
        `Admission order submitted successfully! Request ID: ${res.data.admissionRequestId}. Hospital admission desk has been notified.`
      );
      setSelectedPatient(null);
      setSearchQuery('');
      setSearchedPatients([]);
      fetchDoctorRequests();
      setActiveTab('my_requests');
    } catch (err) {
      setError(err.message || 'Failed to submit admission request.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
      SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
      PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
      APPROVED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      BED_SEARCH: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      BED_PENDING: 'bg-purple-50 text-purple-700 border-purple-200',
      BED_ASSIGNED: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
      ADMITTED: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold',
      REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
      CANCELLED: 'bg-gray-100 text-gray-500 border-gray-300'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${badges[status] || 'bg-slate-100 text-slate-600'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Stethoscope className="w-7 h-7 text-teal-200" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Clinical Inpatient Admission Orders</h1>
              <p className="text-teal-100 text-sm mt-0.5">
                Issue authoritative inpatient admission orders with clinical references and accommodation preferences.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('new_request')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'new_request'
                  ? 'bg-white text-teal-900 shadow'
                  : 'bg-teal-900/40 text-teal-100 hover:bg-teal-900/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> New Admission Order
            </button>
            <button
              onClick={() => setActiveTab('my_requests')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'my_requests'
                  ? 'bg-white text-teal-900 shadow'
                  : 'bg-teal-900/40 text-teal-100 hover:bg-teal-900/60'
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Active Orders ({requests.length})
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{success}</div>
        </div>
      )}

      {/* Safety & Responsibility Callout */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-900">
        <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <strong>Clinical Governance Rule:</strong> Clinical admission necessity originates strictly from authorized
          doctors. The system and automated workflows execute administrative validation, bed allocation, documents, and
          notifications.
        </div>
      </div>

      {activeTab === 'new_request' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Order Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Patient Selection */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">1</span>
                  Select Patient & Active Encounter
                </h2>
                {selectedPatient && (
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                  >
                    Change Patient
                  </button>
                )}
              </div>

              {!selectedPatient ? (
                <div className="space-y-4">
                  <form onSubmit={handleSearchPatient} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Patient ID (P10001), Name or Mobile..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                    >
                      Search
                    </button>
                  </form>

                  {searchedPatients.length > 0 && (
                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {searchedPatients.map((p) => (
                        <div
                          key={p.patientId}
                          onClick={() => handleSelectPatient(p)}
                          className="p-3 hover:bg-teal-50/50 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs">
                              {p.firstName?.charAt(0) || 'P'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">
                                {p.fullName || `${p.firstName} ${p.lastName}`}
                              </div>
                              <div className="text-xs text-slate-500">
                                ID: <span className="font-mono text-teal-700">{p.patientId}</span> • Gender:{' '}
                                {p.gender} • Mobile: {p.mobile}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-base">
                      {selectedPatient.firstName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        {selectedPatient.fullName || `${selectedPatient.firstName} ${selectedPatient.lastName}`}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Patient ID: <span className="font-mono font-semibold text-teal-800">{selectedPatient.patientId}</span> • Mobile:{' '}
                        {selectedPatient.mobile} • Blood Group: {selectedPatient.bloodGroup || 'O+'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700">Encounter Visit:</label>
                    <select
                      value={selectedVisitId}
                      onChange={(e) => setSelectedVisitId(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-teal-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {patientVisits.length > 0 ? (
                        patientVisits.map((v) => (
                          <option key={v.visitId} value={v.visitId}>
                            {v.visitId} ({v.visitType})
                          </option>
                        ))
                      ) : (
                        <option value={`V-${selectedPatient.patientId}-01`}>V-{selectedPatient.patientId}-01 (Active)</option>
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Clinical Admission Details */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">2</span>
                Clinical Order & Accommodation Requirements
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Clinical Requirement Reference */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Clinical Requirement Reference <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clinicalRequirementReference}
                    onChange={(e) => setFormData({ ...formData, clinicalRequirementReference: e.target.value })}
                    placeholder="e.g. CLINREQ-CARD-001 (Post-Angiography Care) or Doctor Admission Order #"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Points to the authoritative clinical order, diagnosis, or surgical note in patient records.
                  </p>
                </div>

                {/* Clinical Category Required */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Clinical Ward Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.clinicalRequiredCategory}
                    onChange={(e) => setFormData({ ...formData, clinicalRequiredCategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="GENERAL_WARD">General Ward (Standard Inpatient)</option>
                    <option value="SEMI_PRIVATE">Semi-Private Ward (Monitored)</option>
                    <option value="PRIVATE_ROOM">Private Room (Deluxe Suite)</option>
                    <option value="ICU">ICU (Critical Care Intensive)</option>
                    <option value="EMERGENCY_BED">Emergency Trauma Bed</option>
                  </select>
                </div>

                {/* Patient Accommodation Preference */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Patient Accommodation Preference
                  </label>
                  <select
                    value={formData.accommodationPreference}
                    onChange={(e) => setFormData({ ...formData, accommodationPreference: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="GENERAL_WARD">General Ward</option>
                    <option value="SEMI_PRIVATE">Semi-Private Ward</option>
                    <option value="PRIVATE_ROOM">Private Room</option>
                    <option value="ICU">ICU (If clinically required)</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Admission Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="NORMAL">Normal (Standard OPD)</option>
                    <option value="URGENT">Urgent (Priority bed needed within 2 hrs)</option>
                    <option value="EMERGENCY">Emergency (Immediate bed allocation)</option>
                  </select>
                </div>

                {/* Admission Source */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Admission Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="OPD">OPD Consultation</option>
                    <option value="EMERGENCY">Emergency Dept Arrival</option>
                  </select>
                </div>

                {/* Clinical Notes */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Special Clinical / Nursing Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Oxygen support required, pre-op fasting, special isolation requirements..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={submitting || !selectedPatient}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting Order...' : 'Submit Admission Order'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Col: Doctor Guidelines & Live Availability */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-600" />
                Accommodation Categories
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">General Ward</div>
                    <div className="text-[11px] text-slate-500">Floor 1 • Standard Beds</div>
                  </div>
                  <span className="font-mono text-teal-700 font-bold">₹1,000 / day</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">Semi-Private</div>
                    <div className="text-[11px] text-slate-500">Floor 2 • 2-Bed Monitored</div>
                  </div>
                  <span className="font-mono text-teal-700 font-bold">₹2,500 / day</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">Private Deluxe</div>
                    <div className="text-[11px] text-slate-500">Floor 3 • Single Suite</div>
                  </div>
                  <span className="font-mono text-teal-700 font-bold">₹5,000 / day</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">ICU Unit</div>
                    <div className="text-[11px] text-slate-500">Floor 2 • Ventilator Capable</div>
                  </div>
                  <span className="font-mono text-teal-700 font-bold">₹12,000 / day</span>
                </div>
              </div>
            </div>

            <div className="bg-teal-50/50 rounded-xl p-5 border border-teal-200/60 space-y-2.5">
              <h3 className="text-sm font-semibold text-teal-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Admission Protocol Notes
              </h3>
              <ul className="text-xs text-teal-900/80 space-y-1.5 list-disc list-inside">
                <li>Clinical requirement always overrides patient preference for critical wards (ICU).</li>
                <li>If a patient preference cannot be met, the desk will never auto-downgrade without consent.</li>
                <li>Admission ID is generated automatically upon physical bed assignment & check-in.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* My Admission Requests Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Submitted Admission Orders</h2>
              <p className="text-xs text-slate-500">Track real-time administrative status and bed assignments.</p>
            </div>
            <button
              onClick={fetchDoctorRequests}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading admission orders...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No admission orders recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Request ID</th>
                    <th className="px-5 py-3.5">Patient</th>
                    <th className="px-5 py-3.5">Clinical Reference</th>
                    <th className="px-5 py-3.5">Preference</th>
                    <th className="px-5 py-3.5">Bed / Ward</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={r.admissionRequestId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-teal-800 text-xs">
                        {r.admissionRequestId}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900">{r.patientName || r.patientId}</div>
                        <div className="text-xs text-slate-400 font-mono">{r.patientId}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 max-w-xs truncate">
                        {r.clinicalRequirementReference}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {r.accommodationPreference?.replace(/_/g, ' ')}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {r.assignedBedNumber ? (
                          <span className="font-semibold text-emerald-700">
                            {r.assignedBedNumber} ({r.assignedWardId})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending Allocation</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(r.status)}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorAdmissionRequestPage;
