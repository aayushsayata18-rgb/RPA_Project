import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  UserCheck,
  ShieldAlert,
  Search,
  Plus
} from 'lucide-react';
import { StatCard } from '../../../components/common/StatCard';
import { StatusBadge } from '../../../components/common/StatusBadge';
import laboratoryService from '../../../services/laboratoryService';

export const LaboratoryDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    metrics: {},
    topTests: [],
    recentOrders: []
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await laboratoryService.getDashboardMetrics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load lab metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const { metrics = {}, topTests = [], recentOrders = [] } = data;

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FlaskConical className="text-primary" size={28} />
            Laboratory Administration Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Diagnostic Catalog, Accessioning, Analytical Flow, Verification & Secure Report Release
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/operations/laboratory/orders/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> New Lab Order
          </Link>
          <Link to="/operations/laboratory/reception" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={16} /> Sample Reception
          </Link>
          <Link to="/operations/laboratory/verification" className="btn btn-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#d97706', color: '#fff' }}>
            <CheckCircle size={16} /> Verification Queue
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Today's Lab Orders"
          value={metrics.todayOrders ?? (loading ? '...' : 0)}
          icon={FlaskConical}
          color="#38bdf8"
          change={`Total registered: ${metrics.totalOrders || 0}`}
        />
        <StatCard
          title="Pending Collection"
          value={metrics.pendingCollection ?? (loading ? '...' : 0)}
          icon={Clock}
          color="#f59e0b"
          change="Phlebotomy Queue"
        />
        <StatCard
          title="Samples In Process"
          value={metrics.inProcessSamples ?? (loading ? '...' : 0)}
          icon={Activity}
          color="#8b5cf6"
          change="Bench Analytical"
        />
        <StatCard
          title="Pending Verification"
          value={metrics.pendingVerification ?? (loading ? '...' : 0)}
          icon={CheckCircle}
          color="#ec4899"
          change="Pathologist Review"
        />
        <StatCard
          title="Reports Released"
          value={metrics.reportsReleased ?? (loading ? '...' : 0)}
          icon={FileText}
          color="#10b981"
          change="Patient / Doctor Access"
        />
        <StatCard
          title="Rejected Samples"
          value={metrics.rejectedSamples ?? (loading ? '...' : 0)}
          icon={AlertTriangle}
          color="#ef4444"
          change={`Rate: ${metrics.rejectionRate || 0}%`}
        />
      </div>

      {/* Operational Workflow Ribbon */}
      <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-card)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Laboratory Diagnostic Flow
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', textAlign: 'center' }}>
          <Link to="/operations/laboratory/orders" className="card card-hover" style={{ padding: '0.75rem', textDecoration: 'none' }}>
            <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '0.85rem' }}>1. Lab Orders</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Intake & Ordering</div>
          </Link>
          <Link to="/operations/laboratory/collection" className="card card-hover" style={{ padding: '0.75rem', textDecoration: 'none' }}>
            <div style={{ color: '#f59e0b', fontWeight: '700', fontSize: '0.85rem' }}>2. Collection</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Phlebotomy & Labels</div>
          </Link>
          <Link to="/operations/laboratory/reception" className="card card-hover" style={{ padding: '0.75rem', textDecoration: 'none' }}>
            <div style={{ color: '#06b6d4', fontWeight: '700', fontSize: '0.85rem' }}>3. Reception</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Accession & Accept</div>
          </Link>
          <Link to="/operations/laboratory/processing" className="card card-hover" style={{ padding: '0.75rem', textDecoration: 'none' }}>
            <div style={{ color: '#8b5cf6', fontWeight: '700', fontSize: '0.85rem' }}>4. Result Entry</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Values & Flags</div>
          </Link>
          <Link to="/operations/laboratory/verification" className="card card-hover" style={{ padding: '0.75rem', textDecoration: 'none' }}>
            <div style={{ color: '#ec4899', fontWeight: '700', fontSize: '0.85rem' }}>5. Verification</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Pathologist Sign-off</div>
          </Link>
          <Link to="/operations/laboratory/reports" className="card card-hover" style={{ padding: '0.75rem', textDecoration: 'none' }}>
            <div style={{ color: '#10b981', fontWeight: '700', fontSize: '0.85rem' }}>6. Reports</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Release & Portal View</div>
          </Link>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Recent Orders */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Recent Laboratory Orders
            </h3>
            <Link to="/operations/laboratory/orders" style={{ fontSize: '0.85rem', color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All Orders <ArrowRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No laboratory orders recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Order ID</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Patient</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Doctor</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Priority</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        <Link to={`/operations/laboratory/orders/${ord.orderId}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>
                          {ord.orderId}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div>{ord.patientName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ord.patientCode}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {ord.orderingDoctorName || 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            background:
                              ord.priority === 'STAT' ? 'rgba(239, 68, 68, 0.2)' : ord.priority === 'URGENT' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.1)',
                            color: ord.priority === 'STAT' ? '#ef4444' : ord.priority === 'URGENT' ? '#f59e0b' : '#38bdf8'
                          }}
                        >
                          {ord.priority}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <StatusBadge status={ord.status} />
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <Link to={`/operations/laboratory/orders/${ord.orderId}`} className="btn btn-secondary btn-sm">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Top Diagnostic Tests & Quick Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Top Requested Tests
            </h3>
            {topTests.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No test stats available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {topTests.map((t, idx) => (
                  <div key={t.code || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.code}</span>
                      <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{t.name}</span>
                    </div>
                    <span style={{ fontWeight: '700', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>
                      {t.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Operational Quick Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/operations/laboratory/tests" className="btn btn-secondary" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                <span>Test Catalog Master</span> <ArrowRight size={14} />
              </Link>
              <Link to="/operations/laboratory/exceptions" className="btn btn-secondary" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                <span>Operational Exceptions ({metrics.openExceptions || 0})</span> <ArrowRight size={14} />
              </Link>
              <Link to="/operations/laboratory/rejected" className="btn btn-secondary" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                <span>Rejected Samples</span> <ArrowRight size={14} />
              </Link>
              <Link to="/operations/laboratory/analytics" className="btn btn-secondary" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                <span>TAT & Quality Analytics</span> <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryDashboard;
