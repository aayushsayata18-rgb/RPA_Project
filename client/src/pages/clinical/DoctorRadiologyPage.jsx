import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  PlusCircle, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Eye, 
  RefreshCw, 
  Calendar, 
  User, 
  ShieldCheck,
  Stethoscope,
  Send
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import radiologyService from '../../services/radiologyService';
import { useAuth } from '../../context/AuthContext';

export const DoctorRadiologyPage = () => {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'new-order'

  // Modal for report inspection
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // New Order Form state
  const [formData, setFormData] = useState({
    patientId: '',
    examId: '',
    priority: 'ROUTINE',
    clinicalIndication: '',
    contraindications: '',
    requiresContrast: false,
    allergiesNoted: '',
    fastingRequired: false,
    provisionalDiagnosis: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, examRes] = await Promise.allSettled([
        radiologyService.listOrders({ limit: 50 }),
        radiologyService.listExams({ isActive: true })
      ]);

      if (orderRes.status === 'fulfilled' && orderRes.value?.success) {
        setOrders(orderRes.value.data || []);
      }
      if (examRes.status === 'fulfilled' && examRes.value?.success) {
        setExams(examRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load doctor radiology data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.patientId || !formData.examId || !formData.clinicalIndication) {
      setErrorMsg('Please supply Patient ID, Exam, and Clinical Indication.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await radiologyService.createOrder(formData);
      if (res.success) {
        setSuccessMsg(`Radiology order created successfully! Order ID: ${res.data.orderId}`);
        setFormData({
          patientId: '',
          examId: '',
          priority: 'ROUTINE',
          clinicalIndication: '',
          contraindications: '',
          requiresContrast: false,
          allergiesNoted: '',
          fastingRequired: false,
          provisionalDiagnosis: ''
        });
        fetchData();
        setActiveTab('orders');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create radiology order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = async (orderId) => {
    try {
      const res = await radiologyService.listReports({ orderId, limit: 1 });
      if (res.success && res.data?.length > 0) {
        setSelectedReport(res.data[0]);
        setShowReportModal(true);
      } else {
        alert('Report is still pending verification or scan is in progress.');
      }
    } catch (err) {
      alert('Failed to retrieve diagnostic report.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-indigo-600" />
            Physician Imaging Orders & Consultations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Order diagnostic X-Ray, CT, MRI, and Ultrasound examinations with automated 72-hour duplicate prevention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'orders' ? 'new-order' : 'orders')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            {activeTab === 'orders' ? (
              <>
                <PlusCircle className="w-4 h-4" />
                Place Imaging Order
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                View Placed Orders
              </>
            )}
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-300">
          <span className="font-semibold">Radiation & Clinical Safety Guidelines:</span> Ensure patient pregnancy status is verified before requesting ionizing radiation (CT / X-Ray). Check renal clearance (eGFR/Creatinine) for exams requiring intravenous iodinated or gadolinium contrast.
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Tab: Placed Orders List */}
      {activeTab === 'orders' ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Active Radiology Requisitions</h2>
            <span className="text-xs text-slate-500">{orders.length} total orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-750 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Order ID & Date</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Requested Exam</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Clinical Indication</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400">Loading imaging orders...</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400">No imaging orders placed yet.</td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord._id || ord.orderId} className="hover:bg-slate-50 dark:hover:bg-slate-750/50">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">{ord.orderId}</div>
                        <div className="text-xs text-slate-400">{ord.orderDate ? new Date(ord.orderDate).toLocaleDateString() : 'N/A'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {ord.patientId?.name || (ord.patientId?.firstName ? `${ord.patientId.firstName} ${ord.patientId.lastName}` : (ord.patientId?._id || ord.patientId))}
                        </div>
                        <div className="text-xs text-slate-400">ID: {ord.patientId?.patientId || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{ord.examId?.name || 'Scan'}</div>
                        <div className="text-xs text-slate-400">{ord.modalityType || ord.examId?.modalityType}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          ord.priority === 'STAT' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                          ord.priority === 'URGENT' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {ord.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="px-5 py-3.5 text-xs max-w-xs truncate text-slate-600 dark:text-slate-400">
                        {ord.clinicalIndication}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {ord.status === 'COMPLETED' ? (
                          <button
                            onClick={() => handleViewReport(ord._id || ord.orderId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Report
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">In Queue</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab: Place Order Form */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm max-w-3xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            Place Radiology Requisition
          </h2>

          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Patient ID / Mongo ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PAT-2026-0001 or Patient ObjectId"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  <option value="ROUTINE">ROUTINE - Standard Scheduling</option>
                  <option value="URGENT">URGENT - Within 4 Hours</option>
                  <option value="STAT">STAT - Immediate / Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Select Examination *
              </label>
              <select
                required
                value={formData.examId}
                onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
              >
                <option value="">-- Choose Diagnostic Examination --</option>
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    [{ex.modalityType}] {ex.name} - ${ex.basePrice}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Clinical Indication & Suspected Pathology *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Detail clinical symptoms, duration, trauma history, or diagnostic questions to be answered..."
                value={formData.clinicalIndication}
                onChange={(e) => setFormData({ ...formData, clinicalIndication: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Provisional Diagnosis
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acute appendicitis, rule out fracture"
                  value={formData.provisionalDiagnosis}
                  onChange={(e) => setFormData({ ...formData, provisionalDiagnosis: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Known Allergies / Metal Implants
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pacemaker, iodine allergy, metal clips"
                  value={formData.allergiesNoted}
                  onChange={(e) => setFormData({ ...formData, allergiesNoted: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresContrast}
                  onChange={(e) => setFormData({ ...formData, requiresContrast: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Requires Intravenous Contrast</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.fastingRequired}
                  onChange={(e) => setFormData({ ...formData, fastingRequired: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Fasting Required (NPO)</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting Order...' : 'Submit Requisition'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal for Report Viewing */}
      {showReportModal && selectedReport && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title={`Diagnostic Radiology Report: ${selectedReport.reportNumber}`}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <div className="font-mono text-xs text-indigo-600 font-semibold">{selectedReport.reportNumber}</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedReport.orderId?.examId?.name || 'Diagnostic Scan'}
                </div>
                <div className="text-xs text-slate-500 mt-1">Accession No: {selectedReport.accessionNumber || 'N/A'}</div>
              </div>
              <StatusBadge status={selectedReport.status} />
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Radiologist Findings</h4>
              <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-lg text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {selectedReport.findings}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Impression</h4>
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-lg text-sm font-semibold text-indigo-950 dark:text-indigo-200 whitespace-pre-wrap">
                {selectedReport.impression}
              </div>
            </div>

            {selectedReport.recommendations && (
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Recommendations</h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                  {selectedReport.recommendations}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
              <div>
                Verified By: <strong className="text-slate-800 dark:text-slate-200">{selectedReport.reportingRadiologist?.name || 'Radiologist'}</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoctorRadiologyPage;
