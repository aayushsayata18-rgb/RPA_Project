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
  History,
  AlertOctagon,
  UserCheck,
  UserPlus,
  Search,
  LogOut,
  Briefcase,
  Shield,
  FileCheck,
  RefreshCw,
  CalendarDays,
  Repeat,
  CalendarCheck,
  Banknote,
  Receipt,
  DollarSign,
  Pill,
  Warehouse,
  Boxes,
  Truck,
  CheckCircle,
  ShoppingBag,
  CheckSquare,
  FileSpreadsheet,
  Award,
  BarChart3,
  Building2
} from 'lucide-react';

export const Sidebar = () => {
  const { user, hasRole } = useAuth();

  const getNavLinks = () => {
    // Vendor Portal Nav
    if (hasRole('VENDOR')) {
      return [
        { to: '/vendor', label: 'Supplier Portal Home', icon: Building2 },
        { to: '/vendor/portal', label: 'My Compliance & Orders', icon: FileText }
      ];
    }

    // Patient Portal Nav
    if (hasRole('PATIENT')) {
      return [
        { to: '/patient/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { to: '/patient/profile', label: 'My Identity Profile', icon: UserCheck },
        { to: '/patient/visits', label: 'My Visit Encounters', icon: Clock },
        { to: '/patient/appointments', label: 'My Appointments', icon: Calendar },
        { to: '/patient/checkin', label: 'Online Check-In', icon: Layers },
        { to: '/patient/admissions', label: 'Inpatient Stays', icon: BedDouble },
        { to: '/patient/bills', label: 'My Invoices & Bills', icon: CreditCard },
        { to: '/patient/insurance', label: 'My Insurance Coverage', icon: ShieldCheck },
        { to: '/patient/claims', label: 'My Insurance Claims', icon: FileText },
        { to: '/patient/discharges', label: 'Discharge Summaries', icon: LogOut },
        { to: '/patient/records', label: 'Medical Documents', icon: FileText },
        { to: '/patient/pharmacy', label: 'My Prescriptions & Medicines', icon: Pill },
        { to: '/patient/laboratory', label: 'My Diagnostic Lab Results', icon: FlaskConical }
      ];
    }

    // Laboratory Portal Nav (Lab Technicians & Pathologists)
    if (hasRole('LAB_TECHNICIAN', 'PATHOLOGIST')) {
      return [
        { to: '/operations/laboratory', label: 'Laboratory Hub', icon: FlaskConical },
        { to: '/operations/laboratory/orders', label: 'Lab Orders Queue', icon: FileText },
        { to: '/operations/laboratory/collections', label: 'Phlebotomy Queue', icon: Clock },
        { to: '/operations/laboratory/reception', label: 'Sample Reception', icon: CheckSquare },
        { to: '/operations/laboratory/processing', label: 'Bench Processing', icon: Layers },
        { to: '/operations/laboratory/results/entry', label: 'Result Entry', icon: FileSpreadsheet },
        { to: '/operations/laboratory/verification', label: 'Pathologist Verification', icon: ShieldCheck },
        { to: '/operations/laboratory/reports', label: 'Diagnostic Reports', icon: FileCheck },
        { to: '/operations/laboratory/rejected-samples', label: 'Rejected Specimens', icon: AlertTriangle },
        { to: '/operations/laboratory/exceptions', label: 'Operational Exceptions', icon: AlertOctagon },
        { to: '/operations/laboratory/tests', label: 'Test Master Catalog', icon: Layers },
        { to: '/operations/laboratory/analytics', label: 'Lab Analytics & TAT', icon: BarChart3 },
        { to: '/leave/my-leave', label: 'My Leave Portal', icon: CalendarDays },
        { to: '/my-payroll', label: 'My Payroll Portal', icon: DollarSign },
        { to: '/my-payslips', label: 'My Payslips', icon: Receipt },
        { to: '/my-payroll/queries', label: 'Payroll Queries', icon: MessageSquare }
      ];
    }

    // Operations Portal Nav (Reception, Lab, Rad, Pharmacy, HK, Maint)
    if (hasRole('RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE')) {
      return [
        { to: '/operations/dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
        { to: '/operations/billing', label: 'Billing & Cashier Desk', icon: CreditCard },
        { to: '/operations/patient-records', label: 'Patient Records Dossier', icon: FileText },
        { to: '/operations/beds', label: 'Bed Inventory & Map', icon: BedDouble },
        { to: '/operations/admissions', label: 'Admissions Desk', icon: Layers },
        { to: '/operations/discharges', label: 'Discharge Processing', icon: LogOut },
        { to: '/operations/appointments', label: 'Appointment Desk', icon: Calendar },
        { to: '/front-desk/registration', label: 'Register Patient', icon: UserPlus },
        { to: '/front-desk/patients/search', label: 'Patient Master Directory', icon: Search },
        { to: '/front-desk/registrations', label: 'All Registrations', icon: FileText },
        { to: '/front-desk/identity-review', label: 'Identity Review Queue', icon: UserCheck },
        { to: '/front-desk/emergency-registration', label: 'Emergency Intake', icon: AlertOctagon },
        { to: '/operations/opd-desk', label: 'Front-Desk Queue', icon: Layers },
        { to: '/finance/insurance', label: 'Policy Verification', icon: ShieldCheck },
        { to: '/leave/my-leave', label: 'My Leave Portal', icon: CalendarDays },
        { to: '/my-payroll', label: 'My Payroll Portal', icon: DollarSign },
        { to: '/my-payslips', label: 'My Payslips', icon: Receipt },
        { to: '/my-payroll/queries', label: 'Payroll Queries', icon: MessageSquare }
      ];
    }

    // Clinical Portal Nav (Doctors & Nurses)
    if (hasRole('DOCTOR', 'NURSE')) {
      return [
        { to: '/clinical/dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
        { to: '/operations/patient-records', label: 'Patient Longitudinal Dossier', icon: FileText },
        { to: '/operations/beds', label: 'Bed Inventory & Map', icon: BedDouble },
        { to: '/front-desk/patients/search', label: 'Patient Search', icon: Search },
        { to: '/clinical/appointments', label: 'Doctor Schedule', icon: Calendar },
        { to: '/clinical/opd-queue', label: 'OPD Queue', icon: Layers },
        { to: '/clinical/admissions', label: 'Admission Orders', icon: BedDouble },
        { to: '/clinical/discharges', label: 'Discharge Orders', icon: LogOut },
        { to: '/operations/admissions', label: 'Inpatient Bed Desk', icon: BedDouble },
        { to: '/front-desk/emergency-registration', label: 'Emergency Intake', icon: AlertOctagon },
        { to: '/operations/laboratory/orders', label: 'Diagnostic Lab Orders', icon: FlaskConical },
        { to: '/operations/laboratory/reports', label: 'Lab Diagnostic Reports', icon: FileText },
        { to: '/clinical/radiology', label: 'Radiology Orders', icon: Radio },
        { to: '/operations/pharmacy/prescriptions', label: 'Doctor Prescriptions', icon: Pill },
        { to: '/leave/my-leave', label: 'My Leave Portal', icon: CalendarDays },
        { to: '/my-payroll', label: 'My Payroll Portal', icon: DollarSign },
        { to: '/my-payslips', label: 'My Payslips', icon: Receipt },
        { to: '/my-payroll/queries', label: 'Payroll Queries', icon: MessageSquare }
      ];
    }

    // Pharmacy Portal Nav
    if (hasRole('PHARMACIST', 'SENIOR_PHARMACIST', 'PHARMACY_TECHNICIAN', 'PHARMACY_ASSISTANT')) {
      return [
        { to: '/operations/pharmacy', label: 'Pharmacy Dashboard', icon: LayoutDashboard },
        { to: '/operations/pharmacy/orders', label: 'Pharmacy Orders Queue', icon: Layers },
        { to: '/operations/pharmacy/prescriptions', label: 'Prescription Queue', icon: FileText },
        { to: '/operations/pharmacy/dispensing', label: 'Dispensing Console', icon: Pill },
        { to: '/operations/pharmacy/dispensing-history', label: 'Dispensing History', icon: History },
        { to: '/operations/pharmacy/medicines', label: 'Medicine Catalog', icon: Layers },
        { to: '/operations/pharmacy/alerts', label: 'Stock & Expiry Alerts', icon: AlertTriangle },
        { to: '/operations/pharmacy/returns', label: 'Pharmacy Returns', icon: Repeat },
        { to: '/operations/pharmacy/reports', label: 'Pharmacy Reports', icon: FileText },
        { to: '/operations/inventory', label: 'Medical Inventory Hub', icon: Warehouse },
        { to: '/leave/my-leave', label: 'My Leave Portal', icon: CalendarDays },
        { to: '/my-payroll', label: 'My Payroll Portal', icon: DollarSign },
        { to: '/my-payslips', label: 'My Payslips', icon: Receipt },
        { to: '/my-payroll/queries', label: 'Payroll Queries', icon: MessageSquare }
      ];
    }

    // Finance & Insurance Portal Nav
    if (hasRole('BILLING_STAFF', 'INSURANCE_REPRESENTATIVE')) {
      return [
        { to: '/finance/dashboard', label: 'Finance Dashboard', icon: LayoutDashboard },
        { to: '/finance/billing', label: 'Billing & Invoicing Desk', icon: CreditCard },
        { to: '/operations/patient-records', label: 'Patient Records & Claims', icon: FileText },
        { to: '/operations/beds', label: 'Bed Occupancy & Rates', icon: BedDouble },
        { to: '/operations/admissions', label: 'Inpatient Admissions', icon: BedDouble },
        { to: '/operations/discharges', label: 'Discharge & Invoices', icon: LogOut },
        { to: '/front-desk/patients/search', label: 'Patient Master Search', icon: Search },
        { to: '/finance/insurance', label: 'Policy Verification', icon: ShieldCheck },
        { to: '/finance/claims', label: 'Insurance Claims', icon: FileText },
        { to: '/leave/my-leave', label: 'My Leave Portal', icon: CalendarDays },
        { to: '/payroll', label: 'Payroll Dashboard', icon: DollarSign },
        { to: '/payroll/results', label: 'Payroll Results & Calc', icon: Banknote },
        { to: '/payroll/reports', label: 'Payroll Reports', icon: FileText },
        { to: '/my-payroll', label: 'My Payroll Portal', icon: DollarSign },
        { to: '/my-payslips', label: 'My Payslips', icon: Receipt },
        { to: '/my-payroll/queries', label: 'Payroll Queries', icon: MessageSquare }
      ];
    }

    // Administration & Management Portal Nav (Admin, HR, Procurement, Management)
    return [
      { to: '/admin/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
      { to: '/admin/staff/dashboard', label: 'Staff Master & HR Hub', icon: Users },
      { to: '/admin/staff', label: 'Staff Directory', icon: Briefcase },
      { to: '/admin/staff/access-requests', label: 'Staff Access Requests', icon: Shield },
      { to: '/admin/doctors/dashboard', label: 'Doctor Master & Admin', icon: Stethoscope },
      { to: '/admin/doctors', label: 'Doctor Directory', icon: Users },
      { to: '/admin/doctors/availability', label: 'Doctor Availability Grid', icon: Clock },
      { to: '/finance/billing', label: 'Billing & Financial Desk', icon: CreditCard },
      { to: '/finance/insurance', label: 'Policy Verification', icon: ShieldCheck },
      { to: '/finance/claims', label: 'Insurance Claims', icon: FileText },
      { to: '/operations/patient-records', label: 'Patient Records Master', icon: FileText },
      { to: '/operations/beds', label: 'Bed Management Hub', icon: BedDouble },
      { to: '/operations/admissions', label: 'Inpatient Admissions', icon: BedDouble },
      { to: '/operations/discharges', label: 'Discharge Processing', icon: LogOut },
      { to: '/operations/appointments', label: 'Appointment Desk', icon: Calendar },
      { to: '/front-desk/patients/search', label: 'Patient Master Directory', icon: Search },
      { to: '/front-desk/registrations', label: 'All Registrations', icon: FileText },
      { to: '/front-desk/identity-review', label: 'Identity Review Queue', icon: UserCheck },
      { to: '/admin/users', label: 'User & Role Master', icon: Users },
      { to: '/admin/rpa', label: 'RPA Automation Center', icon: Bot },
      { to: '/admin/exceptions', label: 'Exception Cases', icon: AlertTriangle },
      { to: '/admin/audit', label: 'Audit Timeline', icon: History },
      { to: '/admin/config', label: 'Hospital Business Rules', icon: Sliders },
      { to: '/attendance/dashboard', label: 'Attendance & Biometrics', icon: Clock },
      { to: '/attendance/daily', label: 'Daily Punch Ledger', icon: Calendar },
      { to: '/attendance/corrections', label: 'Attendance Corrections', icon: FileCheck },
      { to: '/attendance/reconciliation', label: 'Roster Reconciliation', icon: RefreshCw },
      { to: '/attendance/reports', label: 'Attendance Reports', icon: FileText },
      { to: '/shifts', label: 'Shift Management Hub', icon: CalendarDays },
      { to: '/shifts/definitions', label: 'Shift Definitions', icon: Clock },
      { to: '/shifts/rosters', label: 'Roster Scheduling Grid', icon: Calendar },
      { to: '/shifts/conflicts', label: 'Shift Conflict Queue', icon: AlertTriangle },
      { to: '/shifts/requests', label: 'Shift Changes & Swaps', icon: Repeat },
      { to: '/shifts/reports', label: 'Coverage & Shift Reports', icon: FileText },
      { to: '/my-schedule', label: 'My Shift Schedule', icon: Calendar },
      { to: '/employee/attendance', label: 'My Timesheet & Punches', icon: UserCheck },
      { to: '/employee/profile', label: 'My Staff Profile', icon: UserCheck },
      { to: '/leave', label: 'Leave Management Hub', icon: CalendarCheck },
      { to: '/leave/my-leave', label: 'My Leave Portal', icon: CalendarDays },
      { to: '/leave/approvals', label: 'Leave Approvals Queue', icon: FileCheck },
      { to: '/leave/calendar', label: 'Leave Calendar & Holidays', icon: Calendar },
      { to: '/leave/policies', label: 'Leave Policies & Types', icon: Sliders },
      { to: '/leave/reports', label: 'Leave Analytics & Reports', icon: FileText },
      { to: '/payroll', label: 'Payroll Management Hub', icon: Banknote },
      { to: '/payroll/periods', label: 'Payroll Periods & Cycle', icon: CalendarDays },
      { to: '/payroll/review', label: 'Payroll Input Audit', icon: FileCheck },
      { to: '/payroll/results', label: 'Payroll Results & Calc', icon: DollarSign },
      { to: '/payroll/salary-config', label: 'Salary Structures & Grades', icon: Sliders },
      { to: '/payroll/exceptions', label: 'Payroll Exceptions', icon: AlertTriangle },
      { to: '/payroll/reports', label: 'Payroll Reports & Register', icon: FileText },
      { to: '/operations/pharmacy', label: 'Pharmacy Management Hub', icon: Pill },
      { to: '/operations/pharmacy/orders', label: 'Pharmacy Orders Queue', icon: Layers },
      { to: '/operations/pharmacy/prescriptions', label: 'Prescription Queue', icon: FileText },
      { to: '/operations/pharmacy/dispensing', label: 'Dispensing Console', icon: Pill },
      { to: '/operations/pharmacy/dispensing-history', label: 'Dispensing History', icon: History },
      { to: '/operations/pharmacy/medicines', label: 'Medicine Catalog', icon: Layers },
      { to: '/operations/pharmacy/alerts', label: 'Stock & Expiry Alerts', icon: AlertTriangle },
      { to: '/operations/pharmacy/returns', label: 'Pharmacy Returns', icon: Repeat },
      { to: '/operations/pharmacy/reports', label: 'Pharmacy Reports', icon: FileText },
      { to: '/operations/inventory', label: 'Medical Inventory Hub', icon: Warehouse },
      { to: '/operations/inventory/items', label: 'Inventory Items Master', icon: Boxes },
      { to: '/operations/inventory/batches', label: 'Batch & Lot Registry', icon: Layers },
      { to: '/operations/inventory/goods-receipts', label: 'Goods Receipts (GRN)', icon: Truck },
      { to: '/operations/inventory/transfers', label: 'Stock Transfers & Requisitions', icon: Repeat },
      { to: '/operations/inventory/adjustments', label: 'Stock Adjustments & Shrinkage', icon: AlertTriangle },
      { to: '/operations/inventory/stock-counts', label: 'Physical Cycle Counts', icon: Sliders },
      { to: '/operations/inventory/reconciliations', label: 'Stock Reconciliations', icon: CheckCircle },
      { to: '/operations/inventory/alerts', label: 'Inventory Stock Alerts', icon: AlertTriangle },
      { to: '/operations/inventory/reports', label: 'Stock Valuation & Ledger', icon: FileText },
      { to: '/operations/procurement', label: 'Procurement Management Hub', icon: ShoppingBag },
      { to: '/operations/procurement/requests', label: 'Purchase Requests (PR)', icon: FileText },
      { to: '/operations/procurement/approvals', label: 'Procurement Approval Queue', icon: CheckSquare },
      { to: '/operations/procurement/rfqs', label: 'Requests for Quotation (RFQ)', icon: Layers },
      { to: '/operations/procurement/quotations', label: 'Vendor Quotation Registry', icon: FileSpreadsheet },
      { to: '/operations/procurement/comparisons', label: 'Quotation Comparison Matrix', icon: Award },
      { to: '/operations/procurement/purchase-orders', label: 'Purchase Orders (PO)', icon: FileText },
      { to: '/operations/procurement/deliveries', label: 'Delivery & Shipment Monitor', icon: Truck },
      { to: '/operations/procurement/invoices', label: 'Three-Way Invoice Matching', icon: FileCheck },
      { to: '/operations/procurement/exceptions', label: 'Procurement Exceptions Queue', icon: AlertTriangle },
      { to: '/operations/procurement/reports', label: 'Procurement Spend & Analytics', icon: BarChart3 },
      { to: '/operations/vendors', label: 'Vendor Management Hub', icon: Building2 },
      { to: '/operations/vendors/list', label: 'Vendor Master Directory', icon: Users },
      { to: '/operations/vendors/new', label: 'Vendor Onboarding & Reg', icon: UserPlus },
      { to: '/operations/vendors/documents', label: 'Vendor Compliance & Expiry', icon: FileCheck },
      { to: '/operations/vendors/contracts', label: 'Vendor Contracts & Renewals', icon: FileSpreadsheet },
      { to: '/operations/vendors/issues', label: 'Vendor Grievances & Issues', icon: AlertTriangle },
      { to: '/operations/laboratory', label: 'Laboratory Management Hub', icon: FlaskConical },
      { to: '/operations/laboratory/orders', label: 'Lab Orders & Accessioning', icon: FileText },
      { to: '/operations/laboratory/verification', label: 'Pathologist Review Queue', icon: ShieldCheck },
      { to: '/operations/laboratory/reports', label: 'Diagnostic Reports Archive', icon: FileCheck },
      { to: '/operations/laboratory/analytics', label: 'Lab Analytics & TAT', icon: BarChart3 },
      { to: '/my-payroll', label: 'My Payroll Portal', icon: DollarSign },
      { to: '/my-payslips', label: 'My Payslips', icon: Receipt },
      { to: '/my-payroll/queries', label: 'Payroll Queries', icon: MessageSquare }
    ];
  };

  const navLinks = getNavLinks();

  return (
    <aside
      style={{
        width: '260px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 70px)',
        padding: '1.5rem 1rem'
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: '1rem',
          paddingLeft: '0.75rem'
        }}
      >
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
