import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  FileText,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Download,
  QrCode,
  Lock,
  ArrowRight,
  Receipt,
  X
} from 'lucide-react';
import { billingService } from '../../services/billingService';
import { useAuth } from '../../context/AuthContext';

export const PatientBillsPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);

  // Checkout payment session state
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI'); // UPI, CARD, NET_BANKING

  // Query Form
  const [queryForm, setQueryForm] = useState({
    category: 'CHARGE_CLARIFICATION',
    description: ''
  });

  useEffect(() => {
    loadPatientInvoices();
  }, [user]);

  const loadPatientInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const patientId = user?.patientId || user?.profile?.patientId || user?.userId;
      const res = await billingService.getInvoices({ patientId });
      setInvoices(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve your billing records.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenCheckout = async (invoice) => {
    setSelectedInvoice(invoice);
    setShowCheckoutModal(true);
    setCheckoutLoading(true);
    try {
      const res = await billingService.createPaymentSession({
        invoiceId: invoice.invoiceId,
        amount: invoice.outstandingBalance || invoice.payableAmount,
        paymentMethod: 'ONLINE_GATEWAY'
      });
      setCheckoutSession(res.data);
    } catch (err) {
      alert(err.message || 'Failed to initialize payment checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSimulatePaymentCompletion = async () => {
    if (!checkoutSession) return;
    setCheckoutLoading(true);
    try {
      const txId = checkoutSession.transactionId || checkoutSession.sessionId;
      const res = await billingService.verifyPayment({
        transactionId: txId,
        status: 'SUCCESS',
        signature: `SIG_VERIFIED_${Date.now()}`
      });

      showToast('Payment successful! Your official hospital receipt has been generated.');
      setShowCheckoutModal(false);
      setCheckoutSession(null);
      loadPatientInvoices();
    } catch (err) {
      alert(err.message || 'Payment verification failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await billingService.createQuery({
        invoiceId: selectedInvoice.invoiceId,
        patientId: selectedInvoice.patientId,
        patientName: user?.username || 'Patient',
        category: queryForm.category,
        description: queryForm.description
      });

      showToast('Your inquiry has been submitted to the hospital billing desk.');
      setShowQueryModal(false);
      setQueryForm({ category: 'CHARGE_CLARIFICATION', description: '' });
      loadPatientInvoices();
    } catch (err) {
      alert(err.message || 'Failed to submit billing dispute.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl shadow-emerald-900/30 border border-emerald-500/50 backdrop-blur-md">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10">
          <div className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Patient Financial Care &bull; Secure Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            My Invoices &amp; Payments
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Inspect itemized charges, settled payments, advance deposits and make secure online digital settlements.
          </p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Invoices on File</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              You do not have any pending or historical hospital invoices under your patient ID at this time.
            </p>
          </div>
        ) : (
          invoices.map(inv => {
            const isSettled = inv.status === 'PAID';
            const hasBalance = (inv.outstandingBalance || 0) > 0;

            return (
              <div
                key={inv.invoiceId}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-indigo-300">{inv.invoiceId}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isSettled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Date: {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()} &bull;{' '}
                      {inv.admissionId ? `Admission: ${inv.admissionId}` : 'Outpatient'}
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Payable</div>
                    <div className="text-xl font-extrabold text-white">₹{(inv.payableAmount || 0).toLocaleString()}</div>
                    {hasBalance && (
                      <div className="text-xs text-amber-400 font-semibold mt-0.5">
                        Balance Due: ₹{inv.outstandingBalance.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Line Items Preview */}
                <div className="py-4">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Itemized Services:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(inv.items || []).slice(0, 4).map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-slate-300 truncate max-w-[200px]">{it.description}</span>
                        <span className="font-semibold text-white">₹{(it.totalPrice || it.grossAmount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                    {(inv.items || []).length > 4 && (
                      <div className="text-[11px] text-indigo-400 p-2 text-center col-span-full">
                        + {(inv.items || []).length - 4} more item(s) on detailed statement
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap justify-between items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setShowQueryModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    Have questions about this bill?
                  </button>

                  <div className="flex items-center gap-3">
                    {hasBalance && (
                      <button
                        onClick={() => handleOpenCheckout(inv)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay Now (₹{inv.outstandingBalance.toLocaleString()})
                      </button>
                    )}

                    {isSettled && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 bg-emerald-950/80 rounded-xl border border-emerald-800/50">
                        <CheckCircle className="w-4 h-4" />
                        Fully Settled &bull; Receipts Issued
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Secure Payment Gateway</h3>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Payable Balance</span>
              <span className="text-3xl font-black text-emerald-400 mt-1 block">
                ₹{(selectedInvoice.outstandingBalance || selectedInvoice.payableAmount).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono mt-1 block">
                Invoice #{selectedInvoice.invoiceId}
              </span>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-300">Choose Payment Method:</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI QR', icon: QrCode },
                  { id: 'CARD', label: 'Debit/Credit', icon: CreditCard },
                  { id: 'NET_BANKING', label: 'Net Banking', icon: FileText }
                ].map(m => {
                  const Icon = m.icon;
                  const isSel = selectedPaymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                        isSel
                          ? 'border-indigo-500 bg-indigo-600/10 text-white font-bold'
                          : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSel ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedPaymentMethod === 'UPI' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                  <div className="w-28 h-28 bg-white mx-auto p-2 rounded-lg flex items-center justify-center shadow-inner">
                    <QrCode className="w-24 h-24 text-slate-900" />
                  </div>
                  <p className="text-[11px] text-slate-400">Scan using any UPI App (GPay, PhonePe, Paytm)</p>
                </div>
              )}

              {selectedPaymentMethod === 'CARD' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <input
                    type="text"
                    placeholder="Card Number (4111 2222 3333 4444)"
                    defaultValue="4111 2222 3333 4444"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      defaultValue="12/28"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      defaultValue="123"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                    />
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'NET_BANKING' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
                  Popular Banks: HDFC, SBI, ICICI, Axis Bank (Redirect gateway authorized).
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleSimulatePaymentCompletion}
                  disabled={checkoutLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Authorize &amp; Complete Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISPUTE / QUERY MODAL */}
      {showQueryModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Ask Billing Desk</h3>
              <button onClick={() => setShowQueryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Submit an inquiry or dispute regarding invoice <span className="font-mono text-indigo-300 font-semibold">{selectedInvoice.invoiceId}</span>. The hospital finance desk will review and respond.
            </p>
            <form onSubmit={handleSubmitQuery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Inquiry Category</label>
                <select
                  value={queryForm.category}
                  onChange={e => setQueryForm({ ...queryForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                >
                  <option value="CHARGE_CLARIFICATION">Charge Clarification</option>
                  <option value="INSURANCE_DISPUTE">Insurance Coverage Query</option>
                  <option value="DEPOSIT_ISSUE">Deposit Deduction Issue</option>
                  <option value="PAYMENT_ISSUE">Payment Verification Discrepancy</option>
                  <option value="DISCOUNT_QUERY">Discount Request</option>
                  <option value="OTHER">Other Financial Question</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Question *</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Explain your question or concern in detail..."
                  value={queryForm.description}
                  onChange={e => setQueryForm({ ...queryForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowQueryModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold">
                  Send to Billing Desk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientBillsPage;
