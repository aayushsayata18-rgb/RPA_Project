import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Download, Printer, User, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';

export const RegistrationSuccessPage = () => {
  const location = useLocation();
  const regData = location.state?.registrationData || {
    patientId: 'P10001',
    patientName: 'Registered Patient',
    visitId: 'V202610001',
    registrationId: 'REG202610001',
    status: 'REGISTERED',
    isExistingPatient: false
  };

  const patientName = location.state?.patientName || regData.patientName || 'Registered Patient';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
        padding: '3rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '650px',
          background: 'rgba(30, 41, 59, 0.9)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(2, 132, 199, 0.25)',
          padding: '2.5rem'
        }}
      >
        {/* Success Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid #10b981',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
              marginBottom: '1rem'
            }}
          >
            <CheckCircle size={40} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
            Registration Confirmed!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            {regData.isExistingPatient
              ? 'Welcome back! Your new visit encounter has been created under your existing Patient ID.'
              : 'Welcome to Hospital Administrative Platform. Your permanent identity is established.'}
          </p>
        </div>

        {/* Official Slip Details Card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '0.75rem',
              marginBottom: '1rem'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Official Identity Receipt
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              {regData.status || 'REGISTERED'}
            </span>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
            <div>
              <span className="text-secondary text-xs" style={{ display: 'block' }}>Permanent Patient ID</span>
              <strong style={{ fontSize: '1.25rem', color: '#38bdf8', letterSpacing: '0.05em' }}>
                {regData.patientId}
              </strong>
            </div>

            <div>
              <span className="text-secondary text-xs" style={{ display: 'block' }}>Encounter Visit ID</span>
              <strong style={{ fontSize: '1.25rem', color: '#f8fafc', letterSpacing: '0.05em' }}>
                {regData.visitId}
              </strong>
            </div>

            <div>
              <span className="text-secondary text-xs" style={{ display: 'block' }}>Patient Full Name</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{patientName}</span>
            </div>

            <div>
              <span className="text-secondary text-xs" style={{ display: 'block' }}>Registration ID</span>
              <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{regData.registrationId}</span>
            </div>

            <div>
              <span className="text-secondary text-xs" style={{ display: 'block' }}>Registration Date</span>
              <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{new Date().toLocaleDateString('en-GB')}</span>
            </div>

            <div>
              <span className="text-secondary text-xs" style={{ display: 'block' }}>Identity Confirmation</span>
              <span style={{ color: '#38bdf8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={16} /> Central Master Verified
              </span>
            </div>
          </div>
        </div>

        {/* Important Instructions Note */}
        <div
          style={{
            background: 'rgba(2, 132, 199, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: '#bae6fd'
          }}
        >
          <strong>Notice:</strong> An automated SMS & Email confirmation containing your Permanent Patient ID{' '}
          <strong>({regData.patientId})</strong> has been dispatched. Please quote this ID during all future hospital visits,
          lab orders, pharmacy, and billing.
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Printer size={16} /> Print Receipt
          </button>

          <Link
            to="/login"
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
            }}
          >
            Proceed to Portal Login <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
