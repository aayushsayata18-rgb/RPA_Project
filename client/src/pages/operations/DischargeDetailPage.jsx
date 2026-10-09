import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  LogOut,
  User,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  CreditCard,
  Download,
  ArrowLeft,
  RefreshCw,
  Home,
  Shield,
  CheckSquare,
  Activity,
  XCircle,
  Layers,
  Printer,
  Send,
  X
} from 'lucide-react';
import dischargeService from '../../services/dischargeService';

export const DischargeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [discharge, setDischarge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW | CHECKLIST | SERVICES | BILLING | PAYMENT | DOCUMENTS | BED | AUDIT
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payment counter form state
  const [counterPayForm, setCounterPayForm] = useState({
    amount: '',
    paymentMethod: 'COUNTER_CASH',
    notes: ''
  });

  // Dispute form state
  const [disputeReason, setDisputeReason] = useState('');
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  // Cancellation modal state
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const fetchDischarge = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await dischargeService.getDischargeById(id);
      setDischarge(res.data);
      if (res.data?.payableAmount) {
        setCounterPayForm(prev => ({ ...prev, amount: res.data.payableAmount }));
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch discharge details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDischarge();
  }, [id]);

  const handleProcessWorkflow = async () => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await dischargeService.processDischarge(id);
      setSuccessMsg(res.message || 'Discharge workflow advanced successfully.');
      await fetchDischarge();
    } catch (err) {
      setErrorMsg(err.message || 'Workflow advancement failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteDischarge = async (overridePayment = false) => {
    if (!window.confirm('Are you sure you want to complete this discharge? This will release the bed and finalize patient departure.')) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await dischargeService.completeDischarge(id, { overridePaymentCheck: overridePayment });
      setSuccessMsg('Discharge successfully completed! Bed release triggered.');
      await fetchDischarge();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete discharge.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseBed = async () => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      await dischargeService.releaseBed(id);
      setSuccessMsg('Physical bed released into CLEANING_REQUIRED state.');
      await fetchDischarge();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to release bed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordCounterPayment = async (e) => {
    e.preventDefault();
    if (!discharge.finalInvoiceId) {
      setErrorMsg('No finalized invoice found for payment.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    try {
      await dischargeService.recordCounterPayment({
        invoiceId: discharge.finalInvoiceId,
        amount: counterPayForm.amount,
        paymentMethod: counterPayForm.paymentMethod,
        notes: counterPayForm.notes
      });
      setSuccessMsg('Counter payment successfully recorded!');
      await fetchDischarge();
    } catch (err) {
      setErrorMsg(err.message || 'Payment recording failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateOnlinePayment = async () => {
    if (!discharge.finalInvoiceId) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const session = await dischargeService.createPaymentSession({
        invoiceId: discharge.finalInvoiceId,
        paymentMethod: 'UPI',
        amount: discharge.payableAmount
      });
      await dischargeService.verifyPaymentCallback({
        transactionId: session.data.transactionId,
        status: 'SUCCESS',
        signature: 'MOCK_GATEWAY_SIG_OK'
      });
      setSuccessMsg('Online UPI payment simulated and verified!');
      await fetchDischarge();
    } catch (err) {
      setErrorMsg(err.message || 'Online payment simulation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDischarge = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    try {
      await dischargeService.cancelDischarge(id, cancelReason);
      setIsCancelModalOpen(false);
      setSuccessMsg('Discharge cancelled.');
      await fetchDischarge();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel discharge.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!discharge.finalInvoiceId) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await dischargeService.raiseBillingDispute({
        invoiceId: discharge.finalInvoiceId,
        disputeReason
      });
      setIsDisputeModalOpen(false);
      setDisputeReason('');
      setSuccessMsg('Billing query submitted to finance office.');
      await fetchDischarge();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      REQUESTED: 'bg-amber-100 text-amber-800 border-amber-300',
      VALIDATING: 'bg-blue-100 text-blue-800 border-blue-300',
      PENDING_SERVICES: 'bg-purple-100 text-purple-800 border-purple-300',
      PENDING_BILLING: 'bg-orange-100 text-orange-800 border-orange-300',
      PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      READY_FOR_DISCHARGE: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      PROCESSING: 'bg-sky-100 text-sky-800 border-sky-300',
      COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      CANCELLED: 'bg-slate-100 text-slate-800 border-slate-300',
      EXCEPTION: 'bg-rose-100 text-rose-800 border-rose-300'
    };
    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!discharge) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Discharge Record Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">Discharge ID #{id} does not exist in the platform database.</p>
        <Link to="/operations/discharges" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
          <ArrowLeft /> Return to Discharge Center
        </Link>
      </div>
    );
  }

  const checklist = discharge.checklist || {};
  const invoice = discharge.invoice || {};
  const isTerminal = discharge.status === 'COMPLETED' || discharge.status === 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link to="/operations/discharges" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Discharge Center
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Discharge #{discharge.dischargeNumber}</h1>
            {getStatusBadge(discharge.status)}
          </div>
        </div>

        {/* Global Action Toolbar */}
        {!isTerminal && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleProcessWorkflow}
              disabled={actionLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
              Reconcile & Process
            </button>
            <button
              onClick={() => handleCompleteDischarge(false)}
              disabled={actionLoading || (discharge.payableAmount > 0 && discharge.paymentStatus !== 'PAID')}
              className={`px-4 py-2 font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-2 ${
                discharge.paymentStatus === 'PAID' || discharge.payableAmount === 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Complete Discharge
            </button>
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-semibold rounded-lg transition"
            >
              Cancel Discharge
            </button>
          </div>
        )}
      </div>

      {/* Flash Messages */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="shrink-0 w-5 h-5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="shrink-0 w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Patient & Admission Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Patient Information</span>
          <h3 className="text-xl font-bold mt-1 text-white">{discharge.patientName}</h3>
          <p className="text-xs text-slate-300 mt-0.5">Permanent ID: {discharge.patientId}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-indigo-200">
            <span className="bg-indigo-800/80 px-2 py-0.5 rounded">Visit: {discharge.visitId}</span>
          </div>
        </div>

        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Admission Stay</span>
          <h4 className="text-base font-semibold mt-1 text-white">{discharge.admissionId}</h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Ward: {discharge.assignedWardName || 'Ward'} • Bed: {discharge.assignedBedNumber || 'P-03'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Doctor: {discharge.admittingDoctorName || 'Dr. Assigned'}</p>
        </div>

        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Financial & Settlement</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">₹{discharge.payableAmount || 0}</span>
            <span className="text-xs text-slate-300">Payable</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Gross: ₹{discharge.grossAmount || 0} • Ins: ₹{discharge.coveredAmount || 0}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded ${
            discharge.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
          }`}>
            Payment: {discharge.paymentStatus}
          </span>
        </div>

        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Bed & Housekeeping</span>
          <div className="mt-1 flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
              discharge.bedReleaseStatus === 'RELEASED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              Release: {discharge.bedReleaseStatus}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Type: {discharge.dischargeType} • Initiated: {new Date(discharge.requestedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 px-4 overflow-x-auto">
          {[
            { key: 'OVERVIEW', label: 'Overview & Summary', icon: Activity },
            { key: 'CHECKLIST', label: 'Discharge Checklist', icon: CheckSquare },
            { key: 'SERVICES', label: `Pending Services (${discharge.pendingItems?.length || 0})`, icon: Clock },
            { key: 'BILLING', label: 'Billing & Invoice', icon: DollarSign },
            { key: 'PAYMENT', label: 'Payment Center', icon: CreditCard },
            { key: 'DOCUMENTS', label: `Documents (${discharge.documents?.length || 0})`, icon: FileText },
            { key: 'BED', label: 'Bed & Turnover', icon: Home },
            { key: 'AUDIT', label: 'Audit Trail', icon: Shield }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap border-b-2 transition ${
                activeTab === t.key
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'OVERVIEW' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <LogOut className="text-indigo-600 w-4 h-4" /> Administrative Discharge State
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Discharge Number:</span>
                    <span className="font-semibold text-slate-900">{discharge.dischargeNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Current Phase:</span>
                    <span className="font-semibold text-indigo-600">{discharge.status}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Discharge Type:</span>
                    <span className="font-medium text-slate-800">{discharge.dischargeType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Requested Timestamp:</span>
                    <span className="text-slate-800">{new Date(discharge.requestedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Departure Timestamp:</span>
                    <span className="text-slate-800">{discharge.actualDepartureAt ? new Date(discharge.actualDepartureAt).toLocaleString() : 'Pending final clearance'}</span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="text-indigo-600 w-4 h-4" /> Clinical Clearance Reference
                </h3>
                <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed">
                  <p className="font-semibold text-slate-900 mb-1">Doctor's Medical Order Notes:</p>
                  <p>{discharge.notes || 'Clinical discharge approval recorded by attending physician.'}</p>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  <span>Note: Administrative workflow coordinates billing, settlement and bed release; clinical fitness is determined solely by authorized clinical doctors.</span>
                </div>
              </div>
            </div>

            {/* Visual Workflow Steps Bar */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Discharge Execution Pipeline
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
                {[
                  { step: '1. Clinical Order', done: true },
                  { step: '2. Identity & Admission', done: checklist.patientIdentityVerified },
                  { step: '3. Pending Services', done: !discharge.pendingItems || discharge.pendingItems.length === 0 },
                  { step: '4. Final Bill', done: checklist.finalInvoiceGenerated },
                  { step: '5. Settlement', done: discharge.paymentStatus === 'PAID' },
                  { step: '6. Bed Released', done: discharge.bedReleaseStatus === 'RELEASED' }
                ].map((s, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border text-xs font-semibold ${
                    s.done ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <div className="flex items-center justify-center mb-1">
                      {s.done ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
                    </div>
                    {s.step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Discharge Checklist */}
        {activeTab === 'CHECKLIST' && (
          <div className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="text-indigo-600 w-5 h-5" /> Administrative Prerequisite Checklist
            </h3>
            <p className="text-sm text-slate-500">
              All mandatory administrative verification checkpoints must be satisfied before completing discharge.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {[
                { label: 'Authorized Clinical Decision Recorded', done: checklist.clinicalDecisionRecorded, desc: 'Doctor order recorded' },
                { label: 'Patient Identity & Active Admission Verified', done: checklist.patientIdentityVerified && checklist.admissionVerified, desc: 'Verified without mismatch' },
                { label: 'Laboratory Services Checked', done: checklist.pendingLabChecked, desc: 'No unbilled lab items pending' },
                { label: 'Radiology Services Checked', done: checklist.pendingRadiologyChecked, desc: 'Radiology orders reconciled' },
                { label: 'Pharmacy Orders Checked', done: checklist.pendingPharmacyChecked, desc: 'Pharmacy charges posted' },
                { label: 'Other Ancillary Services Checked', done: checklist.otherServicesChecked, desc: 'Consultations & rooms checked' },
                { label: 'Admission Charges Reconciled', done: checklist.chargesReconciled, desc: 'Bed stays & item rates aggregated' },
                { label: 'Final Itemized Invoice Generated', done: checklist.finalInvoiceGenerated, desc: `Invoice #${discharge.finalInvoiceId || 'Pending'}` },
                { label: 'Insurance Verification / Deductions Handled', done: checklist.insuranceChecked, desc: `Covered: ₹${discharge.coveredAmount || 0}` },
                { label: 'Payment / Counter Settlement Completed', done: discharge.paymentStatus === 'PAID' || discharge.payableAmount === 0, desc: `Status: ${discharge.paymentStatus}` },
                { label: 'Discharge Summary & Receipt Generated', done: checklist.documentsGenerated, desc: 'PDF / printable documents ready' },
                { label: 'Bed Release Requested & Cleaning Triggered', done: discharge.bedReleaseStatus === 'RELEASED', desc: 'Bed state updated to CLEANING_REQUIRED' }
              ].map((item, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${
                  item.done ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="mt-0.5">
                    {item.done ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${item.done ? 'text-emerald-900' : 'text-slate-700'}`}>
                      {item.label}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Pending Services */}
        {activeTab === 'SERVICES' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hospital Department Service Orders</h3>
                <p className="text-sm text-slate-500">Unbilled orders or pending items awaiting charge posting.</p>
              </div>
              <button
                onClick={handleProcessWorkflow}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-check Services
              </button>
            </div>

            {discharge.pendingItems && discharge.pendingItems.length > 0 ? (
              <div className="space-y-3">
                {discharge.pendingItems.map((item, idx) => (
                  <div key={idx} className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                        {item.serviceType}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{item.description}</h4>
                      <p className="text-xs text-slate-500">Ref: {item.itemReference} • Status: {item.status}</p>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full">
                      Pending Reconciliation
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">All Service Departments Cleared</h4>
                <p className="text-xs text-slate-500 mt-0.5">No pending lab tests, pharmacy dispenses, or radiology orders.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Billing & Final Invoice */}
        {activeTab === 'BILLING' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Final Itemized Bill & Invoices</h3>
                <p className="text-sm text-slate-500">Calculated strictly by Billing module from Bed stay and service charges.</p>
              </div>
              <button
                onClick={() => setIsDisputeModalOpen(true)}
                className="px-3 py-1.5 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-semibold rounded-lg"
              >
                Raise Billing Query
              </button>
            </div>

            {invoice && invoice.items && invoice.items.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Qty</th>
                      <th className="px-6 py-3">Unit Price</th>
                      <th className="px-6 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-xs font-bold text-slate-600">{it.category}</td>
                        <td className="px-6 py-3 font-medium text-slate-900">{it.description}</td>
                        <td className="px-6 py-3">{it.quantity}</td>
                        <td className="px-6 py-3">₹{it.unitPrice}</td>
                        <td className="px-6 py-3 text-right font-semibold text-slate-900">₹{it.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 text-sm">
                    <tr>
                      <td colSpan="4" className="px-6 py-2 text-right font-semibold text-slate-600">Gross Total:</td>
                      <td className="px-6 py-2 text-right font-bold text-slate-900">₹{invoice.grossTotal}</td>
                    </tr>
                    <tr>
                      <td colSpan="4" className="px-6 py-2 text-right font-semibold text-slate-600">Insurance Coverage / Approved:</td>
                      <td className="px-6 py-2 text-right font-bold text-indigo-600">- ₹{invoice.coveredAmount || 0}</td>
                    </tr>
                    <tr>
                      <td colSpan="4" className="px-6 py-2 text-right font-semibold text-slate-600">Deposit / Advance Paid:</td>
                      <td className="px-6 py-2 text-right font-bold text-indigo-600">- ₹{invoice.depositAmount || 0}</td>
                    </tr>
                    {invoice.discountAmount > 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-2 text-right font-semibold text-slate-600">Discount:</td>
                        <td className="px-6 py-2 text-right font-bold text-emerald-600">- ₹{invoice.discountAmount}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-slate-300 text-base font-black text-emerald-700 bg-emerald-50/40">
                      <td colSpan="4" className="px-6 py-3 text-right">Net Payable Amount:</td>
                      <td className="px-6 py-3 text-right">₹{invoice.payableAmount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                <DollarSign className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Final Invoice Generated Yet</h4>
                <p className="text-xs text-slate-500 mt-0.5">Click "Reconcile & Process" to generate the final invoice.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Payment Center */}
        {activeTab === 'PAYMENT' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Settlement & Payment Gateway</h3>
              <p className="text-sm text-slate-500">Record payments made via online gateway or at physical hospital counter.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: Digital Payment Simulator */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CreditCard className="text-indigo-600 w-4 h-4" /> Online Payment Gateway
                </h4>
                <p className="text-xs text-slate-500 mb-4">Patient self-service portal checkout (UPI, Card, Net Banking).</p>
                <div className="p-4 bg-white rounded-lg border border-slate-200 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Invoice:</span>
                    <span className="font-semibold">{discharge.finalInvoiceId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Payable Balance:</span>
                    <span className="font-bold text-emerald-600">₹{discharge.payableAmount || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className="font-semibold">{discharge.paymentStatus}</span>
                  </div>
                </div>

                <button
                  onClick={handleSimulateOnlinePayment}
                  disabled={actionLoading || discharge.paymentStatus === 'PAID' || discharge.payableAmount === 0}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-lg transition shadow-sm"
                >
                  {discharge.paymentStatus === 'PAID' ? 'Fully Paid & Settled' : 'Simulate Verified Online Payment (UPI)'}
                </button>
              </div>

              {/* Option B: Physical Counter Payment */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <DollarSign className="text-emerald-600 w-4 h-4" /> Physical Counter Payment
                </h4>
                <p className="text-xs text-slate-500 mb-4">Record cash or POS payment received at hospital billing counter.</p>

                <form onSubmit={handleRecordCounterPayment} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      value={counterPayForm.amount}
                      onChange={(e) => setCounterPayForm({ ...counterPayForm, amount: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method *</label>
                    <select
                      value={counterPayForm.paymentMethod}
                      onChange={(e) => setCounterPayForm({ ...counterPayForm, paymentMethod: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="COUNTER_CASH">Cash at Counter</option>
                      <option value="COUNTER_CARD">POS Card Terminal</option>
                      <option value="COUNTER_UPI">Counter QR / UPI</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading || discharge.paymentStatus === 'PAID' || !discharge.finalInvoiceId}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-lg transition shadow-sm"
                  >
                    Record Counter Receipt
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Documents */}
        {activeTab === 'DOCUMENTS' && (
          <div className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Generated Discharge Documents</h3>
            <p className="text-sm text-slate-500">Official printable records generated via central Document Service.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {discharge.documents && discharge.documents.length > 0 ? (
                discharge.documents.map((doc) => (
                  <div key={doc._id} className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        {doc.documentType}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-2">{doc.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Doc ID: {doc.documentId}</p>
                      <p className="text-xs text-slate-400">Generated: {new Date(doc.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Role Access: {doc.accessRoles?.join(', ')}</span>
                      <button
                        onClick={() => {
                          const w = window.open('', '_blank');
                          w.document.write(doc.htmlContent);
                          w.document.close();
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <Printer className="w-3.5 h-3.5" /> View / Print
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">No Documents Generated Yet</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Documents will be compiled upon discharge clearance and completion.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Bed & Turnover */}
        {activeTab === 'BED' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bed Release & Housekeeping Turnover</h3>
                <p className="text-sm text-slate-500">Physical bed state transitions from OCCUPIED &rarr; CLEANING_REQUIRED &rarr; AVAILABLE.</p>
              </div>
              {discharge.bedReleaseStatus !== 'RELEASED' && (
                <button
                  onClick={handleReleaseBed}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                >
                  Release Bed to Housekeeping
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase">Physical Bed</span>
                <h4 className="text-lg font-bold text-slate-900 mt-1">{discharge.assignedBedNumber || 'P-03'}</h4>
                <p className="text-xs text-slate-500">{discharge.assignedWardName || 'Private Deluxe Suite Ward'}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase">Bed Release Status</span>
                <h4 className="text-lg font-bold text-indigo-700 mt-1">{discharge.bedReleaseStatus}</h4>
                <p className="text-xs text-slate-500">{discharge.bedReleaseStatus === 'RELEASED' ? 'Bed released for sanitation' : 'Bed still assigned to patient'}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase">Housekeeping Trigger</span>
                <h4 className="text-lg font-bold text-emerald-700 mt-1">
                  {discharge.bedReleaseTaskId ? discharge.bedReleaseTaskId : (discharge.bedReleaseStatus === 'RELEASED' ? 'Sanitation Task Active' : 'Pending Discharge')}
                </h4>
                <p className="text-xs text-slate-500">Turns AVAILABLE after housekeeping completion</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Audit Trail */}
        {activeTab === 'AUDIT' && (
          <div className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Discharge Audit & History Trail</h3>
            <div className="space-y-3 mt-4">
              {discharge.history && discharge.history.length > 0 ? (
                discharge.history.map((h, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-700 uppercase">{h.action}</span>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">{h.details}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        By {h.changedBy} ({h.changedByRole}) • Corr ID: {h.correlationId || discharge.correlationId}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No audit history entries recorded.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Raise Billing Query */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Raise Billing Dispute / Query</h3>
              <button onClick={() => setIsDisputeModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRaiseDispute} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dispute Reason *</label>
                <textarea
                  rows="3"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe discrepancy in bed charge, pharmacy charge, or insurance deduction..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsDisputeModalOpen(false)} className="px-4 py-2 text-sm text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-amber-600 text-white font-semibold rounded-lg">
                  Submit Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cancel Discharge */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Cancel Discharge Process</h3>
              <button onClick={() => setIsCancelModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCancelDischarge} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cancellation Reason *</label>
                <textarea
                  rows="3"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="State reason for cancelling discharge (e.g. physician decision to continue treatment)..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsCancelModalOpen(false)} className="px-4 py-2 text-sm text-slate-600">
                  Back
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-rose-600 text-white font-semibold rounded-lg">
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DischargeDetailPage;
