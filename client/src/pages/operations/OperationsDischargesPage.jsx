import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  Activity,
  RefreshCw,
  User,
  Shield,
  ArrowRight,
  Plus,
  X
} from 'lucide-react';
import dischargeService from '../../services/dischargeService';

export const OperationsDischargesPage = () => {
  const navigate = useNavigate();
  const [discharges, setDischarges] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    pendingDischarges: 0,
    pendingBilling: 0,
    pendingPayment: 0,
    pendingInsurance: 0,
    pendingServices: 0,
    completedToday: 0,
    cancelledToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('QUEUE'); // 'QUEUE' | 'REQUESTS'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false);
  const [initiateForm, setInitiateForm] = useState({
    admissionId: '',
    dischargeType: 'PLANNED',
    notes: ''
  });
  const [initiateLoading, setInitiateLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [statsRes, disRes, reqRes] = await Promise.all([
        dischargeService.getDischargeStats().catch(() => ({ data: {} })),
        dischargeService.getDischarges({
          search,
          status: statusFilter,
          paymentStatus: paymentFilter
        }).catch(() => ({ data: [] })),
        dischargeService.getDischargeRequests({ status: 'REQUESTED' }).catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data || {});
      setDischarges(disRes.data || []);
      setRequests(reqRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load discharges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, paymentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleInitiateDirect = async (e) => {
    e.preventDefault();
    if (!initiateForm.admissionId) return;
    setInitiateLoading(true);
    setErrorMsg('');
    try {
      const res = await dischargeService.initiateDischarge(initiateForm);
      setIsInitiateModalOpen(false);
      setInitiateForm({ admissionId: '', dischargeType: 'PLANNED', notes: '' });
      navigate(`/operations/discharges/${res.data.dischargeNumber}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate discharge.');
    } finally {
      setInitiateLoading(false);
    }
  };

  const handleProcessRequest = async (requestId) => {
    try {
      const res = await dischargeService.initiateDischarge({ dischargeRequestId: requestId });
      navigate(`/operations/discharges/${res.data.dischargeNumber}`);
    } catch (err) {
      alert(err.message || 'Failed to process discharge request.');
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
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const map = {
      PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      UNPAID: 'bg-rose-50 text-rose-700 border-rose-200',
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      PARTIALLY_PAID: 'bg-blue-50 text-blue-700 border-blue-200',
      WAIVED: 'bg-slate-50 text-slate-700 border-slate-200'
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${map[status] || 'bg-gray-50 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <LogOut className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Discharge Processing Center</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Coordinate clinical clearances, pending services, final billing reconciliation, bed release & patient exit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsInitiateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Initiate Discharge
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Active Queue</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.pendingDischarges || 0}</p>
          <span className="text-xs text-slate-500">In administrative pipeline</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Services</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-700">{stats.pendingServices || 0}</p>
          <span className="text-xs text-slate-500">Lab / Rad / Pharm items</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Payment</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.pendingPayment || 0}</p>
          <span className="text-xs text-slate-500">Awaiting bill settlement</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Completed Today</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.completedToday || 0}</p>
          <span className="text-xs text-slate-500">Beds released & cleared</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 px-6 pt-4 gap-6">
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'QUEUE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Active Discharge Queue ({discharges.length})
          </button>
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'REQUESTS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Clinical Discharge Orders ({requests.length})
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Discharge #, Patient, Admission..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="text-slate-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="REQUESTED">REQUESTED</option>
                <option value="PENDING_SERVICES">PENDING SERVICES</option>
                <option value="PENDING_BILLING">PENDING BILLING</option>
                <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                <option value="READY_FOR_DISCHARGE">READY FOR DISCHARGE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Payment States</option>
              <option value="UNPAID">UNPAID</option>
              <option value="PAID">PAID</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        {activeTab === 'QUEUE' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Discharge ID</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Admission / Bed</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Pending Items</th>
                  <th className="px-6 py-3">Financials</th>
                  <th className="px-6 py-3">Payment</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discharges.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                      No discharge records matching selected filters.
                    </td>
                  </tr>
                ) : (
                  discharges.map((dis) => (
                    <tr key={dis._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-indigo-600">
                        <Link to={`/operations/discharges/${dis.dischargeNumber}`} className="hover:underline">
                          {dis.dischargeNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{dis.patientName}</div>
                        <div className="text-xs text-slate-400">ID: {dis.patientId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{dis.admissionId}</div>
                        <div className="text-xs text-slate-500">
                          {dis.assignedWardName || 'Ward'} • Bed: {dis.assignedBedNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(dis.status)}</td>
                      <td className="px-6 py-4">
                        {dis.pendingItems && dis.pendingItems.length > 0 ? (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 font-semibold rounded-full">
                            {dis.pendingItems.length} item(s) pending
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <CheckCircle className="text-emerald-500 w-3.5 h-3.5" /> Clear
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">₹{dis.payableAmount || 0}</div>
                        <div className="text-xs text-slate-400">Gross: ₹{dis.grossAmount || 0}</div>
                      </td>
                      <td className="px-6 py-4">{getPaymentBadge(dis.paymentStatus)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/operations/discharges/${dis.dischargeNumber}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium text-xs rounded-lg transition"
                        >
                          Manage <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Clinical Orders Tab */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Admission</th>
                  <th className="px-6 py-3">Requesting Doctor</th>
                  <th className="px-6 py-3">Clinical Decision / Notes</th>
                  <th className="px-6 py-3">Requested At</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No pending clinical discharge orders awaiting initiation.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{req.requestId}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{req.patientName}</div>
                        <div className="text-xs text-slate-400">{req.patientId}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{req.admissionId}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{req.doctorName || 'Doctor'}</div>
                        <div className="text-xs text-slate-400">Role: {req.requestedByRole}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-600">
                        {req.clinicalDecisionReference}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(req.requestedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleProcessRequest(req.requestId)}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                        >
                          Process Discharge
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Initiate Direct Discharge */}
      {isInitiateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <LogOut className="text-indigo-600 w-5 h-5" /> Initiate Discharge
              </h3>
              <button
                onClick={() => setIsInitiateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="shrink-0 w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleInitiateDirect} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Admission ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ADM10023"
                  value={initiateForm.admissionId}
                  onChange={(e) => setInitiateForm({ ...initiateForm, admissionId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Discharge Type
                </label>
                <select
                  value={initiateForm.dischargeType}
                  onChange={(e) => setInitiateForm({ ...initiateForm, dischargeType: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="PLANNED">Planned Discharge</option>
                  <option value="EMERGENCY">Emergency / Administrative</option>
                  <option value="TRANSFER_OUT">Transfer-Out Discharge</option>
                  <option value="OTHER">Other Configured</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Clinical Notes / Reference
                </label>
                <textarea
                  rows="3"
                  placeholder="Reference authorized medical clearance notes..."
                  value={initiateForm.notes}
                  onChange={(e) => setInitiateForm({ ...initiateForm, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInitiateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={initiateLoading}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  {initiateLoading && <RefreshCw className="animate-spin w-4 h-4" />}
                  Confirm & Initiate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsDischargesPage;
