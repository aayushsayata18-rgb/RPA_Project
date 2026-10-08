import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Layers,
  BedDouble,
  CreditCard,
  ShieldCheck,
  Stethoscope,
  Clock,
  FlaskConical,
  Radio,
  Wrench,
  Sparkles,
  MessageSquare,
  Bot,
  AlertTriangle,
  FileText,
  Sliders,
  History
} from 'lucide-react';

export const Sidebar = () => {
  const { user, hasRole } = useAuth();

  const getNavLinks = () => {
    // Patient Portal Nav
    if (hasRole('PATIENT')) {
      return [
        { to: '/patient/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { to: '/patient/appointments', label: 'My Appointments', icon: Calendar },
        { to: '/patient/checkin', label: 'Online Check-In', icon: Layers },
        { to: '/patient/bills', label: 'Bills & Payments', icon: CreditCard },
        { to: '/patient/records', label: 'Medical Documents', icon: FileText },
        { to: '/patient/feedback', label: 'Feedback & Support', icon: MessageSquare }
      ];
    }

    // Clinical Portal Nav (Doctors & Nurses)
    if (hasRole('DOCTOR', 'NURSE')) {
      return [
        { to: '/clinical/dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
        { to: '/clinical/appointments', label: 'Doctor Schedule', icon: Calendar },
        { to: '/clinical/opd-queue', label: 'OPD Queue', icon: Layers },
        { to: '/clinical/inpatients', label: 'Inpatient Ward', icon: BedDouble },
        { to: '/clinical/lab-orders', label: 'Lab Orders', icon: FlaskConical },
        { to: '/clinical/radiology', label: 'Radiology Orders', icon: Radio }
      ];
    }

    // Operations Portal Nav (Reception, Lab, Rad, Pharmacy, HK, Maint)
    if (hasRole('RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGY_TECHNICIAN', 'HOUSEKEEPING', 'MAINTENANCE')) {
      return [
        { to: '/operations/dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
        { to: '/operations/registration', label: 'Patient Registration', icon: Users },
        { to: '/operations/opd-desk', label: 'Front-Desk Queue', icon: Layers },
        { to: '/operations/beds', label: 'Bed Management', icon: BedDouble },
        { to: '/operations/housekeeping', label: 'Housekeeping Tasks', icon: Sparkles },
        { to: '/operations/maintenance', label: 'Maintenance Tickets', icon: Wrench }
      ];
    }

    // Finance & Insurance Portal Nav
    if (hasRole('BILLING_STAFF', 'INSURANCE_REPRESENTATIVE')) {
      return [
        { to: '/finance/dashboard', label: 'Finance Dashboard', icon: LayoutDashboard },
        { to: '/finance/billing', label: 'Invoices & Payments', icon: CreditCard },
        { to: '/finance/insurance', label: 'Policy Verification', icon: ShieldCheck },
        { to: '/finance/claims', label: 'Insurance Claims', icon: FileText }
      ];
    }

    // Administration & Management Portal Nav (Admin, HR, Procurement, Management)
    return [
      { to: '/admin/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
      { to: '/admin/users', label: 'User & Role Master', icon: Users },
      { to: '/admin/rpa', label: 'RPA Automation Center', icon: Bot },
      { to: '/admin/exceptions', label: 'Exception Cases', icon: AlertTriangle },
      { to: '/admin/audit', label: 'Audit Timeline', icon: History },
      { to: '/admin/config', label: 'Hospital Business Rules', icon: Sliders }
    ];
  };

  const navLinks = getNavLinks();

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 70px)',
      padding: '1.5rem 1rem'
    }}>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        marginBottom: '1rem',
        paddingLeft: '0.75rem'
      }}>
        Navigation
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                textDecoration: 'none',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.9rem',
                transition: 'all var(--transition-fast)'
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
