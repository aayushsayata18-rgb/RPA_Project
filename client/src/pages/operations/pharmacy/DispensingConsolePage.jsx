import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Search,
  Barcode,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
  Receipt,
  Printer,
  X,
  RefreshCw,
  Clock,
  ArrowRight,
  User,
  Stethoscope,
  Pill,
  ChevronDown
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import pharmacyService from '../../../services/pharmacyService';
import { useAuth } from '../../../context/AuthContext';

export const DispensingConsolePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedOrderId, setSelectedOrderId] = useState(searchParams.get('orderId') || '');
  const [activeOrder, setActiveOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Dispensing Form States
  const [dispenseItems, setDispenseItems] = useState([]);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [notes, setNotes] = useState('');
  const [controlledApproved, setControlledApproved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Receipt Modal upon completion
  const [completedRecord, setCompletedRecord] = useState(null);

  // Batch availability store per medicine
  const [medicineBatches, setMedicineBatches] = useState({});

  const loadOrderDetails = async (orderId) => {
    if (!orderId) return;
    try {
      setLoadingOrder(true);
      setError(null);
      const res = await pharmacyService.getOrderById(orderId);
      const order = res.data?.order;
      setActiveOrder(order);

      // Initialize dispensing items state
      const initialItems = [];
      const batchStore = {};

      for (const it of order.items) {
        // Query stock availability to fetch eligible batches
        const stockRes = await pharmacyService.getAvailability(it.medicineId);
        const availBatches = stockRes.data?.availability?.batches || [];
        batchStore[it.medicineId] = availBatches;

        const defaultBatchId = it.batchReservations?.[0]?.batchId || availBatches[0]?.batchId || '';
        const defaultQty = it.prescribedQuantity - (it.dispensedQuantity || 0);

        initialItems.push({
          prescriptionItemId: it.prescriptionItemId,
          medicineId: it.medicineId,
          medicineName: it.medicineName,
          prescribedQuantity: it.prescribedQuantity,
          dispensedQuantity: Math.max(0, defaultQty),
          inventoryBatchId: defaultBatchId,
          scannedBarcode: '',
          substitution: false,
          originalMedicineId: '',
          substitutionReason: '',
          approvedBy: '',
          unitPrice: it.unitPrice || 0
        });
      }

      setMedicineBatches(batchStore);
      setDispenseItems(initialItems);
    } catch (err) {
      console.error('Failed to load order:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load order details.');
      setActiveOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  };

  useEffect(() => {
    if (selectedOrderId) {
      loadOrderDetails(selectedOrderId);
    }
  }, [selectedOrderId]);

  const handleBarcodeVerify = (itemIndex, barcodeValue) => {
    const updated = [...dispenseItems];
    updated[itemIndex].scannedBarcode = barcodeValue;
    setDispenseItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...dispenseItems];
    updated[index][field] = value;
    setDispenseItems(updated);
  };

  const calculateTotal = () => {
    return dispenseItems.reduce((acc, curr) => {
      const batch = medicineBatches[curr.medicineId]?.find((b) => b.batchId === curr.inventoryBatchId);
      const price = batch?.unitPrice || curr.unitPrice || 0;
      return acc + (curr.dispensedQuantity || 0) * price;
    }, 0);
  };

  const handlePrepareSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // Validate that each item has a selected batch and valid quantity
    for (let i = 0; i < dispenseItems.length; i++) {
      const it = dispenseItems[i];
      if (it.dispensedQuantity > 0 && !it.inventoryBatchId) {
        setError(`Please select an inventory batch for ${it.medicineName}.`);
        return;
      }
      if (it.substitution && (!it.substitutionReason || !it.approvedBy)) {
        setError(`Substitution for ${it.medicineName} requires an approval name and reason.`);
        return;
      }
    }

    setIsConfirmModalOpen(true);
  };

  const handleFinalDispense = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setIsConfirmModalOpen(false);

      const payload = {
        pharmacyOrderId: activeOrder.pharmacyOrderId,
        pharmacistId: user?.userId || 'PHARM001',
        pharmacistName: user?.name || user?.username || 'Attending Pharmacist (RPh)',
        items: dispenseItems,
        notes,
        controlledMedicineApproval: controlledApproved
      };

      const res = await pharmacyService.dispense(payload);
      const record = res.data?.record;
      setCompletedRecord(record);
      setSuccessMsg(`Dispensing completed successfully. Record ID: ${record.dispensingRecordId}`);

      // Refresh order state
      loadOrderDetails(activeOrder.pharmacyOrderId);
    } catch (err) {
      console.error('Dispensing error:', err);
      setError(err.response?.data?.message || err.message || 'Dispensing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Dispensing Console</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time barcode verification, batch FEFO selection, controlled medicine authorization, and auto-billing.
          </p>
        </div>

        <button
          onClick={() => navigate('/operations/pharmacy/orders')}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          &larr; Back to Orders Queue
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
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

      {/* Order Selector Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
            Order Lookup:
          </label>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              placeholder="e.g. PO40021 or PO-202610-00001"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
          <button
            onClick={() => loadOrderDetails(selectedOrderId)}
            disabled={loadingOrder || !selectedOrderId}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition-all"
          >
            {loadingOrder ? 'Loading...' : 'Load Order'}
          </button>
        </div>

        {activeOrder && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">Order Status:</span>
            <span className="px-2.5 py-0.5 font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {activeOrder.status}
            </span>
            <span className="px-2.5 py-0.5 font-bold rounded-full bg-indigo-100 text-indigo-800">
              {activeOrder.orderType}
            </span>
          </div>
        )}
      </div>

      {/* Active Order Details & Dispensing Form */}
      {activeOrder ? (
        <form onSubmit={handlePrepareSubmit} className="space-y-6">
          {/* Patient & Prescription Banner */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-md grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Patient Details</div>
              <div className="text-base font-bold text-white mt-0.5">{activeOrder.patientName || activeOrder.patientId}</div>
              <div className="text-slate-400 font-mono">{activeOrder.patientId}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Attending Doctor</div>
              <div className="text-sm font-semibold text-slate-200 mt-0.5">{activeOrder.doctorName || activeOrder.doctorId}</div>
              <div className="text-slate-400 font-mono">Rx: {activeOrder.prescriptionId}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Fulfillment Type & Priority</div>
              <div className="text-sm font-semibold text-emerald-400 mt-0.5">{activeOrder.orderType}</div>
              <div className="text-amber-400 font-semibold">{activeOrder.priority} Priority</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Requested Time</div>
              <div className="text-sm font-medium text-slate-200 mt-0.5">
                {new Date(activeOrder.requestedAt).toLocaleDateString()}
              </div>
              <div className="text-slate-400 font-mono">
                {new Date(activeOrder.requestedAt).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Prescribed Items & Batch Verification Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Prescribed Medications to Dispense</h3>
              </div>
              <span className="text-xs text-slate-500">
                FEFO Batch Priority Enforced • Scan barcode to verify
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Medication & Strength</th>
                    <th className="py-3 px-4">Prescribed</th>
                    <th className="py-3 px-4">Barcode Verification</th>
                    <th className="py-3 px-4">Select Batch (FEFO)</th>
                    <th className="py-3 px-4">Dispense Qty</th>
                    <th className="py-3 px-4 text-right">Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dispenseItems.map((item, idx) => {
                    const availableBatches = medicineBatches[item.medicineId] || [];
                    const selectedBatch = availableBatches.find((b) => b.batchId === item.inventoryBatchId);
                    const unitPrice = selectedBatch?.unitPrice || item.unitPrice || 0;
                    const lineTotal = (item.dispensedQuantity || 0) * unitPrice;

                    return (
                      <tr key={item.prescriptionItemId || idx} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.medicineName}</div>
                          <div className="text-xs text-slate-400 font-mono">{item.medicineId}</div>
                          {item.substitution && (
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              SUBSTITUTION ACTIVE
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {item.prescribedQuantity} <span className="text-xs text-slate-500 font-normal">units</span>
                        </td>

                        {/* Barcode Verification Field */}
                        <td className="py-3 px-4">
                          <div className="relative w-44">
                            <Barcode className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                              type="text"
                              value={item.scannedBarcode}
                              onChange={(e) => handleBarcodeVerify(idx, e.target.value)}
                              placeholder="Scan / Barcode"
                              className="w-full pl-8 pr-2 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </td>

                        {/* Batch Selection Dropdown */}
                        <td className="py-3 px-4">
                          <select
                            value={item.inventoryBatchId}
                            onChange={(e) => handleItemChange(idx, 'inventoryBatchId', e.target.value)}
                            className="w-56 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500"
                          >
                            {availableBatches.length === 0 ? (
                              <option value="">No stock in batches!</option>
                            ) : (
                              availableBatches.map((b, bIdx) => (
                                <option key={b.batchId} value={b.batchId}>
                                  {b.batchId} (Avail: {b.availableQuantity}) — Exp: {new Date(b.expiryDate).toISOString().slice(0, 10)} {bIdx === 0 ? '★ FEFO' : ''}
                                </option>
                              ))
                            )}
                          </select>
                        </td>

                        {/* Dispense Quantity Input */}
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            max={item.prescribedQuantity}
                            value={item.dispensedQuantity}
                            onChange={(e) => handleItemChange(idx, 'dispensedQuantity', parseInt(e.target.value, 10) || 0)}
                            className="w-20 px-2 py-1 text-sm font-bold text-slate-900 border border-slate-300 rounded-lg text-center focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ₹{lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Substitution & Controlled Medicine Approvals Box */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-slate-800">Controlled Substance Authorization</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={controlledApproved}
                    onChange={(e) => setControlledApproved(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Authorize dispensing of controlled substances (tramadol, opioids)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pharmacist Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional instructions or clinical dispensing notes..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Grand Total Bar */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Billing policy: Factual dispensed quantities are automatically posted to Billing module upon submit.
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-700">Estimated Total:</span>
                <span className="text-2xl font-extrabold text-emerald-700">₹{calculateTotal().toFixed(2)}</span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 shadow-md transition-all hover:scale-[1.02]"
                >
                  Confirm & Dispense
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-sm text-slate-400">
          <PackageCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-700">No Order Loaded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Please enter a Pharmacy Order ID above or select an order from the Orders Queue to begin dispensing.
          </p>
        </div>
      )}

      {/* Confirmation Dialog Modal (Section 32) */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-lg">Confirm Dispensing</h3>
              </div>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <div><span className="font-semibold text-slate-700">Patient:</span> {activeOrder.patientName} ({activeOrder.patientId})</div>
                <div><span className="font-semibold text-slate-700">Prescription:</span> {activeOrder.prescriptionId}</div>
                <div><span className="font-semibold text-slate-700">Order ID:</span> {activeOrder.pharmacyOrderId}</div>
                <div><span className="font-semibold text-slate-700">Pharmacist:</span> {user?.name || user?.username || 'Attending Pharmacist'}</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-slate-800">Items to be Dispensed:</div>
                {dispenseItems.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                    <span>{it.medicineName} (Batch: {it.inventoryBatchId})</span>
                    <span className="font-bold text-slate-800">{it.dispensedQuantity} units</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                <span>Total Billing Amount:</span>
                <span className="text-emerald-700">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleFinalDispense}
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                {submitting ? 'Dispensing...' : 'Authorize & Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Dispensing Receipt Modal */}
      {completedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-lg">Dispensing Receipt</h3>
              </div>
              <button onClick={() => setCompletedRecord(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div id="dispensing-receipt" className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs font-mono">
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="font-bold text-sm text-slate-900">HOSPITAL PHARMACY DISPENSARY</div>
                <div className="text-slate-500">Record #{completedRecord.dispensingRecordId}</div>
                <div className="text-[10px] text-slate-400">{new Date(completedRecord.dispensedAt).toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                <div>Patient: <span className="font-bold">{completedRecord.patientName}</span> ({completedRecord.patientId})</div>
                <div>Order: {completedRecord.pharmacyOrderId} | Rx: {completedRecord.prescriptionId}</div>
                <div>Pharmacist: {completedRecord.pharmacistName}</div>
                {completedRecord.billingReferenceId && <div>Billing Charge ID: {completedRecord.billingReferenceId}</div>}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-800 pb-1">DISPENSED ITEMS:</div>
                {completedRecord.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-0.5">
                    <div>{it.medicineName} (x{it.dispensedQuantity}) [Batch: {it.inventoryBatchId}]</div>
                    <div className="font-bold">₹{it.totalPrice.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold">
                <span>TOTAL CHARGED:</span>
                <span className="text-emerald-700">₹{completedRecord.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setCompletedRecord(null)}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispensingConsolePage;
