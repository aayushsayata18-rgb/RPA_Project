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

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

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

        {/* Fallback for module routes coming in subsequent steps */}
        <Route path="*" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
