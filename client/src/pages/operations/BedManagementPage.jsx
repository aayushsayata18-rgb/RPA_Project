import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bedService } from '../../services/bedService';
import {
  BedDouble,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Wrench,
  Ban,
  ArrowRightLeft,
  User,
  Activity,
  ShieldAlert,
  Building,
  Check,
  X,
  Eye,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const BedManagementPage = () => {
  const { user, hasRole } = useAuth();

  // Primary State
  const [activeTab, setActiveTab] = useState('bed-map'); // 'bed-map', 'search-inventory', 'housekeeping', 'reservations', 'wards-master'
  const [metrics, setMetrics] = useState(null);
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [filterWard, setFilterWard] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedBed, setSelectedBed] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('AVAILABLE');
  const [statusReason, setStatusReason] = useState('');

  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    patientId: '',
    patientName: '',
    durationMinutes: 60,
    reservationReason: 'INITIAL_ADMISSION'
  });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    patientId: '',
    patientName: '',
    admissionId: '',
    assignmentType: 'INITIAL_ADMISSION'
  });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    patientId: '',
    admissionId: '',
    toBedId: '',
    reason: ''
  });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [bedHistory, setBedHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // New Ward / Category Modal
  const [showNewWardModal, setShowNewWardModal] = useState(false);
  const [wardForm, setWardForm] = useState({
    wardId: '',
    wardName: '',
    wardType: 'GENERAL_WARD',
    floor: '1st Floor',
    wing: 'North Wing',
    genderPolicy: 'ANY',
    baseRatePerDay: 1500,
    nurseInCharge: ''
  });

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, bedsRes, wardsRes, roomsRes, catsRes, hkRes, resRes] = await Promise.all([
        bedService.getAvailabilityDashboard(),
        bedService.getBeds(),
        bedService.getWards(),
        bedService.getRooms(),
        bedService.getCategories(),
        bedService.getHousekeepingTasks(),
        bedService.getReservations({ status: 'ACTIVE' })
      ]);

      if (dashRes.data?.data) setMetrics(dashRes.data.data.summary);
      if (bedsRes.data?.data) setBeds(bedsRes.data.data);
      if (wardsRes.data?.data) setWards(wardsRes.data.data);
      if (roomsRes.data?.data) setRooms(roomsRes.data.data);
      if (catsRes.data?.data) setCategories(catsRes.data.data);
      if (hkRes.data?.data) setHousekeepingTasks(hkRes.data.data);
      if (resRes.data?.data) setReservations(resRes.data.data);
    } catch (err) {
      console.error('Failed to load bed management data:', err);
      setError('Unable to load real-time bed inventory. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Status Badge Colors & Icons Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: 'rgba(34, 197, 94, 0.15)',
          border: '#22c55e',
          text: '#4ade80',
          label: 'Available',
          icon: CheckCircle2
        };
      case 'RESERVED':
        return {
          bg: 'rgba(234, 179, 8, 0.15)',
          border: '#eab308',
          text: '#facc15',
          label: 'Reserved Hold',
          icon: Clock
        };
      case 'OCCUPIED':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          border: '#38bdf8',
          text: '#38bdf8',
          label: 'Occupied',
          icon: User
        };
      case 'CLEANING_REQUIRED':
      case 'CLEANING':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          border: '#a855f7',
          text: '#c084fc',
          label: 'Cleaning Req.',
          icon: Sparkles
        };
      case 'MAINTENANCE':
        return {
          bg: 'rgba(249, 115, 22, 0.15)',
          border: '#f97316',
          text: '#fb923c',
          label: 'Maintenance',
          icon: Wrench
        };
      case 'BLOCKED':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: '#ef4444',
          text: '#f87171',
          label: 'Admin Blocked',
          icon: Ban
        };
      case 'OUT_OF_SERVICE':
        return {
          bg: 'rgba(100, 116, 139, 0.2)',
          border: '#64748b',
          text: '#94a3b8',
          label: 'Out of Service',
          icon: ShieldAlert
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: 'var(--border-color)',
          text: 'var(--text-secondary)',
          label: status,
          icon: Activity
        };
    }
  };

  // Filtered beds
  const filteredBeds = beds.filter((b) => {
    if (filterWard !== 'ALL' && b.wardId !== filterWard) return false;
    if (filterCategory !== 'ALL' && b.bedType !== filterCategory) return false;
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'CLEANING' && (b.status === 'CLEANING' || b.status === 'CLEANING_REQUIRED')) {
        // match
      } else if (b.status !== filterStatus) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = b.bedNumber?.toLowerCase().includes(q);
      const matchId = b.bedId?.toLowerCase().includes(q);
      const matchPatient = b.currentPatientName?.toLowerCase().includes(q) || b.currentPatientId?.toLowerCase().includes(q);
      const matchWard = b.wardName?.toLowerCase().includes(q);
      if (!matchNumber && !matchId && !matchPatient && !matchWard) return false;
    }
    return true;
  });

  // Group beds by Ward for Bed Map View
  const bedsByWard = wards.map((w) => {
    const wardBeds = filteredBeds.filter((b) => b.wardId === w.wardId);
    return {
      ...w,
      beds: wardBeds
    };
  });

  // Status Change Submission
  const handleStatusChangeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBed) return;
    try {
      await bedService.updateBedStatus(selectedBed.bedId, {
        status: newStatus,
        reason: statusReason
      });
      showNotification(`Bed ${selectedBed.bedNumber} status updated to ${newStatus}.`);
      setShowStatusModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to update bed status');
    }
  };

  // Reserve Bed Submission
  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBed || !reserveForm.patientId) return;
    try {
      await bedService.reserveBed({
        bedId: selectedBed.bedId,
        patientId: reserveForm.patientId,
        patientName: reserveForm.patientName,
        durationMinutes: Number(reserveForm.durationMinutes) || 60,
        reservationReason: reserveForm.reservationReason
      });
      showNotification(`Bed ${selectedBed.bedNumber} reserved successfully.`);
      setShowReserveModal(false);
      setReserveForm({ patientId: '', patientName: '', durationMinutes: 60, reservationReason: 'INITIAL_ADMISSION' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Reservation failed');
    }
  };

  // Direct Assign Bed Submission
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBed || !assignForm.patientId || !assignForm.admissionId) return;
    try {
      await bedService.assignBed({
        bedId: selectedBed.bedId,
        patientId: assignForm.patientId,
        patientName: assignForm.patientName,
        admissionId: assignForm.admissionId,
        assignmentType: assignForm.assignmentType
      });
      showNotification(`Bed ${selectedBed.bedNumber} assigned to patient ${assignForm.patientName || assignForm.patientId}.`);
      setShowAssignModal(false);
      setAssignForm({ patientId: '', patientName: '', admissionId: '', assignmentType: 'INITIAL_ADMISSION' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Assignment failed');
    }
  };

  // Transfer Bed Submission
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBed || !transferForm.toBedId) return;
    try {
      await bedService.transferBed({
        patientId: selectedBed.currentPatientId,
        admissionId: selectedBed.currentAdmissionId,
        fromBedId: selectedBed.bedId,
        toBedId: transferForm.toBedId,
        reason: transferForm.reason || 'Clinical transfer request'
      });
      showNotification(`Patient transferred to ${transferForm.toBedId}. Bed ${selectedBed.bedNumber} scheduled for cleaning.`);
      setShowTransferModal(false);
      setTransferForm({ patientId: '', admissionId: '', toBedId: '', reason: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Transfer failed');
    }
  };

  // View Bed History
  const handleOpenHistory = async (bed) => {
    setSelectedBed(bed);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await bedService.getBedHistory(bed.bedId);
      if (res.data?.data) {
        setBedHistory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load bed history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Complete Housekeeping Cleaning
  const handleCompleteCleaning = async (taskId, bedId) => {
    try {
      await bedService.completeCleaning({ taskId, bedId });
      showNotification(`Bed cleaning completed. Bed is now AVAILABLE.`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to complete cleaning');
    }
  };

  // Create Ward Submit
  const handleCreateWardSubmit = async (e) => {
    e.preventDefault();
    try {
      await bedService.createWard(wardForm);
      showNotification(`Ward ${wardForm.wardName} created successfully.`);
      setShowNewWardModal(false);
      setWardForm({
        wardId: '',
        wardName: '',
        wardType: 'GENERAL_WARD',
        floor: '1st Floor',
        wing: 'North Wing',
        genderPolicy: 'ANY',
        baseRatePerDay: 1500,
        nurseInCharge: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to create ward');
    }
  };

  return (
    <div className="space-y-6" style={{ padding: '0.5rem 0' }}>
      {/* Top Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span
              style={{
                display: 'inline-flex',
                padding: '0.4rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8'
              }}
            >
              <BedDouble size={24} />
            </span>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: '#f8fafc' }}>
              Bed Management & Operational Capacity
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Authoritative physical bed inventory, concurrency-safe holds, clinical accommodation routing & turnovers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          {hasRole('ADMIN_MANAGER', 'SYSTEM_ADMIN') && (
            <button
              onClick={() => setShowNewWardModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} />
              <span>New Ward</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid #22c55e',
            color: '#4ade80',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.92rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Metrics Dashboard Cards */}
      {metrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
            gap: '1rem'
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '1.15rem',
              borderLeft: '4px solid #38bdf8',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
              Total Beds
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginTop: '0.25rem' }}>
              {metrics.total}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '0.2rem' }}>100% Configured</div>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '1.15rem',
              borderLeft: '4px solid #22c55e',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
              Available
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#4ade80', marginTop: '0.25rem' }}>
              {metrics.available}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#4ade80', marginTop: '0.2rem' }}>
              {metrics.availableRate}% Available
            </div>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '1.15rem',
              borderLeft: '4px solid #eab308',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
              Reserved Holds
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#facc15', marginTop: '0.25rem' }}>
              {metrics.reserved}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#facc15', marginTop: '0.2rem' }}>Expiring Timers</div>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '1.15rem',
              borderLeft: '4px solid #38bdf8',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
              Occupied
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#38bdf8', marginTop: '0.25rem' }}>
              {metrics.occupied}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '0.2rem' }}>
              {metrics.occupancyRate}% Occupancy
            </div>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '1.15rem',
              borderLeft: '4px solid #a855f7',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
              Cleaning Req.
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#c084fc', marginTop: '0.25rem' }}>
              {metrics.cleaningRequired}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#c084fc', marginTop: '0.2rem' }}>Housekeeping Queue</div>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '1.15rem',
              borderLeft: '4px solid #f97316',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
              Maintenance
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fb923c', marginTop: '0.25rem' }}>
              {metrics.maintenance}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#fb923c', marginTop: '0.2rem' }}>Repair Tickets</div>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '1.15rem',
              borderLeft: '4px solid #ef4444',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
              Blocked / Out
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f87171', marginTop: '0.25rem' }}>
              {metrics.blocked + metrics.outOfService}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '0.2rem' }}>Restricted Access</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.25rem'
        }}
      >
        <button
          onClick={() => setActiveTab('bed-map')}
          style={{
            padding: '0.65rem 1.25rem',
            background: activeTab === 'bed-map' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'bed-map' ? '#38bdf8' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'bed-map' ? '2px solid #38bdf8' : '2px solid transparent',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Layers size={16} />
          <span>Interactive Bed Map</span>
        </button>

        <button
          onClick={() => setActiveTab('search-inventory')}
          style={{
            padding: '0.65rem 1.25rem',
            background: activeTab === 'search-inventory' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'search-inventory' ? '#38bdf8' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'search-inventory' ? '2px solid #38bdf8' : '2px solid transparent',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Search size={16} />
          <span>Inventory & Search Table ({filteredBeds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('housekeeping')}
          style={{
            padding: '0.65rem 1.25rem',
            background: activeTab === 'housekeeping' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'housekeeping' ? '#38bdf8' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'housekeeping' ? '2px solid #38bdf8' : '2px solid transparent',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Sparkles size={16} />
          <span>Housekeeping Queue ({housekeepingTasks.filter((t) => t.status !== 'COMPLETED').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          style={{
            padding: '0.65rem 1.25rem',
            background: activeTab === 'reservations' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'reservations' ? '#38bdf8' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'reservations' ? '2px solid #38bdf8' : '2px solid transparent',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Clock size={16} />
          <span>Active Holds ({reservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wards-master')}
          style={{
            padding: '0.65rem 1.25rem',
            background: activeTab === 'wards-master' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'wards-master' ? '#38bdf8' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'wards-master' ? '2px solid #38bdf8' : '2px solid transparent',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Building size={16} />
          <span>Wards & Categories Master</span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder="Search bed number, patient name, ID, ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ paddingLeft: '2.4rem', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ward:</span>
          <select
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="input"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Wards</option>
            {wards.map((w) => (
              <option key={w.wardId} value={w.wardId}>
                {w.wardName || w.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Categories</option>
            <option value="GENERAL_WARD">General Ward</option>
            <option value="SEMI_PRIVATE">Semi-Private</option>
            <option value="PRIVATE_ROOM">Private Room</option>
            <option value="ICU">ICU</option>
            <option value="EMERGENCY_BED">Emergency Trauma</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="RESERVED">Reserved</option>
            <option value="CLEANING">Cleaning Required</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE BED MAP VIEW */}
      {activeTab === 'bed-map' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {bedsByWard.map((ward) => (
            <div
              key={ward.wardId}
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.75rem'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: '600' }}>
                    {ward.wardName || ward.name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {ward.floor} • {ward.wing} • Type: {ward.wardType} • Gender Policy: {ward.genderPolicy || 'ANY'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.82rem' }}>
                  <span style={{ color: '#4ade80' }}>
                    Available: {ward.beds.filter((b) => b.status === 'AVAILABLE').length}
                  </span>
                  <span style={{ color: '#38bdf8' }}>
                    Occupied: {ward.beds.filter((b) => b.status === 'OCCUPIED').length}
                  </span>
                  <span style={{ color: '#facc15' }}>
                    Reserved: {ward.beds.filter((b) => b.status === 'RESERVED').length}
                  </span>
                </div>
              </div>

              {ward.beds.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No beds matching current filter in this ward.
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  {ward.beds.map((bed) => {
                    const badge = getStatusBadge(bed.status);
                    const Icon = badge.icon;
                    return (
                      <div
                        key={bed.bedId}
                        style={{
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: `1px solid ${badge.border}40`,
                          borderTop: `3px solid ${badge.border}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedBed(bed)}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
                              {bed.bedNumber}
                            </div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '9999px',
                                fontSize: '0.72rem',
                                fontWeight: '600',
                                background: badge.bg,
                                color: badge.text,
                                border: `1px solid ${badge.border}60`
                              }}
                            >
                              <Icon size={12} />
                              <span>{badge.label}</span>
                            </span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                            Room: {bed.roomNumber || 'Open Bay'} • {bed.bedType}
                          </div>

                          {bed.status === 'OCCUPIED' && (
                            <div
                              style={{
                                marginTop: '0.5rem',
                                padding: '0.45rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(56, 189, 248, 0.08)',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                fontSize: '0.78rem'
                              }}
                            >
                              <div style={{ color: '#38bdf8', fontWeight: '600' }}>
                                {bed.currentPatientName || 'Patient In-Bed'}
                              </div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                ID: {bed.currentPatientId}
                              </div>
                            </div>
                          )}

                          {bed.status === 'RESERVED' && (
                            <div
                              style={{
                                marginTop: '0.5rem',
                                padding: '0.45rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(234, 179, 8, 0.08)',
                                border: '1px solid rgba(234, 179, 8, 0.2)',
                                fontSize: '0.78rem'
                              }}
                            >
                              <div style={{ color: '#facc15', fontWeight: '600' }}>Hold for Patient</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                ID: {bed.reservedForPatientId}
                              </div>
                            </div>
                          )}

                          {bed.status === 'MAINTENANCE' && (
                            <div
                              style={{
                                marginTop: '0.5rem',
                                padding: '0.45rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(249, 115, 22, 0.08)',
                                border: '1px solid rgba(249, 115, 22, 0.2)',
                                fontSize: '0.75rem',
                                color: '#fb923c'
                              }}
                            >
                              {bed.maintenanceReason || 'Under maintenance'}
                            </div>
                          )}
                        </div>

                        {/* Card Quick Action Buttons */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.4rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            paddingTop: '0.6rem'
                          }}
                        >
                          {bed.status === 'AVAILABLE' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBed(bed);
                                  setShowReserveModal(true);
                                }}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }}
                              >
                                Reserve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBed(bed);
                                  setShowAssignModal(true);
                                }}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }}
                              >
                                Assign
                              </button>
                            </>
                          )}

                          {bed.status === 'OCCUPIED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBed(bed);
                                setShowTransferModal(true);
                              }}
                              className="btn btn-secondary"
                              style={{
                                flex: 1,
                                padding: '0.35rem',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <ArrowRightLeft size={12} />
                              <span>Transfer</span>
                            </button>
                          )}

                          {(bed.status === 'CLEANING_REQUIRED' || bed.status === 'CLEANING') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteCleaning(null, bed.bedId);
                              }}
                              className="btn btn-primary"
                              style={{
                                flex: 1,
                                padding: '0.35rem',
                                fontSize: '0.75rem',
                                background: '#9333ea',
                                borderColor: '#9333ea'
                              }}
                            >
                              Mark Cleaned
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenHistory(bed);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem' }}
                            title="View History"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: INVENTORY & SEARCH TABLE */}
      {activeTab === 'search-inventory' && (
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Bed ID / No.</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Ward / Room</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Capabilities</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Current Occupant / Hold</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Daily Rate</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeds.map((bed) => {
                  const badge = getStatusBadge(bed.status);
                  const Icon = badge.icon;
                  return (
                    <tr
                      key={bed.bedId}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#f8fafc' }}>
                        <div>{bed.bedNumber}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bed.bedId}</div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div>{bed.wardName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Room: {bed.roomNumber || 'N/A'}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.06)',
                            fontSize: '0.8rem'
                          }}
                        >
                          {bed.bedType}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {bed.isVentilatorSupported && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px'
                              }}
                            >
                              Ventilator
                            </span>
                          )}
                          {bed.isOxygenSupported && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                background: 'rgba(34, 197, 94, 0.15)',
                                color: '#4ade80',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px'
                              }}
                            >
                              Oxygen
                            </span>
                          )}
                          {bed.isIsolationCapable && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                background: 'rgba(168, 85, 247, 0.15)',
                                color: '#c084fc',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px'
                              }}
                            >
                              Isolation
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}60`
                          }}
                        >
                          <Icon size={12} />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        {bed.status === 'OCCUPIED' && (
                          <div>
                            <div style={{ color: '#38bdf8', fontWeight: '500' }}>{bed.currentPatientName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ID: {bed.currentPatientId} • Adm: {bed.currentAdmissionId}
                            </div>
                          </div>
                        )}
                        {bed.status === 'RESERVED' && (
                          <div style={{ color: '#facc15', fontSize: '0.82rem' }}>
                            Patient {bed.reservedForPatientId}
                          </div>
                        )}
                        {bed.status === 'AVAILABLE' && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#f8fafc' }}>
                        ₹{bed.dailyRate}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setSelectedBed(bed);
                              setNewStatus(bed.status);
                              setShowStatusModal(true);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          >
                            Status
                          </button>
                          <button
                            onClick={() => handleOpenHistory(bed)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HOUSEKEEPING & CLEANING QUEUE */}
      {activeTab === 'housekeeping' && (
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: '600' }}>
                Housekeeping Turnover & Sanitization Queue
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Rule 8: Beds vacated upon transfer or discharge must be sanitized before returning to AVAILABLE status.
              </p>
            </div>
          </div>

          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Task ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Bed / Ward</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Trigger</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Requested At</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {housekeepingTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No active cleaning tasks in housekeeping queue.
                    </td>
                  </tr>
                ) : (
                  housekeepingTasks.map((task) => (
                    <tr key={task.taskId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#f8fafc' }}>
                        {task.taskId}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '600' }}>{task.bedNumber} ({task.bedId})</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.wardName}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.06)',
                            fontSize: '0.78rem'
                          }}
                        >
                          {task.trigger}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            color: task.priority === 'URGENT' || task.priority === 'STAT' ? '#f87171' : '#facc15',
                            fontWeight: '600',
                            fontSize: '0.8rem'
                          }}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: task.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                            color: task.status === 'COMPLETED' ? '#4ade80' : '#c084fc'
                          }}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        {task.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCompleteCleaning(task.taskId, task.bedId)}
                            className="btn btn-primary"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              background: '#9333ea',
                              borderColor: '#9333ea'
                            }}
                          >
                            Mark Completed
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
      )}

      {/* TAB 4: ACTIVE RESERVATIONS & HOLDS */}
      {activeTab === 'reservations' && (
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: '600' }}>
                Active Bed Reservations & Hold Timers
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Automatic timeouts guarantee that unused holds are safely returned to availability.
              </p>
            </div>
          </div>

          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Reservation ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Bed / Ward</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Reserved At</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Expires At</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No active reservations at this time.
                    </td>
                  </tr>
                ) : (
                  reservations.map((res) => (
                    <tr key={res.reservationId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#f8fafc' }}>
                        {res.reservationId}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '600' }}>{res.bedNumber} ({res.bedId})</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#38bdf8' }}>
                        {res.patientName || res.patientId}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {new Date(res.reservedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#facc15', fontWeight: '600' }}>
                        {new Date(res.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
                        {res.reservationReason}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={async () => {
                            try {
                              await bedService.cancelReservation(res.bedId, {
                                reservationId: res.reservationId,
                                cancellationReason: 'Cancelled by front-desk staff'
                              });
                              showNotification(`Hold cancelled for Bed ${res.bedNumber}.`);
                              fetchData();
                            } catch (err) {
                              alert('Failed to cancel reservation');
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#f87171' }}
                        >
                          Cancel Hold
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: WARDS & CATEGORIES MASTER */}
      {activeTab === 'wards-master' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Wards Master */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: '600' }}>
                Wards & Physical Divisions
              </h3>
              <button
                onClick={() => setShowNewWardModal(true)}
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                + Add Ward
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {wards.map((w) => (
                <div
                  key={w.wardId}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#f8fafc' }}>{w.wardName || w.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ID: {w.wardId} • {w.floor} • Wing: {w.wing} • Rate: ₹{w.baseRatePerDay}/day
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.82rem' }}>
                    <div style={{ color: '#4ade80', fontWeight: '600' }}>{w.availableBeds} Avail</div>
                    <div style={{ color: 'var(--text-muted)' }}>{w.totalBeds} Total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accommodation Categories Master */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.15rem', color: '#f8fafc', fontWeight: '600' }}>
              Configurable Accommodation Categories
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {categories.map((c) => (
                <div
                  key={c.code}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#f8fafc' }}>{c.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Code: {c.code} • Base Ref: ₹{c.baseRateReference}/day
                    </div>
                  </div>
                  <div>
                    {c.clinicallyRestricted ? (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px'
                        }}
                      >
                        Clinical Only
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#4ade80',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px'
                        }}
                      >
                        Patient Selectable
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: STATUS CHANGE (AVAILABLE, MAINTENANCE, BLOCKED) */}
      {/* ======================================================== */}
      {showStatusModal && selectedBed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              background: '#0f172a',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                Change Status: Bed {selectedBed.bedNumber}
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStatusChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Target Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="AVAILABLE">AVAILABLE (Ready for assignment)</option>
                  <option value="CLEANING_REQUIRED">CLEANING_REQUIRED (Flag for Housekeeping)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Repair / Engineering)</option>
                  <option value="BLOCKED">BLOCKED (Administrative hold / VIP)</option>
                  <option value="OUT_OF_SERVICE">OUT_OF_SERVICE (Unusable)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Reason / Notes for Status Change
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Explain why the status is being modified..."
                  rows={3}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: RESERVE BED (CONCURRENCY-SAFE HOLD) */}
      {/* ======================================================== */}
      {showReserveModal && selectedBed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              background: '#0f172a',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                Reserve Bed: {selectedBed.bedNumber}
              </h3>
              <button
                onClick={() => setShowReserveModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReserveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Patient Permanent ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. P10001"
                  value={reserveForm.patientId}
                  onChange={(e) => setReserveForm({ ...reserveForm, patientId: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Patient Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={reserveForm.patientName}
                  onChange={(e) => setReserveForm({ ...reserveForm, patientName: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Hold Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="240"
                  value={reserveForm.durationMinutes}
                  onChange={(e) => setReserveForm({ ...reserveForm, durationMinutes: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Lock Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: DIRECT PHYSICAL BED ASSIGNMENT */}
      {/* ======================================================== */}
      {showAssignModal && selectedBed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              background: '#0f172a',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                Assign Bed: {selectedBed.bedNumber} ({selectedBed.wardName})
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Permanent Patient ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. P10002"
                  value={assignForm.patientId}
                  onChange={(e) => setAssignForm({ ...assignForm, patientId: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Patient Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={assignForm.patientName}
                  onChange={(e) => setAssignForm({ ...assignForm, patientName: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Admission Episode ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ADM202610002"
                  value={assignForm.admissionId}
                  onChange={(e) => setAssignForm({ ...assignForm, admissionId: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: SAFE BED TRANSFER WORKFLOW */}
      {/* ======================================================== */}
      {showTransferModal && selectedBed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              background: '#0f172a',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                Transfer Patient from Bed {selectedBed.bedNumber}
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}
            >
              <div><strong>Current Patient:</strong> {selectedBed.currentPatientName || selectedBed.currentPatientId}</div>
              <div><strong>Admission ID:</strong> {selectedBed.currentAdmissionId}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                Safety Rule 29: The new bed will be securely locked before this bed is vacated for cleaning.
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Select Destination Bed (Available) *
                </label>
                <select
                  value={transferForm.toBedId}
                  onChange={(e) => setTransferForm({ ...transferForm, toBedId: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- Choose Available Bed --</option>
                  {beds
                    .filter((b) => b.status === 'AVAILABLE' && b.bedId !== selectedBed.bedId)
                    .map((b) => (
                      <option key={b.bedId} value={b.bedId}>
                        {b.bedNumber} ({b.wardName} - {b.bedType}) - ₹{b.dailyRate}/day
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Transfer Clinical / Administrative Justification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Transferred to ICU due to clinical elevation"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Execute Safe Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: BED HISTORY & AUDIT TIMELINE */}
      {/* ======================================================== */}
      {showHistoryModal && selectedBed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '650px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              background: '#0f172a',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
                  Audit History: Bed {selectedBed.bedNumber}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {selectedBed.wardName} • {selectedBed.bedType} • ID: {selectedBed.bedId}
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {historyLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading audit events...
              </div>
            ) : !bedHistory || bedHistory.statusHistory?.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No status history events logged for this bed.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {bedHistory.statusHistory.map((h, idx) => (
                  <div
                    key={h._id || idx}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderLeft: `3px solid ${h.newStatus === 'OCCUPIED' ? '#38bdf8' : h.newStatus === 'AVAILABLE' ? '#22c55e' : '#a855f7'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.9rem' }}>
                          {h.previousStatus ? `${h.previousStatus} → ` : ''}{h.newStatus}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({h.referenceType})</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {h.reason || 'No description provided'}
                      </div>
                      {h.patientId && (
                        <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                          Patient: {h.patientId}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div>{new Date(h.timestamp).toLocaleDateString()}</div>
                      <div>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div>By: {h.changedByUserName || 'System'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: CREATE NEW WARD */}
      {/* ======================================================== */}
      {showNewWardModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              background: '#0f172a',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                Add New Ward / Physical Division
              </h3>
              <button
                onClick={() => setShowNewWardModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Ward Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. WARD-ORTH-01"
                  value={wardForm.wardId}
                  onChange={(e) => setWardForm({ ...wardForm, wardId: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Ward Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Orthopedics Post-Op Ward"
                  value={wardForm.wardName}
                  onChange={(e) => setWardForm({ ...wardForm, wardName: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Ward Type
                  </label>
                  <select
                    value={wardForm.wardType}
                    onChange={(e) => setWardForm({ ...wardForm, wardType: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="GENERAL_WARD">General Ward</option>
                    <option value="SEMI_PRIVATE">Semi-Private</option>
                    <option value="PRIVATE_ROOM">Private Suite</option>
                    <option value="ICU">ICU</option>
                    <option value="HDU">HDU</option>
                    <option value="ISOLATION">Isolation</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Floor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2nd Floor"
                    value={wardForm.floor}
                    onChange={(e) => setWardForm({ ...wardForm, floor: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Base Daily Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={wardForm.baseRatePerDay}
                    onChange={(e) => setWardForm({ ...wardForm, baseRatePerDay: Number(e.target.value) })}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Nurse In Charge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sister Rekha"
                    value={wardForm.nurseInCharge}
                    onChange={(e) => setWardForm({ ...wardForm, nurseInCharge: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNewWardModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedManagementPage;
