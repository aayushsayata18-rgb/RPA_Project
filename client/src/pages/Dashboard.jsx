import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import {
  Users,
  Calendar,
  Layers,
  BedDouble,
  CreditCard,
  ShieldCheck,
  Bot,
  AlertTriangle,
  Activity,
  CheckCircle,
  FileText
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.firstName}</h1>
          <p className="page-subtitle">
            Connected to <strong>{user?.role?.replace(/_/g, ' ')}</strong> Portal • Real-time RPA Synchronized
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            Platform Engine Online
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <StatCard title="Active Admissions" value="42" change="+3 today" icon={BedDouble} color="#0284c7" />
        <StatCard title="OPD In Queue" value="18" change="Avg wait 14m" icon={Layers} color="#6366f1" />
        <StatCard title="RPA Success Rate" value="99.4%" change="248 jobs run" icon={Bot} color="#10b981" />
        <StatCard title="Open Exceptions" value="2" change="Requires review" icon={AlertTriangle} color="#f59e0b" />
      </div>

      {/* System Overview Panels */}
      <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Active Hospital Administrative Services</h3>
            <span className="badge badge-info">28 Modules Master</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { name: 'Patient Registration & Identity Master', status: 'READY', desc: 'Single patient ID, deduplication, emergency temp records' },
              { name: 'Appointment & Slot Management', status: 'ACTIVE', desc: 'Configurable slots, automated SMS reminders' },
              { name: 'OPD Live Queue Engine', status: 'ACTIVE', desc: 'Online & front-desk check-in, token caller' },
              { name: 'Bed & Ward Management', status: 'ACTIVE', desc: 'ICU/Ward capacity, housekeeping turnover gates' },
              { name: 'Billing & Financial Settlement', status: 'READY', desc: 'Discharge gate enforcement, multi-service aggregation' },
              { name: 'RPA Insurance Verification & Claims', status: 'SYNCHRONIZED', desc: 'Robot Framework worker automated submission' }
            ].map((srv, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.8rem 1rem',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{srv.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{srv.desc}</div>
                </div>
                <span className="badge badge-success">{srv.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>00_MASTER.md Operational Guardrails</h3>
            <span className="badge badge-secondary">Policy Rules</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
            <div style={{ padding: '0.8rem', background: 'rgba(2, 132, 199, 0.08)', borderLeft: '3px solid #0284c7', borderRadius: '4px' }}>
              <strong>Permanent Patient ID:</strong> A patient has one permanent master ID. Returns create new Visit IDs.
            </div>
            <div style={{ padding: '0.8rem', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid #10b981', borderRadius: '4px' }}>
              <strong>Discharge Financial Gate:</strong> Final discharge is strictly blocked until settlement is confirmed or verified exception exists.
            </div>
            <div style={{ padding: '0.8rem', background: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid #f59e0b', borderRadius: '4px' }}>
              <strong>Bed Turnover Rule:</strong> Beds transition <code>OCCUPIED &rarr; CLEANING_REQUIRED &rarr; AVAILABLE</code> upon housekeeping clearance.
            </div>
            <div style={{ padding: '0.8rem', background: 'rgba(99, 102, 241, 0.08)', borderLeft: '3px solid #6366f1', borderRadius: '4px' }}>
              <strong>RPA Automation Boundary:</strong> RPA operates as an idempotent worker. Never replaces clinical or financial authorization decisions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
