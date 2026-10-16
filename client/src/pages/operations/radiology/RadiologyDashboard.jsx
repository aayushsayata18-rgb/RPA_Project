import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import radiologyService from '../../../services/radiologyService';
import {
  Radio,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  AlertTriangle,
  Play,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  RefreshCw,
  Search,
  Sliders
} from 'lucide-react';

export const RadiologyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todaysOrders: 0,
    pendingScheduling: 0,
    todaysAppointments: 0,
    checkedInPatients: 0,
    proceduresInProgress: 0,
    completedStudies: 0,
    reportsPending: 0,
    reportsReady: 0,
    reportsReleased: 0,
    openExceptions: 0
  });
  const [modalitySummary, setModalitySummary] = useState({
    total: 0,
    available: 0,
    inUse: 0,
    maintenance: 0,
    offline: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentStudies, setRecentStudies] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes, studiesRes] = await Promise.all([
        radiologyService.getDashboardMetrics(),
        radiologyService.listOrders({ limit: 5 }),
        radiologyService.listStudies({ limit: 5 })
      ]);

      if (dashRes.data?.data) {
        setMetrics(dashRes.data.data.metrics || {});
        setModalitySummary(dashRes.data.data.modalitySummary || {});
      }
      if (ordersRes.data?.data) {
        setRecentOrders(ordersRes.data.data.slice(0, 5));
      }
      if (studiesRes.data?.data) {
        setRecentStudies(studiesRes.data.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load radiology dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="portal-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Radio size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Radiology Administration Hub
              </h1>
              <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: '14px' }}>
                Operational imaging lifecycle, PACS/RIS tracking, procedure queue & diagnostic reporting
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/operations/radiology/orders" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', background: '#0284c7', color: '#fff', textDecoration: 'none', fontWeight: '600' }}>
            Place Radiology Order
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>TODAY'S ORDERS</span>
            <FileText size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>
            {metrics.todaysOrders}
          </div>
          <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px' }}>
            {metrics.pendingScheduling} pending scheduling
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>SCHEDULED TODAY</span>
            <Calendar size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>
            {metrics.todaysAppointments}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
            {metrics.checkedInPatients} checked-in at reception
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>SCANS IN PROGRESS</span>
            <Activity size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>
            {metrics.proceduresInProgress}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {metrics.completedStudies} studies completed today
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>REPORTING QUEUE</span>
            <ShieldCheck size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>
            {metrics.reportsPending}
          </div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
            {metrics.reportsReleased} reports released
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>EXCEPTIONS</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: metrics.openExceptions > 0 ? '#ef4444' : '#0f172a', marginTop: '8px' }}>
            {metrics.openExceptions}
          </div>
          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
            Requires clinical/admin review
          </div>
        </div>
      </div>

      {/* Equipment Status & Quick Actions Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} color="#0284c7" /> Modality Fleet Status
          </h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '100px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>TOTAL</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{modalitySummary.total}</div>
            </div>
            <div style={{ flex: 1, minWidth: '100px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#16a34a' }}>AVAILABLE</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>{modalitySummary.available}</div>
            </div>
            <div style={{ flex: 1, minWidth: '100px', padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#2563eb' }}>IN USE</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>{modalitySummary.inUse}</div>
            </div>
            <div style={{ flex: 1, minWidth: '100px', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#d97706' }}>MAINTENANCE</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#d97706' }}>{modalitySummary.maintenance}</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <Link to="/operations/radiology/modalities" style={{ color: '#0284c7', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Manage Modality Master <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#0284c7" /> Operations Navigation
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <Link to="/operations/radiology/scheduling" style={{ padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#1e293b', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="#0284c7" /> Slot Scheduling
            </Link>
            <Link to="/operations/radiology/checkin" style={{ padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#1e293b', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#16a34a" /> Reception Check-In
            </Link>
            <Link to="/operations/radiology/procedures" style={{ padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#1e293b', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={16} color="#f59e0b" /> Procedure Queue
            </Link>
            <Link to="/operations/radiology/reporting-queue" style={{ padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#1e293b', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#8b5cf6" /> Radiologist Queue
            </Link>
            <Link to="/operations/radiology/reports" style={{ padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#1e293b', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#059669" /> Reports Archive
            </Link>
            <Link to="/operations/radiology/analytics" style={{ padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#1e293b', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="#0284c7" /> Analytics & TAT
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders & Studies Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        {/* Recent Orders */}
        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#0f172a' }}>Recent Orders</h3>
            <Link to="/operations/radiology/orders" style={{ fontSize: '13px', color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>View All</Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Order ID</th>
                <th style={{ padding: '10px' }}>Patient</th>
                <th style={{ padding: '10px' }}>Exam</th>
                <th style={{ padding: '10px' }}>Priority</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No active orders</td></tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: '600', color: '#0284c7' }}>{o.orderId}</td>
                    <td style={{ padding: '10px' }}>{o.patientName}</td>
                    <td style={{ padding: '10px' }}>{o.examNameSnapshot}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                        background: o.priority === 'STAT' ? '#fee2e2' : o.priority === 'URGENT' ? '#fef3c7' : '#f1f5f9',
                        color: o.priority === 'STAT' ? '#dc2626' : o.priority === 'URGENT' ? '#d97706' : '#475569'
                      }}>
                        {o.priority}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                        background: '#e0f2fe', color: '#0369a1'
                      }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Studies */}
        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#0f172a' }}>Recent Imaging Studies</h3>
            <Link to="/operations/radiology/studies" style={{ fontSize: '13px', color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>View All</Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Accession No</th>
                <th style={{ padding: '10px' }}>Patient</th>
                <th style={{ padding: '10px' }}>Modality</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentStudies.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No recent studies</td></tr>
              ) : (
                recentStudies.map((s) => (
                  <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: '600', color: '#0f172a' }}>{s.accessionNumber}</td>
                    <td style={{ padding: '10px' }}>{s.patientName}</td>
                    <td style={{ padding: '10px' }}>{s.modalityType} ({s.room})</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                        background: s.studyStatus === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                        color: s.studyStatus === 'COMPLETED' ? '#15803d' : '#b45309'
                      }}>
                        {s.studyStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RadiologyDashboard;
