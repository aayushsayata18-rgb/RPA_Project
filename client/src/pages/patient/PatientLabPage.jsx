import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Download, 
  Printer, 
  Eye, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  ShieldCheck, 
  User, 
  Info,
  ChevronRight
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import laboratoryService from '../../services/laboratoryService';
import { useAuth } from '../../context/AuthContext';

export const PatientLabPage = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('reports'); // 'reports', 'orders'
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Report for Interactive Patient Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchPatientLabData();
  }, []);

  const fetchPatientLabData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In real scenario, user.patientId or role filters
      const patientId = user?.patientId || user?.profile?.patientId;

      const [orderRes, reportRes] = await Promise.allSettled([
        laboratoryService.listOrders({ patientId, limit: 50 }),
        laboratoryService.listReports({ patientId, limit: 50 })
      ]);

      if (orderRes.status === 'fulfilled' && orderRes.value?.success) {
        setOrders(orderRes.value.data || []);
      }
      if (reportRes.status === 'fulfilled' && reportRes.value?.success) {
        // Patient only views released reports
        const releasedReports = (reportRes.value.data || []).filter(
          r => r.releasedToPatient || r.status === 'RELEASED'
        );
        setReports(releasedReports);
      }
    } catch (err) {
      console.error('Failed to load patient lab records:', err);
      setError('Unable to load your laboratory records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = async (report) => {
    try {
      const res = await laboratoryService.getReportById(report.labReportId);
      if (res.success) {
        setSelectedReport(res.data);
      } else {
        setSelectedReport(report);
      }
      setShowReportModal(true);
    } catch (err) {
      setSelectedReport(report);
      setShowReportModal(true);
    }
  };

  const handleDownload = async (reportId) => {
    try {
      await laboratoryService.recordDownload(reportId);
      window.print();
    } catch (err) {
      console.error('Download error:', err);
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            My Diagnostic Laboratory Portal
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View validated diagnostic test results, download official reports, and check collection preparations.
          </p>
        </div>

        <button 
          onClick={fetchPatientLabData}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh My Results
        </button>
      </div>

      {/* Educational Notice */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Important Clinical Note:</strong> Diagnostic reference intervals represent normative physiological values. Abnormal flags do not automatically indicate pathology; please consult your attending physician to correlate findings with your overall clinical picture.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-6">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'reports'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          Released Diagnostic Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          Active Requisitions & Status ({orders.length})
        </button>
      </div>

      {/* Tab: Released Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {loading ? (
            <div className="card p-12 text-center text-gray-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-500" />
              Loading your laboratory reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">
              <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">No Released Reports Yet</h3>
              <p className="text-xs text-gray-400 mt-1">
                Your diagnostic reports will appear here as soon as they are clinically verified and authorized by the pathologist.
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div 
                key={report.labReportId} 
                className="card p-5 hover:border-primary-500 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-base text-gray-900 dark:text-white">
                      {report.reportNumber || report.labReportId}
                    </span>
                    <span className="badge badge-success font-semibold text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Released
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">
                    Ordered on {new Date(report.createdAt).toLocaleDateString()} • Verified by: <strong>{report.verifiedBy || 'Pathology Staff'}</strong>
                  </p>

                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                    Tests included: {report.results?.map(r => r.testName || r.testCode).join(', ') || 'Diagnostic Panel'}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleOpenReport(report)}
                    className="btn btn-secondary btn-sm flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleDownload(report.labReportId)}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Download / Print
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Active Requisitions / Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loading ? (
            <div className="card p-12 text-center text-gray-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-500" />
              Loading your requisitions...
            </div>
          ) : orders.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">
              <Clock className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">No Active Lab Orders</h3>
              <p className="text-xs text-gray-400 mt-1">You have no pending laboratory tests in progress.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.labOrderId} className="card p-5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div>
                    <span className="font-mono font-bold text-primary-600 text-sm">
                      {order.labOrderId}
                    </span>
                    <div className="text-xs text-gray-500">
                      Ordered: {new Date(order.createdAt).toLocaleDateString()} • Doctor: {order.doctorName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <span className="badge badge-info text-xs">{order.priority}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-1">Ordered Diagnostic Tests:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-800 dark:text-gray-200 font-medium">
                      {order.items?.map((it, idx) => (
                        <li key={idx}>
                          {it.testName} ({it.testCode})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">Preparation Instructions:</span>
                    <p className={`p-2.5 rounded ${
                      order.fastingConfirmed 
                        ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800' 
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}>
                      {order.fastingConfirmed 
                        ? '⚠️ Fasting Required: Please avoid food and caloric beverages for 8-12 hours prior to phlebotomy.' 
                        : 'No special fasting preparation specified. Stay well hydrated.'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Interactive Report Details Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Official Diagnostic Laboratory Report"
        maxWidth="max-w-3xl"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Report #{selectedReport.reportNumber || selectedReport.labReportId}
                </h3>
                <p className="text-xs text-gray-500">
                  Released: {new Date(selectedReport.releasedAt || selectedReport.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => handleDownload(selectedReport.labReportId)}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save
              </button>
            </div>

            {/* Test Results Sections */}
            <div className="space-y-4">
              {selectedReport.results?.map((res, rIdx) => (
                <div key={rIdx} className="space-y-2">
                  <div className="font-bold text-sm text-primary-700 dark:text-primary-300">
                    {res.testName || res.testCode}
                  </div>

                  <table className="table w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th>Parameter / Analyte</th>
                        <th>Your Value</th>
                        <th>Standard Reference Range</th>
                        <th>Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {res.parameters?.map((p, pIdx) => (
                        <tr key={pIdx}>
                          <td className="font-medium text-gray-900 dark:text-white">{p.name}</td>
                          <td className="font-bold font-mono text-sm">
                            {p.value} {p.unit}
                          </td>
                          <td className="text-gray-500">{p.referenceRange}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              p.flag === 'NORMAL' ? 'bg-green-100 text-green-800' :
                              p.flag === 'CRITICAL' ? 'bg-red-100 text-red-800 font-black' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.flag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                Verified By: <strong>{selectedReport.verifiedBy || 'Certified Pathologist'}</strong>
              </div>
              <div className="flex items-center gap-1 text-green-600 font-semibold">
                <ShieldCheck className="h-4 w-4" /> Authenticated Report
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatientLabPage;
