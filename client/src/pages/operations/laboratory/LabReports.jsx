import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Printer, 
  Send, 
  Eye, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Plus, 
  ShieldCheck, 
  Building2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import laboratoryService from '../../../services/laboratoryService';

export const LabReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Selected Report for Interactive Modal Viewer
  const [selectedReport, setSelectedReport] = useState(null);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [releasing, setReleasing] = useState(false);

  // Generate Report Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateData, setGenerateData] = useState({
    labOrderId: '',
    resultId: '',
    generatedBy: 'Lab Technician'
  });

  useEffect(() => {
    fetchReports();
  }, [status]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.listReports({
        search,
        status,
        limit: 100
      });
      if (res.success) {
        setReports(res.data);
      }
    } catch (err) {
      console.error('Failed to load lab reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenViewer = async (report) => {
    try {
      const res = await laboratoryService.getReportById(report.labReportId);
      if (res.success) {
        setSelectedReport(res.data);
      } else {
        setSelectedReport(report);
      }
      setShowViewerModal(true);
    } catch (err) {
      setSelectedReport(report);
      setShowViewerModal(true);
    }
  };

  const handleReleaseReport = async (reportId) => {
    try {
      setReleasing(true);
      const res = await laboratoryService.releaseReport(reportId);
      if (res.success) {
        alert('Report has been officially released to the Patient Portal!');
        if (selectedReport && selectedReport.labReportId === reportId) {
          setSelectedReport(res.data);
        }
        fetchReports();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to release report.');
    } finally {
      setReleasing(false);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      await laboratoryService.recordDownload(reportId);
      window.print();
    } catch (err) {
      console.error('Download audit error:', err);
      window.print();
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!generateData.labOrderId) {
      alert('Please provide a Laboratory Order ID.');
      return;
    }

    try {
      setGenerating(true);
      const payload = {
        labOrderId: generateData.labOrderId,
        resultIds: generateData.resultId ? [generateData.resultId] : [],
        generatedBy: generateData.generatedBy
      };
      const res = await laboratoryService.generateReport(payload);
      if (res.success) {
        setShowGenerateModal(false);
        setGenerateData({ labOrderId: '', resultId: '', generatedBy: 'Lab Technician' });
        fetchReports();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            Diagnostic Laboratory Reports Archive
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Publish verified laboratory diagnostic reports, trigger patient portal release, and track download access logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchReports}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Generate New Report
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Report Number, Order ID, or Patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
              className="input pl-9 w-full"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input w-full font-medium"
            >
              <option value="">All Report Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="FINAL">Final (Verified)</option>
              <option value="RELEASED">Released to Patient</option>
              <option value="AMENDED">Amended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Report #</th>
                <th>Order ID</th>
                <th>Patient</th>
                <th>Status</th>
                <th>Portal Released</th>
                <th>Verified By</th>
                <th>Generated At</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-500" />
                    Loading laboratory reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No diagnostic laboratory reports found.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep.labReportId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="font-mono font-bold text-primary-600 dark:text-primary-400">
                      {rep.reportNumber || rep.labReportId}
                    </td>
                    <td className="font-mono text-xs">{rep.labOrderId?.labOrderId || rep.labOrderId}</td>
                    <td>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {rep.patientName || rep.labOrderId?.patientName || 'Unknown Patient'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {rep.patientId || rep.labOrderId?.patientId}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={rep.status} />
                    </td>
                    <td>
                      {rep.releasedToPatient ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Released
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3.5 w-3.5" /> Pending Release
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-gray-600 dark:text-gray-300">
                      {rep.verifiedBy || 'Pending Verification'}
                    </td>
                    <td className="text-xs text-gray-500">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenViewer(rep)}
                          className="btn btn-secondary btn-sm flex items-center gap-1"
                          title="View Official Report"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>

                        {!rep.releasedToPatient && rep.status !== 'DRAFT' && (
                          <button
                            onClick={() => handleReleaseReport(rep.labReportId)}
                            className="btn btn-primary btn-sm flex items-center gap-1"
                            title="Release to Patient Portal"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Release
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Report Viewer Modal */}
      <Modal
        isOpen={showViewerModal}
        onClose={() => setShowViewerModal(false)}
        title="Official Diagnostic Laboratory Report"
        maxWidth="max-w-4xl"
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-900 dark:text-white">
                  Report: {selectedReport.reportNumber || selectedReport.labReportId}
                </span>
                <StatusBadge status={selectedReport.status} />
              </div>

              <div className="flex items-center gap-2">
                {!selectedReport.releasedToPatient && selectedReport.status !== 'DRAFT' && (
                  <button
                    onClick={() => handleReleaseReport(selectedReport.labReportId)}
                    disabled={releasing}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {releasing ? 'Releasing...' : 'Release to Patient'}
                  </button>
                )}
                <button
                  onClick={() => handleDownloadReport(selectedReport.labReportId)}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Download PDF
                </button>
              </div>
            </div>

            {/* Official Report Sheet */}
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-900 shadow-sm print:border-none print:shadow-none space-y-6">
              {/* Hospital Header */}
              <div className="flex items-center justify-between border-b-2 border-primary-600 pb-4">
                <div>
                  <h2 className="text-xl font-black tracking-wide text-primary-700 dark:text-primary-400 uppercase">
                    RPA Hospital & Health Systems
                  </h2>
                  <p className="text-xs text-gray-500">
                    Department of Pathology & Laboratory Medicine • CAP & CLIA Certified
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                    {selectedReport.reportNumber || selectedReport.labReportId}
                  </div>
                  <div>Generated: {new Date(selectedReport.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Patient & Requisition Demographics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/60 text-xs">
                <div>
                  <span className="text-gray-500 block">Patient Name</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                    {selectedReport.patientName || selectedReport.labOrderId?.patientName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Patient ID / MRN</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                    {selectedReport.patientId || selectedReport.labOrderId?.patientId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Ordering Physician</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedReport.doctorName || selectedReport.labOrderId?.doctorName || 'Attending Physician'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Requisition Order</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                    {selectedReport.labOrderId?.labOrderId || selectedReport.labOrderId}
                  </span>
                </div>
              </div>

              {/* Test Results Sections */}
              <div className="space-y-4">
                {selectedReport.results?.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No individual test result records attached to this report.
                  </div>
                ) : (
                  selectedReport.results?.map((res, rIdx) => (
                    <div key={rIdx} className="space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          {res.testName || res.testCode}
                        </h4>
                        <span className="text-xs text-gray-500">
                          Methodology: {res.methodology || 'Standard Clinical Chemistry'}
                        </span>
                      </div>

                      <table className="table w-full text-xs">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th>Analyte / Parameter</th>
                            <th>Observed Value</th>
                            <th>Unit</th>
                            <th>Reference Interval</th>
                            <th>Evaluation Flag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {res.parameters?.map((p, pIdx) => (
                            <tr key={pIdx}>
                              <td className="font-medium">{p.name}</td>
                              <td className="font-bold font-mono text-sm">{p.value}</td>
                              <td className="font-mono text-gray-500">{p.unit}</td>
                              <td className="text-gray-600 dark:text-gray-400">{p.referenceRange}</td>
                              <td>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  p.flag === 'CRITICAL' ? 'bg-red-100 text-red-800 font-black animate-pulse' :
                                  p.flag === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                                  p.flag === 'LOW' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {p.flag}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {res.technicianNotes && (
                        <p className="text-xs text-gray-500 italic">
                          Technical Notes: {res.technicianNotes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Pathologist Endorsement and Sign-off */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-semibold mb-1">
                    <ShieldCheck className="h-4 w-4" />
                    Clinically Validated & Digitally Signed
                  </div>
                  <div className="text-gray-700 dark:text-gray-300">
                    Reviewing Pathologist: <strong>{selectedReport.verifiedBy || 'Pathologist On-Duty'}</strong>
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Electronic signature authenticated at {selectedReport.releasedAt ? new Date(selectedReport.releasedAt).toLocaleString() : 'Pending Release'}
                  </div>
                </div>

                <div className="text-right text-gray-400 text-[11px] max-w-xs">
                  * All reference ranges reflect population-specific normative intervals at the time of specimen collection.
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Report Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Diagnostic Laboratory Report"
      >
        <form onSubmit={handleGenerateReport} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Compile verified test analytical results into a finalized diagnostic report for clinical release.
          </p>

          <div>
            <label className="label">Laboratory Order ID *</label>
            <input
              type="text"
              required
              placeholder="e.g. ORD-LAB-20261016-0001"
              value={generateData.labOrderId}
              onChange={(e) => setGenerateData({ ...generateData, labOrderId: e.target.value })}
              className="input w-full font-mono font-semibold"
            />
          </div>

          <div>
            <label className="label">Result ID (Optional)</label>
            <input
              type="text"
              placeholder="e.g. RES-20261016-0001 (Leave empty to aggregate all verified results)"
              value={generateData.resultId}
              onChange={(e) => setGenerateData({ ...generateData, resultId: e.target.value })}
              className="input w-full font-mono text-xs"
            />
          </div>

          <div>
            <label className="label">Generated By Staff</label>
            <input
              type="text"
              value={generateData.generatedBy}
              onChange={(e) => setGenerateData({ ...generateData, generatedBy: e.target.value })}
              className="input w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowGenerateModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="btn btn-primary flex items-center gap-2"
            >
              {generating ? 'Generating...' : 'Compile & Finalize Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LabReports;
