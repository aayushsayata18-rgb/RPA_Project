import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Send,
  Check,
  PauseCircle,
  X,
  RefreshCw,
  User,
  Stethoscope
} from 'lucide-react';
import pharmacyService from '../../../services/pharmacyService';
import { useAuth } from '../../../context/AuthContext';

export const PrescriptionQueuePage = () => {
  const { user } = useAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected prescription modal
  const [selectedRx, setSelectedRx] = useState(null);

  // New Prescription modal (Doctor flow)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [medicinesList, setMedicinesList] = useState([]);
  const [newRxData, setNewRxData] = useState({
    patientId: 'P10045',
    diagnosis: 'Acute Bronchitis',
    instructions: 'Complete full 5-day course. Do not stop midway.',
    items: [
      {
        medicineId: 'MED-000002',
        dose: '500 mg',
        route: 'ORAL',
        frequency: 'THREE_TIMES_DAILY',
        duration: '5 DAYS',
        quantity: 15,
        instructions: 'Take with plenty of water after food'
      }
    ]
  });

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await pharmacyService.getPrescriptions({
        search: searchTerm,
        status: statusFilter
      });
      if (res.data?.prescriptions) {
        setPrescriptions(res.data.prescriptions);
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPrescriptions();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    pharmacyService.getMedicines({ limit: 50 }).then((res) => {
      if (res.data?.medicines) {
        setMedicinesList(res.data.medicines);
      }
    });
  }, []);

  const handleValidate = async (prescriptionId) => {
    try {
      setError(null);
      await pharmacyService.validatePrescription(prescriptionId);
      setSuccessMsg(`Prescription '${prescriptionId}' successfully validated.`);
      fetchPrescriptions();
      if (selectedRx && selectedRx.prescriptionId === prescriptionId) {
        setSelectedRx(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Validation failed.');
    }
  };

  const handleSendToPharmacy = async (prescriptionId) => {
    try {
      setError(null);
      const res = await pharmacyService.sendToPharmacy(prescriptionId, { orderType: 'OUTPATIENT', priority: 'NORMAL' });
      setSuccessMsg(`Prescription '${prescriptionId}' dispatched to Pharmacy as Order ${res.data?.order?.pharmacyOrderId}.`);
      fetchPrescriptions();
      if (selectedRx && selectedRx.prescriptionId === prescriptionId) {
        setSelectedRx(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send to pharmacy.');
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await pharmacyService.createPrescription(newRxData);
      setSuccessMsg(`Prescription '${res.data?.prescription?.prescriptionId}' issued successfully.`);
      setIsCreateModalOpen(false);
      fetchPrescriptions();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create prescription.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ISSUED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">ISSUED</span>;
      case 'SENT_TO_PHARMACY':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">SENT TO PHARMACY</span>;
      case 'VALIDATED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">VALIDATED</span>;
      case 'PARTIALLY_DISPENSED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">PARTIAL</span>;
      case 'DISPENSED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">DISPENSED</span>;
      case 'ON_HOLD':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">ON HOLD</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Prescription Verification Queue</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Doctor prescriptions incoming from OPD & Inpatient wards awaiting pharmacist clinical validation.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Issue Doctor Prescription
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 font-bold">✕</button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prescription ID, patient, doctor, diagnosis..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ISSUED">ISSUED</option>
            <option value="SENT_TO_PHARMACY">SENT TO PHARMACY</option>
            <option value="VALIDATED">VALIDATED</option>
            <option value="PARTIALLY_DISPENSED">PARTIALLY DISPENSED</option>
            <option value="DISPENSED">DISPENSED</option>
            <option value="ON_HOLD">ON HOLD</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
            }}
            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Prescription ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Diagnosis</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Date & Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading prescriptions queue...
                  </td>
                </tr>
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No prescriptions found matching criteria.
                  </td>
                </tr>
              ) : (
                prescriptions.map((rx) => (
                  <tr key={rx.prescriptionId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{rx.prescriptionId}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{rx.patientName || rx.patientId}</div>
                      <div className="text-xs text-slate-400">{rx.patientId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{rx.doctorName || rx.doctorId}</div>
                      <div className="text-xs text-slate-400">{rx.departmentName || 'OPD'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-700 font-medium line-clamp-1">{rx.diagnosis || '—'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{rx.items?.length || 0}</span>
                      <span className="text-xs text-slate-400 ml-1">meds</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      <div>{new Date(rx.prescriptionDate).toISOString().slice(0, 10)}</div>
                      <div className="text-[10px] text-slate-400">Valid to: {new Date(rx.validUntil).toISOString().slice(0, 10)}</div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(rx.status)}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedRx(rx)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                      >
                        Details
                      </button>

                      {rx.status === 'ISSUED' && (
                        <button
                          onClick={() => handleSendToPharmacy(rx.prescriptionId)}
                          className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded"
                        >
                          Send to Pharmacy
                        </button>
                      )}

                      {rx.status === 'SENT_TO_PHARMACY' && (
                        <button
                          onClick={() => handleValidate(rx.prescriptionId)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                        >
                          Validate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Prescription Details View */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">Prescription: {selectedRx.prescriptionId}</h3>
              </div>
              <button onClick={() => setSelectedRx(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 font-medium">Patient:</span>{' '}
                <span className="font-bold text-slate-900">{selectedRx.patientName}</span> ({selectedRx.patientId})
              </div>
              <div>
                <span className="text-slate-500 font-medium">Doctor:</span>{' '}
                <span className="font-bold text-slate-900">{selectedRx.doctorName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Diagnosis:</span>{' '}
                <span className="font-semibold text-slate-800">{selectedRx.diagnosis || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Status:</span> {getStatusBadge(selectedRx.status)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Prescribed Items</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2">Medication</th>
                      <th className="p-2">Dosage & Frequency</th>
                      <th className="p-2">Duration</th>
                      <th className="p-2 text-right">Prescribed</th>
                      <th className="p-2 text-right">Dispensed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRx.items?.map((it) => (
                      <tr key={it.prescriptionItemId}>
                        <td className="p-2 font-medium text-slate-900">
                          {it.medicineNameSnapshot}
                          <div className="text-[10px] text-slate-400">{it.instructions}</div>
                        </td>
                        <td className="p-2 text-slate-700">
                          {it.dose} • {it.frequency}
                        </td>
                        <td className="p-2">{it.duration}</td>
                        <td className="p-2 text-right font-bold text-slate-800">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="p-2 text-right font-bold text-emerald-600">
                          {it.dispensedQuantity || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setSelectedRx(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              {selectedRx.status === 'SENT_TO_PHARMACY' && (
                <button
                  onClick={() => handleValidate(selectedRx.prescriptionId)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Validate Prescription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Issue Doctor Prescription */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">Issue Doctor Prescription</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patient ID *</label>
                  <input
                    type="text"
                    required
                    value={newRxData.patientId}
                    onChange={(e) => setNewRxData({ ...newRxData, patientId: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosis</label>
                  <input
                    type="text"
                    value={newRxData.diagnosis}
                    onChange={(e) => setNewRxData({ ...newRxData, diagnosis: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medication *</label>
                <select
                  value={newRxData.items[0]?.medicineId}
                  onChange={(e) => {
                    const selected = medicinesList.find((m) => m.medicineId === e.target.value);
                    const updatedItems = [...newRxData.items];
                    updatedItems[0].medicineId = e.target.value;
                    if (selected) {
                      updatedItems[0].dose = selected.strength;
                      updatedItems[0].unit = selected.unit;
                    }
                    setNewRxData({ ...newRxData, items: updatedItems });
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {medicinesList.map((m) => (
                    <option key={m.medicineId} value={m.medicineId}>
                      {m.genericName} ({m.brandName}) — {m.strength} ({m.dosageForm})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={newRxData.items[0]?.frequency}
                    onChange={(e) => {
                      const updated = [...newRxData.items];
                      updated[0].frequency = e.target.value;
                      setNewRxData({ ...newRxData, items: updated });
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ONCE_DAILY">Once Daily</option>
                    <option value="TWICE_DAILY">Twice Daily</option>
                    <option value="THREE_TIMES_DAILY">Three Times Daily</option>
                    <option value="AS_NEEDED">As Needed (SOS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={newRxData.items[0]?.duration}
                    onChange={(e) => {
                      const updated = [...newRxData.items];
                      updated[0].duration = e.target.value;
                      setNewRxData({ ...newRxData, items: updated });
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRxData.items[0]?.quantity}
                    onChange={(e) => {
                      const updated = [...newRxData.items];
                      updated[0].quantity = parseInt(e.target.value, 10) || 1;
                      setNewRxData({ ...newRxData, items: updated });
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Instructions</label>
                <textarea
                  rows="2"
                  value={newRxData.instructions}
                  onChange={(e) => setNewRxData({ ...newRxData, instructions: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Issue Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionQueuePage;
