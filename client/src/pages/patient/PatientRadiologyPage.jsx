import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Eye, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  ShieldCheck, 
  Info,
  ExternalLink,
  Printer
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import radiologyService from '../../services/radiologyService';
import { useAuth } from '../../context/AuthContext';

export const PatientRadiologyPage = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('reports'); // 'reports', 'appointments'
  const [schedules, setSchedules] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchPatientRadiologyData();
  }, []);

  const fetchPatientRadiologyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const patientId = user?.patientId || user?.profile?.patientId;

      const [scheduleRes, reportRes] = await Promise.allSettled([
        radiologyService.listSchedules({ patientId, limit: 50 }),
        radiologyService.listReports({ patientId, limit: 50 })
      ]);

      if (scheduleRes.status === 'fulfilled' && scheduleRes.value?.success) {
        setSchedules(scheduleRes.value.data || []);
      }
      if (reportRes.status === 'fulfilled' && reportRes.value?.success) {
        // Patient only views released reports
        const releasedReports = (reportRes.value.data || []).filter(
          r => r.releasedToPatient || r.status === 'RELEASED'
        );
        setReports(releasedReports);
      }
    } catch (err) {
      console.error('Failed to load patient radiology data:', err);
      setError('Could not load radiology appointments and reports.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-7 h-7 text-indigo-600" />
            My Radiology & Imaging Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access your scheduled scan appointments, preparation instructions, and verified diagnostic imaging reports.
          </p>
        </div>
        <button
          onClick={fetchPatientRadiologyData}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Records
        </button>
      </div>

      {/* Safety Notice */}
      <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-300">
          <span className="font-semibold">Patient Information Notice:</span> Imaging reports displayed here have been verified and released by authorized hospital radiologists. For personalized clinical context, treatment plans, or inquiries regarding your findings, please consult with your referring physician.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          Released Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Scheduled Appointments ({schedules.length})
        </button>
      </div>

      {/* Tab: Released Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading your verified reports...</div>
          ) : reports.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <div className="text-base font-semibold text-slate-700 dark:text-slate-300">No Released Reports Yet</div>
              <p className="text-xs text-slate-400 mt-1">
                Completed scans will appear here once verified and released by the reporting radiologist.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <div 
                  key={report._id || report.reportNumber}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {report.reportNumber}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {report.orderId?.examId?.name || report.studyId?.modalityType || 'Radiology Examination'}
                        </h3>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>

                    <div className="mt-3 text-xs text-slate-500 space-y-1">
                      <div>Released Date: <strong className="text-slate-700 dark:text-slate-300">{report.releasedAt ? new Date(report.releasedAt).toLocaleDateString() : 'Recently'}</strong></div>
                      <div>Radiologist: <strong className="text-slate-700 dark:text-slate-300">{report.reportingRadiologist?.name || 'Staff Radiologist'}</strong></div>
                      <div>Accession No: <span className="font-mono">{report.accessionNumber || report.studyId?.accessionNumber || 'N/A'}</span></div>
                    </div>

                    {report.impression && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-750 rounded-lg text-xs text-slate-700 dark:text-slate-300 line-clamp-3">
                        <span className="font-semibold block text-slate-900 dark:text-white mb-0.5">Summary Impression:</span>
                        {report.impression}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowReportModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Full Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Scheduled Appointments & Instructions */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading appointments...</div>
          ) : schedules.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <div className="text-base font-semibold text-slate-700 dark:text-slate-300">No Scheduled Appointments</div>
              <p className="text-xs text-slate-400 mt-1">
                You have no upcoming radiology imaging slots booked at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((item) => (
                <div
                  key={item._id || item.scheduleId}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{item.scheduleId}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {item.orderId?.examId?.name || 'Diagnostic Scan'}
                      </h3>
                      <div className="mt-2 text-xs text-slate-500 space-y-1">
                        <div>Modality: <strong className="text-slate-700 dark:text-slate-300">{item.modalityId?.name || 'Imaging Suite'}</strong> ({item.modalityId?.room || 'Ground Floor'})</div>
                        <div>Date & Time: <strong className="text-slate-700 dark:text-slate-300">{item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : 'TBD'} • {item.startTime} - {item.endTime}</strong></div>
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 max-w-md">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                        <Info className="w-4 h-4 shrink-0" />
                        Patient Preparation Guidelines
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        {item.prepInstructions || item.orderId?.examId?.preparationInstructions || 'Arrive 15 minutes before your scheduled slot. Bring prior imaging discs if applicable.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Report Details Modal */}
      {showReportModal && selectedReport && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title={`Official Diagnostic Report: ${selectedReport.reportNumber}`}
        >
          <div className="space-y-4 print:p-0">
            {/* Report Header */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex justify-between items-start">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-400">Department of Radiology</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedReport.orderId?.examId?.name || 'Diagnostic Imaging Examination'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Accession No: <span className="font-mono font-semibold">{selectedReport.accessionNumber || 'N/A'}</span>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedReport.status} />
                <div className="text-xs text-slate-400 mt-1">
                  Released: {selectedReport.releasedAt ? new Date(selectedReport.releasedAt).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>

            {/* Findings */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Detailed Findings</h4>
              <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-lg text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {selectedReport.findings || 'No descriptive findings recorded.'}
              </div>
            </div>

            {/* Impression */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Impression / Conclusion</h4>
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-lg text-sm font-medium text-indigo-950 dark:text-indigo-200 whitespace-pre-wrap">
                {selectedReport.impression || 'Impression not documented.'}
              </div>
            </div>

            {/* Recommendations */}
            {selectedReport.recommendations && (
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-1">Follow-up Recommendations</h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                  {selectedReport.recommendations}
                </div>
              </div>
            )}

            {/* Sign-off */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
              <div>
                Electronically Verified & Signed by: <strong className="text-slate-800 dark:text-slate-200">{selectedReport.reportingRadiologist?.name || 'Radiologist on Duty'}</strong>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientRadiologyPage;
