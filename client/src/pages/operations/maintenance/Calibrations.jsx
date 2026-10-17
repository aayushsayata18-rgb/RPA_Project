import React, { useState, useEffect } from 'react';
import { CheckCircle2, PlusCircle, Search, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import maintenanceService from '../../../services/maintenanceService';
import { Modal } from '../../../components/common/Modal';

export const Calibrations = () => {
  const [calibrations, setCalibrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);

  // Log Calibration Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    assetId: '',
    performedByName: '',
    performedAt: new Date().toISOString().slice(0, 10),
    dueDate: '',
    result: 'PASS',
    certificateNumber: '',
    standardsUsed: '',
    temperature: '22°C',
    humidity: '50%',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCalibrations = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.getCalibrations();
      setCalibrations(res.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const res = await maintenanceService.getAssets({ limit: 100 });
      setAssets(res.data?.items || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchCalibrations();
    loadAssets();
  }, []);

  const handleCreateCalibration = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await maintenanceService.createCalibration(formData);
      setShowModal(false);
      setFormData({
        assetId: '',
        performedByName: '',
        performedAt: new Date().toISOString().slice(0, 10),
        dueDate: '',
        result: 'PASS',
        certificateNumber: '',
        standardsUsed: '',
        temperature: '22°C',
        humidity: '50%',
        notes: ''
      });
      fetchCalibrations();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to log calibration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="calibrations-page p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/operations/maintenance" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-teal-600" />
              Biomedical Equipment Calibration Records
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            Precision measurement logs, calibration certificates, testing standards, and compliance expiry
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Log Calibration Certificate
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Calibration ID</th>
                <th className="py-3 px-4">Equipment / Asset</th>
                <th className="py-3 px-4">Certificate #</th>
                <th className="py-3 px-4">Performed Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Certified Engineer / Vendor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Loading calibration records...</td>
                </tr>
              ) : calibrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">No calibration records logged.</td>
                </tr>
              ) : (
                calibrations.map((cal) => (
                  <tr key={cal._id} className="hover:bg-teal-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{cal.calibrationId}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{cal.assetId?.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{cal.assetId?.assetTag}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold">{cal.certificateNumber || '—'}</td>
                    <td className="py-3 px-4 text-xs">{new Date(cal.performedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-indigo-700">{new Date(cal.dueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                        cal.result === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cal.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">{cal.performedByName || 'Certified Engineer'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log Calibration */}
      {showModal && (
        <Modal title="Log Equipment Calibration Certificate" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreateCalibration} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment / Asset *</label>
              <select
                required
                value={formData.assetId}
                onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="">-- Choose Equipment --</option>
                {assets.map((a) => (
                  <option key={a._id} value={a._id}>{a.name} ({a.assetTag})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Calibration Result *</label>
                <select
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="PASS">PASS (Within OEM Tolerance)</option>
                  <option value="FAIL">FAIL (Out of Specification)</option>
                  <option value="CONDITIONAL">CONDITIONAL (Limited Range)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Certificate Number</label>
                <input
                  type="text"
                  placeholder="e.g. NABL-CAL-2026-99"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Performed Date</label>
                <input
                  type="date"
                  value={formData.performedAt}
                  onChange={(e) => setFormData({ ...formData, performedAt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Next Expiry / Due Date</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Certified Engineer / Agency Name</label>
              <input
                type="text"
                placeholder="e.g. Dräger Certified Biomedical Specialist"
                value={formData.performedByName}
                onChange={(e) => setFormData({ ...formData, performedByName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Standard Reference Instrument</label>
              <input
                type="text"
                placeholder="e.g. Fluke VT650 Gas Flow Analyzer"
                value={formData.standardsUsed}
                onChange={(e) => setFormData({ ...formData, standardsUsed: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm"
              >
                {submitting ? 'Logging...' : 'Save Certificate'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Calibrations;
