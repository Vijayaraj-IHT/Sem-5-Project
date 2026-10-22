import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import SearchPage from './pages/SearchPage';
import CaseViewerPage from './pages/CaseViewerPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BookmarksPage from './pages/BookmarksPage';
import CaseUploadPage from './pages/CaseUploadPage';
import VerifyDocumentPage from './pages/VerifyDocumentPage';
import CaseComparePage from './pages/CaseComparePage';
import ActsExplorerPage from './pages/ActsExplorerPage';
import CaseReviewPage from './pages/CaseReviewPage';
import AuditLedgerPage from './pages/AuditLedgerPage';
import ProfilePage from './pages/ProfilePage';

/**
 * App component — defines all application routes with role-based access control.
 *
 * Route structure:
 * - Public: /, /login, /register, /acts, /search/public, /verify/public, /unauthorized
 * - Authenticated: /search, /cases/:id, /compare, /verify, /acts, /bookmarks, /profile
 * - Staff Moderation: /review/:caseId, /admin/audit, /dashboard, /upload
 */
function ActsRouteWrapper() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return (
      <DashboardLayout>
        <ActsExplorerPage />
      </DashboardLayout>
    );
  }
  return (
    <PublicLayout>
      <ActsExplorerPage />
    </PublicLayout>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <LoadingSpinner size="lg" message="Initializing Lexguard Judicial Repository..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public landing page with e-Courts service grid */}
      <Route path="/" element={<LandingPage />} />

      {/* Public routes (no auth required) */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Adaptive statutory explorer (renders DashboardLayout if authenticated, PublicLayout if visitor) */}
      <Route path="/acts" element={<ActsRouteWrapper />} />

      {/* Public search (accessible to all, including unauthenticated) */}
      <Route path="/search/public" element={
        <PublicLayout>
          <SearchPage />
        </PublicLayout>
      } />

      {/* Public document verifier */}
      <Route path="/verify/public" element={
        <PublicLayout>
          <VerifyDocumentPage />
        </PublicLayout>
      } />

      {/* Authenticated routes with dashboard layout */}
      <Route element={
        <ProtectedRoute allowedRoles={['senior_staff', 'junior_staff', 'court_staff', 'staff', 'advocate', 'scholar', 'public']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        {/* Search — all authenticated roles */}
        <Route path="/search" element={<SearchPage />} />

        {/* Document Verifier — all authenticated roles */}
        <Route path="/verify" element={<VerifyDocumentPage />} />

        {/* Precedent Comparator — all authenticated roles */}
        <Route path="/compare" element={<CaseComparePage />} />

        {/* Case viewer — all authenticated roles */}
        <Route path="/cases/:caseId" element={<CaseViewerPage />} />

        {/* User Profile — all authenticated roles */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Bookmarks — advocate, scholar, staff */}
        <Route path="/bookmarks" element={
          <ProtectedRoute allowedRoles={['senior_staff', 'junior_staff', 'court_staff', 'staff', 'advocate', 'scholar']}>
            <BookmarksPage />
          </ProtectedRoute>
        } />

        {/* Court Staff Moderation & Audit routes */}
        <Route path="/review/:caseId" element={
          <ProtectedRoute allowedRoles={['senior_staff', 'junior_staff', 'court_staff', 'staff']}>
            <CaseReviewPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/audit" element={
          <ProtectedRoute allowedRoles={['senior_staff', 'court_staff', 'staff']}>
            <AuditLedgerPage />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['senior_staff', 'junior_staff', 'court_staff', 'staff']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/upload" element={
          <ProtectedRoute allowedRoles={['senior_staff', 'junior_staff', 'court_staff', 'staff']}>
            <CaseUploadPage />
          </ProtectedRoute>
        } />

        {/* Legacy redirect for approval queue */}
        <Route path="/approval-queue" element={<Navigate to="/dashboard?tab=queue" replace />} />
      </Route>

      {/* Catch-all — redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
