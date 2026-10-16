import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Plus, 
  Filter, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/common/Modal';
import laboratoryService from '../../../services/laboratoryService';

export const LabOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  
  // Available Tests for Order Modal
  const [tests, setTests] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);

  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    doctorId: 'DOC-LAB-01',
    doctorName: 'Dr. Sarah Jenkins',
    priority: 'ROUTINE',
    orderType: 'OUTPATIENT',
    clinicalNotes: '',
    fastingConfirmed: false,
    selectedTestIds: []
  });

  useEffect(() => {
    fetchOrders();
  }, [status, priority]);

  useEffect(() => {
    if (showCreateModal) {
      loadCatalog();
    }
  }, [showCreateModal]);

  const loadCatalog = async () => {
    try {
      const res = await laboratoryService.listTests({ status: 'ACTIVE', limit: 100 });
      if (res.success) {
        setTests(res.data);
      }
    } catch (err) {
      console.error('Failed to load tests catalog:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.listOrders({
        query: search,
        status,
        priority,
        limit: 100
      });
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleTestSelection = async (testId) => {
    const nextSelected = formData.selectedTestIds.includes(testId)
      ? formData.selectedTestIds.filter(id => id !== testId)
      : [...formData.selectedTestIds, testId];

    setFormData(prev => ({ ...prev, selectedTestIds: nextSelected }));

    // Run duplicate check if patientId is provided and test is selected
    if (formData.patientId && nextSelected.length > 0) {
      checkForDuplicates(formData.patientId, nextSelected);
    } else {
      setDuplicateWarning(null);
    }
  };

  const checkForDuplicates = async (patId, testIds) => {
    try {
      setDuplicateChecking(true);
      const res = await laboratoryService.checkDuplicateOrder({
        patientId: patId,
        testIds
      });
      if (res.success && res.duplicates && res.duplicates.length > 0) {
        setDuplicateWarning(res.duplicates);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error('Duplicate check error:', err);
    } finally {
      setDuplicateChecking(false);
    }
  };

  const handlePatientIdChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, patientId: val }));
    if (val && formData.selectedTestIds.length > 0) {
      checkForDuplicates(val, formData.selectedTestIds);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (formData.selectedTestIds.length === 0) {
      alert('Please select at least one laboratory test.');
      return;
    }
    if (!formData.patientId || !formData.patientName) {
      alert('Please fill in patient ID and name.');
      return;
    }

    try {
      setCreating(true);
      const payload = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        doctorId: formData.doctorId,
        doctorName: formData.doctorName,
        priority: formData.priority,
        orderType: formData.orderType,
        clinicalNotes: formData.clinicalNotes,
        fastingConfirmed: formData.fastingConfirmed,
        items: formData.selectedTestIds.map(labTestId => ({ labTestId }))
      };

      const res = await laboratoryService.createOrder(payload);
      if (res.success) {
        setShowCreateModal(false);
        setFormData({
          patientId: '',
          patientName: '',
          doctorId: 'DOC-LAB-01',
          doctorName: 'Dr. Sarah Jenkins',
          priority: 'ROUTINE',
          orderType: 'OUTPATIENT',
          clinicalNotes: '',
          fastingConfirmed: false,
          selectedTestIds: []
        });
        setDuplicateWarning(null);
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create laboratory order');
    } finally {
      setCreating(false);
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'STAT':
        return <span className="badge badge-error animate-pulse font-bold">STAT</span>;
      case 'URGENT':
        return <span className="badge badge-warning font-semibold">URGENT</span>;
      default:
        return <span className="badge badge-info">ROUTINE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            Laboratory Orders
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track diagnostic requests, check 72h duplication safeguards, and monitor processing states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchOrders}
            className="btn btn-secondary flex items-center gap-2"
            title="Refresh Orders"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Lab Order
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="card p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Patient Name, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-full"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input w-full"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ORDERED">Ordered</option>
              <option value="SAMPLE_COLLECTED">Sample Collected</option>
              <option value="SAMPLE_RECEIVED">Sample Received</option>
              <option value="IN_PROCESS">In Process</option>
              <option value="RESULTS_ENTERED">Results Entered</option>
              <option value="VERIFIED">Verified</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="input w-full"
            >
              <option value="">All Priorities</option>
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="STAT">STAT (Immediate)</option>
            </select>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Priority</th>
                <th>Order Type</th>
                <th>Tests Ordered</th>
                <th>Status</th>
                <th>Ordered At</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-500" />
                    Loading laboratory orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500">
                    No laboratory orders found matching criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.labOrderId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="font-semibold text-primary-600 dark:text-primary-400">
                      {order.labOrderId}
                    </td>
                    <td>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {order.patientName}
                      </div>
                      <div className="text-xs text-gray-500">ID: {order.patientId}</div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-800 dark:text-gray-200">{order.doctorName}</div>
                      <div className="text-xs text-gray-500">{order.doctorId}</div>
                    </td>
                    <td>{getPriorityBadge(order.priority)}</td>
                    <td>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {order.orderType}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm font-medium">
                        {order.items?.length || 0} Test{order.items?.length === 1 ? '' : 's'}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {order.items?.map(it => it.testCode).join(', ')}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => navigate(`/operations/laboratory/orders/${order.labOrderId}`)}
                        className="btn btn-secondary btn-sm flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Lab Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Laboratory Order"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-5">
          {/* Duplicate Order Warning Callout */}
          {duplicateWarning && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                  Possible Duplicate Lab Order Detected!
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  The following test(s) were already ordered for this patient in the last 72 hours:
                </p>
                <div className="mt-2 space-y-1">
                  {duplicateWarning.map((dup, i) => (
                    <div key={i} className="text-xs font-mono text-amber-800 dark:text-amber-200">
                      • {dup.testCode} (Order: {dup.labOrderId}, Status: {dup.status}, Ordered: {new Date(dup.orderedAt).toLocaleString()})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Patient and Doctor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Patient ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. PAT-10001"
                value={formData.patientId}
                onChange={handlePatientIdChange}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Patient Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="label">Ordering Doctor ID</label>
              <input
                type="text"
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Ordering Doctor Name</label>
              <input
                type="text"
                value={formData.doctorName}
                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          {/* Priority & Order Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Priority Level *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input w-full font-medium"
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent (Priority processing)</option>
                <option value="STAT">STAT (Immediate emergency)</option>
              </select>
            </div>

            <div>
              <label className="label">Order Type</label>
              <select
                value={formData.orderType}
                onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                className="input w-full"
              >
                <option value="OUTPATIENT">Outpatient</option>
                <option value="INPATIENT">Inpatient</option>
                <option value="EMERGENCY">Emergency Department</option>
                <option value="EXTERNAL">External Referral</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.fastingConfirmed}
                  onChange={(e) => setFormData({ ...formData, fastingConfirmed: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fasting Confirmed with Patient
                </span>
              </label>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="label">Clinical Notes / Diagnosis Reason</label>
            <textarea
              rows="2"
              placeholder="e.g. Routine pre-op screening, suspected iron deficiency, diabetes followup..."
              value={formData.clinicalNotes}
              onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
              className="input w-full"
            />
          </div>

          {/* Test Catalog Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label font-bold text-gray-800 dark:text-gray-200">
                Select Diagnostic Tests ({formData.selectedTestIds.length} selected) *
              </label>
              {duplicateChecking && (
                <span className="text-xs text-primary-600 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Checking 72h duplicates...
                </span>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {tests.length === 0 ? (
                <div className="col-span-2 text-center py-4 text-xs text-gray-400">
                  No active tests available in laboratory master catalog.
                </div>
              ) : (
                tests.map((test) => {
                  const isChecked = formData.selectedTestIds.includes(test.labTestId);
                  return (
                    <div
                      key={test.labTestId}
                      onClick={() => handleTestSelection(test.labTestId)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start gap-2.5 ${
                        isChecked 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Controlled by outer div
                        className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                            {test.code}
                          </span>
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">
                            ${test.priceReference}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {test.name}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                          <span>{test.category}</span>
                          <span>•</span>
                          <span>{test.specimenType}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || formData.selectedTestIds.length === 0}
              className="btn btn-primary flex items-center gap-2"
            >
              {creating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                'Place Order & Accession'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LabOrders;
