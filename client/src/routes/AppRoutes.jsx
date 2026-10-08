import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalLayout } from '../layouts/PortalLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { RpaDashboardPage } from '../pages/RpaDashboardPage';
import { ExceptionsPage } from '../pages/ExceptionsPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { HospitalConfigPage } from '../pages/HospitalConfigPage';
import { UsersMasterPage } from '../pages/UsersMasterPage';

// Module 1: Patient Registration Pages
import { OnlineRegistrationPage } from '../pages/patient/OnlineRegistrationPage';
import { RegistrationSuccessPage } from '../pages/patient/RegistrationSuccessPage';
import { PatientProfilePage } from '../pages/patient/PatientProfilePage';
import { PatientVisitsPage } from '../pages/patient/PatientVisitsPage';
import { FrontDeskRegistrationPage } from '../pages/operations/FrontDeskRegistrationPage';
import { PatientSearchPage } from '../pages/operations/PatientSearchPage';
import { PatientDetailPage } from '../pages/operations/PatientDetailPage';
import { IdentityReviewPage } from '../pages/operations/IdentityReviewPage';
import { EmergencyRegistrationPage } from '../pages/operations/EmergencyRegistrationPage';
import { RegistrationsListPage } from '../pages/operations/RegistrationsListPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<OnlineRegistrationPage />} />
      <Route path="/register/success" element={<RegistrationSuccessPage />} />

      {/* Authenticated Portal Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Portal-specific Dashboard Aliases */}
        <Route path="patient/dashboard" element={<Dashboard />} />
        <Route path="clinical/dashboard" element={<Dashboard />} />
        <Route path="operations/dashboard" element={<Dashboard />} />
        <Route path="finance/dashboard" element={<Dashboard />} />
        <Route path="admin/dashboard" element={<Dashboard />} />

        {/* Module 1: Patient Self-Service Portal Routes */}
        <Route
          path="patient/profile"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patient/visits"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SYSTEM_ADMIN']}>
              <PatientVisitsPage />
            </ProtectedRoute>
          }
        />

        {/* Module 1: Operations & Front-Desk Routes */}
        <Route
          path="front-desk/registration"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <FrontDeskRegistrationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operations/registration"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <FrontDeskRegistrationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/patients/search"
          element={
            <ProtectedRoute>
              <PatientSearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/patients/:patientId"
          element={
            <ProtectedRoute>
              <PatientDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/registrations"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN', 'HOSPITAL_MANAGEMENT']}>
              <RegistrationsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/identity-review"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <IdentityReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="front-desk/emergency-registration"
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'DOCTOR', 'NURSE', 'ADMIN_MANAGER', 'SYSTEM_ADMIN']}>
              <EmergencyRegistrationPage />
            </ProtectedRoute>
          }
        />

        {/* Administrative & Cross-Module Platform Centers */}
        <Route
          path="admin/rpa"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <RpaDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/exceptions"
          element={
            <ProtectedRoute>
              <ExceptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HOSPITAL_MANAGEMENT']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/config"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER']}>
              <HospitalConfigPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN_MANAGER', 'HR_MANAGER']}>
              <UsersMasterPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
