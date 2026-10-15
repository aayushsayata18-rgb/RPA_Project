import React, { useState, useEffect } from 'react';
import {
  Pill,
  FileText,
  Clock,
  PackageCheck,
  Receipt,
  Download,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Calendar,
  Layers
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import { useAuth } from '../../context/AuthContext';

export const PatientPharmacyPage = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'prescriptions', 'history'
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [dispensingRecords, setDispensingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchPatientPharmacyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordRes, rxRes, dispRes] = await Promise.all([
        pharmacyService.getOrders({}),
        pharmacyService.getPrescriptions({}),
        pharmacyService.getDispensingRecords({})
      ]);

      if (ordRes.data?.orders) setOrders(ordRes.data.orders);
      if (rxRes.data?.prescriptions) setPrescriptions(rxRes.data.prescriptions);
      if (dispRes.data?.records) setDispensingRecords(dispRes.data.records);
    } catch (err) {
      console.error('Failed to load patient pharmacy data:', err);
      setError('Could not load your pharmacy information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientPharmacyData();
  }, []);

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'READY_FOR_DISPENSING':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            ★ READY FOR PICKUP
          </span>
        );
      case 'COMPLETED':
      case 'DISPENSED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">DISPENSED / COMPLETED</span>;
      case 'PARTIALLY_FULFILLED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">PARTIALLY FULFILLED</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">IN PREPARATION</span>;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">My Pharmacy & Prescriptions</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track pharmacy pickup status, active doctor prescriptions, and medication history.
          </p>
        </div>

        <button
          onClick={fetchPatientPharmacyData}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-2.5 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'orders'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Pharmacy Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-2.5 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'prescriptions'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Active Prescriptions ({prescriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          Dispensing History & Receipts ({dispensingRecords.length})
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
          Loading your medications...
        </div>
      ) : (
        <div>
          {/* Tab 1: Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-400">
                  You have no pending pharmacy orders.
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.pharmacyOrderId}
                    className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <span>Order #{ord.pharmacyOrderId}</span>
                          {getOrderStatusBadge(ord.status)}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Prescription: {ord.prescriptionId} • Doctor: {ord.doctorName || 'Hospital Physician'}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        Requested: {new Date(ord.requestedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-1.5">Medications in this order:</div>
                      <div className="space-y-1">
                        {ord.items?.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs py-1 px-2.5 bg-slate-50 rounded">
                            <span className="font-medium text-slate-900">{it.medicineName}</span>
                            <span className="font-bold text-slate-700">{it.prescribedQuantity} {it.unit || 'units'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {ord.status === 'READY_FOR_DISPENSING' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>
                          Your order is packed and ready for pickup at Main Outpatient Pharmacy Counter #3.
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Prescriptions */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              {prescriptions.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-400">
                  No active prescriptions found.
                </div>
              ) : (
                prescriptions.map((rx) => (
                  <div
                    key={rx.prescriptionId}
                    className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="text-base font-bold text-slate-900">Rx #{rx.prescriptionId}</div>
                        <div className="text-xs text-slate-500">
                          Prescribed by {rx.doctorName || 'Doctor'} on {new Date(rx.prescriptionDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="px-2.5 py-0.5 font-semibold rounded-full bg-indigo-50 text-indigo-700">
                          {rx.status}
                        </span>
                      </div>
                    </div>

                    {rx.diagnosis && (
                      <div className="text-xs text-slate-700">
                        <span className="font-semibold text-slate-500">Diagnosis:</span> {rx.diagnosis}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {rx.items?.map((it, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-0.5">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{it.medicineNameSnapshot}</span>
                            <span>Qty: {it.quantity}</span>
                          </div>
                          <div className="text-slate-600">
                            {it.dose} • {it.frequency} for {it.duration}
                          </div>
                          {it.instructions && (
                            <div className="text-[11px] text-indigo-600 font-medium">{it.instructions}</div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Valid through: {new Date(rx.validUntil).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: History & Receipts */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {dispensingRecords.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-400">
                  No dispensing records recorded.
                </div>
              ) : (
                dispensingRecords.map((rec) => (
                  <div
                    key={rec.dispensingRecordId}
                    className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        Dispensing Record #{rec.dispensingRecordId}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Dispensed on {new Date(rec.dispensedAt).toLocaleDateString()} by {rec.pharmacistName}
                      </div>
                      <div className="text-xs font-semibold text-emerald-700 mt-1">
                        Total Amount: ₹{Number(rec.totalAmount || 0).toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedReceipt(rec)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <Receipt className="w-4 h-4" />
                      View & Print Receipt
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">Pharmacy Dispensing Receipt</h3>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs font-mono">
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="font-bold text-sm text-slate-900">HOSPITAL PHARMACY DISPENSARY</div>
                <div className="text-slate-500">Record #{selectedReceipt.dispensingRecordId}</div>
                <div className="text-[10px] text-slate-400">{new Date(selectedReceipt.dispensedAt).toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                <div>Patient: <span className="font-bold">{selectedReceipt.patientName}</span></div>
                <div>Order: {selectedReceipt.pharmacyOrderId} | Rx: {selectedReceipt.prescriptionId}</div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">MEDICATIONS DISPENSED:</div>
                {selectedReceipt.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-0.5">
                    <div>{it.medicineName} x {it.dispensedQuantity}</div>
                    <div className="font-bold">₹{it.totalPrice?.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold">
                <span>TOTAL:</span>
                <span className="text-emerald-700">₹{selectedReceipt.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Download / Print
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPharmacyPage;
