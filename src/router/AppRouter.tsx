import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import AppLayout from '../components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const UsersPage = lazy(() => import('../pages/users/UsersPage'));
const OrganizationsPage = lazy(() => import('../pages/organizations/OrganizationsPage'));
const MinesPage = lazy(() => import('../pages/mines/MinesPage'));
const BatchesPage = lazy(() => import('../pages/batches/BatchesPage'));
const BatchDetailPage = lazy(() => import('../pages/batches/BatchDetailPage'));
const MovementsPage = lazy(() => import('../pages/movements/MovementsPage'));
const VerificationPage = lazy(() => import('../pages/verification/VerificationPage'));
const FraudPage = lazy(() => import('../pages/fraud/FraudPage'));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'));
const AuditLogsPage = lazy(() => import('../pages/audit/AuditLogsPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('../pages/errors/UnauthorizedPage'));

const PageLoader = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
  </div>
);

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            
            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route path={ROUTES.USERS} element={<UsersPage />} />
              <Route path={ROUTES.ORGANIZATIONS} element={<OrganizationsPage />} />
              <Route path={ROUTES.FRAUD} element={<FraudPage />} />
              <Route path={ROUTES.AUDIT_LOGS} element={<AuditLogsPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['ADMIN', 'MINE_OFFICER']} />}>
              <Route path={ROUTES.MINES} element={<MinesPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['ADMIN', 'MINE_OFFICER', 'SUPPLY_OFFICER']} />}>
              <Route path={ROUTES.BATCHES} element={<BatchesPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['ADMIN', 'SUPPLY_OFFICER']} />}>
              <Route path={ROUTES.MOVEMENTS} element={<MovementsPage />} />
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            </Route>

            {/* Accessible by all authenticated users, but specific actions inside might be gated */}
            <Route path="/batches/:id" element={<BatchDetailPage />} />
            <Route path={ROUTES.VERIFICATION} element={<VerificationPage />} />
            <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            
            <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
