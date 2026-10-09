import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import admissionService from '../../services/admissionService';
import bedService from '../../services/bedService';
import patientService from '../../services/patientService';
import {
  Bed,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Building,
  UserPlus,
  ShieldCheck,
  FileText,
  User,
  Activity,
  Send,
  Link,
  ChevronRight,
  Eye,
  Sliders,
  Sparkles,
  Zap,
  Check,
  Flame
} from 'lucide-react';

export const OperationsAdmissionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'active_admissions' | 'bed_matrix' | 'emergency_admission'
  const [requests, setRequests] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardFilter, setSelectedWardFilter] = useState('ALL');

  // Modals state
  const [assignBedModalReq, setAssignBedModalReq] = useState(null);
  const [suitableBeds, setSuitableBeds] = useState([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [bedSearchLoading, setBedSearchLoading] = useState(false);

  const [approveModalReq, setApproveModalReq] = useState(null);
  const [approvalReason, setApprovalReason] = useState('Approved per hospital admission protocol');

  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [completeModalReq, setCompleteModalReq] = useState(null);
  const [insuranceForm, setInsuranceForm] = useState({
    provider: 'Star Health Insurance',
    policyNumber: 'POL-STAR-2026',
    preAuthStatus: 'APPROVED',
    approvedAmount: 40000
  });

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({
    temporaryEmergencyId: '',
    permanentPatientId: ''
  });

  // Emergency Intake Form state
  const [emergencyForm, setEmergencyForm] = useState({
    patientType: 'NEW_TEMP', // 'NEW_TEMP' | 'EXISTING'
    existingPatientId: '',
    provisionalName: 'Unknown Emergency Patient',
    estimatedAge: '30',
    gender: 'MALE',
    apparentCondition: 'Acute trauma stabilization',
    requestingDoctorId: 'DOC1001',
    clinicalRequirementReference: 'EMG-TRAUMA-ORDER',
    clinicalRequiredCategory: 'EMERGENCY_BED',
    accommodationPreference: 'EMERGENCY_BED',
    assignedBedId: ''
  });
  const [submittingEmergency, setSubmittingEmergency] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reqRes, admRes, wardRes, bedRes] = await Promise.all([
        admissionService.getAdmissionRequests(),
        admissionService.getAdmissions(),
        bedService.getWards(),
        bedService.getBeds()
      ]);

      setRequests(reqRes.data || []);
      setAdmissions(admRes.data || []);
      setWards(wardRes.data || []);
      setBeds(bedRes.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load admission desk data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Requests
  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (sourceFilter !== 'ALL' && r.source !== sourceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.patientName || '').toLowerCase().includes(q);
      const matchId = (r.patientId || '').toLowerCase().includes(q);
      const matchReq = (r.admissionRequestId || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchReq) return false;
    }
    return true;
  });

  // Filtered Beds
  const filteredBeds = beds.filter((b) => {
    if (selectedWardFilter !== 'ALL' && b.wardId !== selectedWardFilter) return false;
    return true;
  });

  // Actions
  const handleOpenAssignBed = async (req) => {
    setAssignBedModalReq(req);
    setSelectedBedId('');
    try {
      setBedSearchLoading(true);
      const res = await bedService.findSuitableBeds({
        clinicalRequirementCategory: req.clinicalRequiredCategory || 'GENERAL_WARD',
        accommodationPreference: req.accommodationPreference || req.clinicalRequiredCategory || 'GENERAL_WARD'
      });
      setSuitableBeds(res.data?.availableBeds || []);
      if (res.data?.availableBeds?.length > 0) {
        setSelectedBedId(res.data.availableBeds[0].bedId);
      }
    } catch (err) {
      setError(err.message || 'Failed to query suitable beds');
    } finally {
      setBedSearchLoading(false);
    }
  };

  const handleConfirmAssignBed = async () => {
    if (!selectedBedId || !assignBedModalReq) return;
    try {
      setError(null);
      await admissionService.assignBed(assignBedModalReq.admissionRequestId, selectedBedId);
      setSuccess(`Bed assigned successfully to Request ${assignBedModalReq.admissionRequestId}`);
      setAssignBedModalReq(null);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to assign bed');
    }
  };

  const handleConfirmApprove = async () => {
    if (!approveModalReq) return;
    try {
      setError(null);
      await admissionService.approveAdmissionRequest(approveModalReq.admissionRequestId, approvalReason);
      setSuccess(`Admission request ${approveModalReq.admissionRequestId} approved.`);
      setApproveModalReq(null);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to approve request');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReq || !rejectionReason.trim()) return;
    try {
      setError(null);
      await admissionService.rejectAdmissionRequest(rejectModalReq.admissionRequestId, rejectionReason);
      setSuccess(`Admission request ${rejectModalReq.admissionRequestId} rejected.`);
      setRejectModalReq(null);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to reject request');
    }
  };

  const handleConfirmComplete = async () => {
    if (!completeModalReq) return;
    try {
      setError(null);
      const res = await admissionService.completeAdmission(completeModalReq.admissionRequestId, {
        insuranceDetails: insuranceForm
      });
      setSuccess(`Patient successfully admitted! Inpatient Admission ID: ${res.data.admissionId}`);
      setCompleteModalReq(null);
      fetchData();
      setActiveTab('active_admissions');
    } catch (err) {
      setError(err.message || 'Failed to finalize admission');
    }
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingEmergency(true);
      setError(null);

      const payload = {
        patientId: emergencyForm.patientType === 'EXISTING' ? emergencyForm.existingPatientId : null,
        provisionalName: emergencyForm.provisionalName,
        estimatedAge: parseInt(emergencyForm.estimatedAge, 10) || null,
        gender: emergencyForm.gender,
        apparentCondition: emergencyForm.apparentCondition,
        requestingDoctorId: emergencyForm.requestingDoctorId,
        clinicalRequirementReference: emergencyForm.clinicalRequirementReference,
        clinicalRequiredCategory: emergencyForm.clinicalRequiredCategory,
        accommodationPreference: emergencyForm.accommodationPreference,
        assignedBedId: emergencyForm.assignedBedId || null
      };

      const res = await admissionService.createEmergencyAdmission(payload);
      setSuccess(
        `Emergency intake processed successfully! ${
          res.data?.admissionId ? `Inpatient Admission ID: ${res.data.admissionId}` : 'Admission Request created.'
        }`
      );
      fetchData();
      setActiveTab('active_admissions');
    } catch (err) {
      setError(err.message || 'Emergency admission failed');
    } finally {
      setSubmittingEmergency(false);
    }
  };

  const handleLinkIdentity = async (e) => {
    e.preventDefault();
    if (!linkForm.temporaryEmergencyId || !linkForm.permanentPatientId) return;
    try {
      setError(null);
      await admissionService.linkEmergencyIdentity(
        linkForm.temporaryEmergencyId.trim(),
        linkForm.permanentPatientId.trim()
      );
      setSuccess(`Identity linked successfully for ${linkForm.temporaryEmergencyId} -> ${linkForm.permanentPatientId}`);
      setLinkModalOpen(false);
      setLinkForm({ temporaryEmergencyId: '', permanentPatientId: '' });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to link identity');
    }
  };

  const handleTriggerRpaSync = async (admissionId) => {
    try {
      setError(null);
      const res = await admissionService.syncExternalSystem(admissionId);
      if (res.success) {
        setSuccess(`RPA Synchronization completed! External ID: ${res.data.externalAdmissionId}`);
      } else {
        setError(`RPA Sync returned failure: ${res.error || 'System timeout'}`);
      }
      fetchData();
    } catch (err) {
      setError(err.message || 'RPA synchronization trigger failed');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
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

  const getBedStatusBadge = (status) => {
    const badges = {
      AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      RESERVED: 'bg-amber-50 text-amber-700 border-amber-200',
      OCCUPIED: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      CLEANING: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      MAINTENANCE: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${badges[status] || 'bg-slate-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 backdrop-blur-md flex items-center justify-center border border-teal-400/30 shadow-inner">
              <Bed className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Patient Admission & Bed Desk</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-xs font-medium border border-teal-400/30">
                  Module 4
                </span>
              </div>
              <p className="text-teal-200/80 text-sm mt-0.5">
                Inpatient workflow orchestration, bed availability management, approval governance & RPA synchronization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLinkModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all"
            >
              <Link className="w-3.5 h-3.5 text-teal-300" /> Link Temp Identity
            </button>
            <button
              onClick={fetchData}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-teal-200/70 text-[11px] uppercase tracking-wider font-semibold">Active Inpatients</div>
            <div className="text-2xl font-bold text-white mt-1">
              {admissions.filter((a) => a.status === 'ADMITTED').length}
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-teal-200/70 text-[11px] uppercase tracking-wider font-semibold">Pending Orders</div>
            <div className="text-2xl font-bold text-amber-300 mt-1">
              {requests.filter((r) => ['PENDING_APPROVAL', 'BED_PENDING', 'BED_SEARCH'].includes(r.status)).length}
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-teal-200/70 text-[11px] uppercase tracking-wider font-semibold">Available Beds</div>
            <div className="text-2xl font-bold text-emerald-300 mt-1">
              {beds.filter((b) => b.status === 'AVAILABLE').length}
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-teal-200/70 text-[11px] uppercase tracking-wider font-semibold">Total Hospital Beds</div>
            <div className="text-2xl font-bold text-white mt-1">{beds.length}</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{success}</div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-sm font-semibold">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'requests'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Admission Requests Queue ({requests.length})
        </button>

        <button
          onClick={() => setActiveTab('active_admissions')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'active_admissions'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Active Inpatients ({admissions.filter((a) => a.status === 'ADMITTED').length})
        </button>

        <button
          onClick={() => setActiveTab('bed_matrix')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'bed_matrix'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building className="w-4 h-4" />
          Ward & Bed Availability ({beds.length})
        </button>

        <button
          onClick={() => setActiveTab('emergency_admission')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'emergency_admission'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          Emergency Express Intake
        </button>
      </div>

      {/* TAB 1: ADMISSION REQUESTS QUEUE */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, ID, or Request ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5" /> Status:
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="BED_PENDING">Bed Pending</option>
                <option value="BED_ASSIGNED">Bed Assigned</option>
                <option value="ADMITTED">Admitted</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Sources</option>
                <option value="OPD">OPD</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No admission requests match the filter criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Request ID</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Source & Priority</th>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Preference</th>
                      <th className="px-4 py-3">Bed Allocation</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((r) => (
                      <tr key={r.admissionRequestId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-teal-800">
                          <button
                            onClick={() => navigate(`/operations/admissions/${r.admissionRequestId}`)}
                            className="hover:underline flex items-center gap-1"
                          >
                            {r.admissionRequestId}
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 text-sm">{r.patientName || r.patientId}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {r.patientId} • Visit: {r.visitId}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              r.source === 'EMERGENCY'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {r.source}
                          </span>
                          {r.priority !== 'NORMAL' && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              {r.priority}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          <div>{r.requestingDoctorName || r.requestingDoctorId}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {r.clinicalRequirementReference}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {r.accommodationPreference?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3.5">
                          {r.assignedBedNumber ? (
                            <span className="font-bold text-emerald-700">
                              {r.assignedBedNumber} <span className="text-[10px] text-slate-400">({r.assignedWardId})</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">{getStatusBadge(r.status)}</td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Approve / Reject buttons */}
                            {r.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => setApproveModalReq(r)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px]"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejectModalReq(r)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-medium text-[11px]"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {/* Assign Bed button */}
                            {['APPROVED', 'BED_PENDING', 'BED_SEARCH'].includes(r.status) && (
                              <button
                                onClick={() => handleOpenAssignBed(r)}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-medium text-[11px] flex items-center gap-1"
                              >
                                <Bed className="w-3 h-3" /> Assign Bed
                              </button>
                            )}

                            {/* Finalize Admission button */}
                            {r.status === 'BED_ASSIGNED' && (
                              <button
                                onClick={() => setCompleteModalReq(r)}
                                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[11px] shadow-sm flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Finalize Admission
                              </button>
                            )}

                            {/* Details link */}
                            <button
                              onClick={() => navigate(`/operations/admissions/${r.admissionRequestId}`)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600"
                              title="View Full Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE INPATIENTS */}
      {activeTab === 'active_admissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Current Hospital Inpatient Population</h2>
                <p className="text-xs text-slate-500">Live admitted patients occupying wards and physical beds.</p>
              </div>
            </div>

            {admissions.filter((a) => a.status === 'ADMITTED').length === 0 ? (
              <div className="p-12 text-center text-slate-400">No patients are currently admitted in hospital wards.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Admission ID</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Ward & Bed</th>
                      <th className="px-4 py-3">Admitting Doctor</th>
                      <th className="px-4 py-3">Admitted At</th>
                      <th className="px-4 py-3">Insurance / Billing</th>
                      <th className="px-4 py-3">RPA Sync</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admissions
                      .filter((a) => a.status === 'ADMITTED')
                      .map((adm) => (
                        <tr key={adm.admissionId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-teal-800">
                            {adm.admissionId}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-900 text-sm">{adm.patientName || adm.patientId}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{adm.patientId}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-emerald-700 text-sm">Bed: {adm.assignedBedNumber}</div>
                            <div className="text-[11px] text-slate-500">{adm.assignedWardName || adm.assignedWardId}</div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            {adm.admittingDoctorName}
                            <div className="text-[10px] text-slate-400">{adm.admittingDepartmentName}</div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {adm.admissionDateStr} <span className="text-slate-400">{adm.admissionTime}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                adm.insuranceStatus === 'VERIFIED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {adm.insuranceStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                adm.externalSyncStatus === 'SYNCED'
                                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {adm.externalSyncStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleTriggerRpaSync(adm.admissionId)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded font-medium text-[11px] flex items-center gap-1"
                                title="Synchronize with External HIS"
                              >
                                <Zap className="w-3 h-3 text-indigo-600" /> RPA Sync
                              </button>
                              <button
                                onClick={() => navigate(`/operations/admissions/${adm.admissionId}`)}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded font-semibold text-[11px] flex items-center gap-1"
                              >
                                Detail
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BED MANAGEMENT & VISUAL MATRIX */}
      {activeTab === 'bed_matrix' && (
        <div className="space-y-6">
          {/* Ward Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedWardFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedWardFilter === 'ALL'
                  ? 'bg-teal-700 text-white shadow'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Wards ({beds.length} beds)
            </button>
            {wards.map((w) => (
              <button
                key={w.wardId}
                onClick={() => setSelectedWardFilter(w.wardId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedWardFilter === w.wardId
                    ? 'bg-teal-700 text-white shadow'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {w.name} ({w.availableBeds}/{w.totalBeds} free)
              </button>
            ))}
          </div>

          {/* Visual Matrix Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBeds.map((bed) => (
              <div
                key={bed.bedId}
                className={`p-4 rounded-xl border transition-all ${
                  bed.status === 'OCCUPIED'
                    ? 'bg-rose-50/40 border-rose-200 shadow-sm'
                    : bed.status === 'RESERVED'
                    ? 'bg-amber-50/40 border-amber-200 shadow-sm'
                    : 'bg-white border-slate-200 shadow-sm hover:border-teal-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Bed
                        className={`w-4 h-4 ${
                          bed.status === 'OCCUPIED'
                            ? 'text-rose-500'
                            : bed.status === 'RESERVED'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}
                      />
                      {bed.bedNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">{bed.wardName || bed.wardId}</div>
                  </div>
                  {getBedStatusBadge(bed.status)}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Category:</span>
                    <span className="font-semibold text-slate-800">{bed.bedType?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Rate:</span>
                    <span className="font-mono text-teal-700 font-semibold">₹{bed.dailyRate}/day</span>
                  </div>
                  {bed.status === 'OCCUPIED' && (
                    <div className="mt-2 p-2 bg-rose-100/60 rounded text-[11px] text-rose-900 font-medium">
                      Patient: {bed.currentPatientName || bed.currentPatientId}
                    </div>
                  )}
                  {bed.status === 'RESERVED' && (
                    <div className="mt-2 p-2 bg-amber-100/60 rounded text-[11px] text-amber-900 font-medium">
                      Reserved for: {bed.reservedForPatientId}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EMERGENCY ADMISSION EXPRESS */}
      {activeTab === 'emergency_admission' && (
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-6 max-w-4xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Emergency Patient Intake Pipeline</h2>
              <p className="text-xs text-slate-500">
                Rapid clinical admission for emergency arrivals. Supports provisional temporary identities and immediate bed allocation.
              </p>
            </div>
          </div>

          <form onSubmit={handleEmergencySubmit} className="space-y-4 text-xs">
            {/* Patient Mode Radio */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-6">
              <label className="font-semibold text-slate-700">Identity Mode:</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="patientType"
                  value="NEW_TEMP"
                  checked={emergencyForm.patientType === 'NEW_TEMP'}
                  onChange={() => setEmergencyForm({ ...emergencyForm, patientType: 'NEW_TEMP' })}
                />
                <span className="font-medium text-slate-800">Unidentified / Temporary Emergency Record</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="patientType"
                  value="EXISTING"
                  checked={emergencyForm.patientType === 'EXISTING'}
                  onChange={() => setEmergencyForm({ ...emergencyForm, patientType: 'EXISTING' })}
                />
                <span className="font-medium text-slate-800">Existing Patient Master (P1000X)</span>
              </label>
            </div>

            {emergencyForm.patientType === 'EXISTING' ? (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Permanent Patient ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P10002"
                  value={emergencyForm.existingPatientId}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, existingPatientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Provisional Name *</label>
                  <input
                    type="text"
                    required
                    value={emergencyForm.provisionalName}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, provisionalName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Approximate Age</label>
                  <input
                    type="number"
                    value={emergencyForm.estimatedAge}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, estimatedAge: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Apparent Gender</label>
                  <select
                    value={emergencyForm.gender}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="UNDISCLOSED">Undisclosed</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Apparent Condition / Diagnosis</label>
                <input
                  type="text"
                  value={emergencyForm.apparentCondition}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, apparentCondition: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Clinical Order Reference *</label>
                <input
                  type="text"
                  required
                  value={emergencyForm.clinicalRequirementReference}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, clinicalRequirementReference: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Target Ward Bed</label>
                <select
                  value={emergencyForm.assignedBedId}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, assignedBedId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">-- Auto-Allocate Next Available Emergency Bed --</option>
                  {beds
                    .filter((b) => b.status === 'AVAILABLE')
                    .map((b) => (
                      <option key={b.bedId} value={b.bedId}>
                        {b.bedNumber} ({b.wardName || b.wardId}) - {b.bedType}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Emergency Attending Doctor</label>
                <input
                  type="text"
                  value={emergencyForm.requestingDoctorId}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, requestingDoctorId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={submittingEmergency}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2"
              >
                <Flame className="w-4 h-4" />
                {submittingEmergency ? 'Processing Emergency Intake...' : 'Execute Emergency Inpatient Admission'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: ASSIGN BED --- */}
      {assignBedModalReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-teal-600" />
                  Assign Physical Bed
                </h3>
                <p className="text-xs text-slate-500">
                  Request: <span className="font-mono font-bold text-teal-800">{assignBedModalReq.admissionRequestId}</span> • Patient:{' '}
                  {assignBedModalReq.patientName}
                </p>
              </div>
              <button onClick={() => setAssignBedModalReq(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-teal-50/60 rounded-xl text-xs space-y-1 border border-teal-100">
              <div className="flex justify-between">
                <span className="text-slate-600">Clinical Requirement:</span>
                <span className="font-semibold text-teal-900">{assignBedModalReq.clinicalRequiredCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Accommodation Preference:</span>
                <span className="font-semibold text-teal-900">{assignBedModalReq.accommodationPreference}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Select Suitable Available Bed:</label>
              {bedSearchLoading ? (
                <div className="text-xs text-slate-400 py-3 text-center">Searching bed inventory...</div>
              ) : suitableBeds.length === 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  No beds currently available matching category "{assignBedModalReq.accommodationPreference}".
                  Please select another available ward or escalate to administrative manager.
                </div>
              ) : (
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {suitableBeds.map((b) => (
                    <option key={b.bedId} value={b.bedId}>
                      Bed {b.bedNumber} ({b.wardName || b.wardId}) - ₹{b.dailyRate}/day
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setAssignBedModalReq(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignBed}
                disabled={!selectedBedId}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow"
              >
                Reserve & Assign Bed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: APPROVE REQUEST --- */}
      {approveModalReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Approve Admission Request
            </h3>
            <p className="text-xs text-slate-500">
              Confirm administrative & clinical authorization for Request{' '}
              <span className="font-mono font-bold text-slate-800">{approveModalReq.admissionRequestId}</span> (Patient:{' '}
              {approveModalReq.patientName}).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Approval Note / Reason</label>
              <input
                type="text"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setApproveModalReq(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow"
              >
                Authorize Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: REJECT REQUEST --- */}
      {rejectModalReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Reject Admission Request
            </h3>
            <p className="text-xs text-slate-500">
              Provide mandatory administrative reason for rejecting Request{' '}
              <span className="font-mono font-bold text-slate-800">{rejectModalReq.admissionRequestId}</span>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Rejection Justification *</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Duplicate request, missing required administrative consent..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: FINALIZE ADMISSION --- */}
      {completeModalReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Finalize Inpatient Admission
              </h3>
              <button onClick={() => setCompleteModalReq(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{completeModalReq.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Bed:</span>
                <span className="font-bold text-emerald-700">
                  {completeModalReq.assignedBedNumber} ({completeModalReq.assignedWardId})
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-semibold text-slate-800">Insurance & Billing Encounter Setup:</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600">Insurance Provider</label>
                  <input
                    type="text"
                    value={insuranceForm.provider}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, provider: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600">Policy Number</label>
                  <input
                    type="text"
                    value={insuranceForm.policyNumber}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setCompleteModalReq(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmComplete}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md"
              >
                Confirm Inpatient Admission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: LINK TEMPORARY IDENTITY --- */}
      {linkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Link className="w-5 h-5 text-teal-600" />
                Link Temporary Emergency ID
              </h3>
              <button onClick={() => setLinkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkIdentity} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Temporary ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TEMP-2026-00452"
                  value={linkForm.temporaryEmergencyId}
                  onChange={(e) => setLinkForm({ ...linkForm, temporaryEmergencyId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Permanent Patient ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P10004"
                  value={linkForm.permanentPatientId}
                  onChange={(e) => setLinkForm({ ...linkForm, permanentPatientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow"
                >
                  Link Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsAdmissionsPage;
