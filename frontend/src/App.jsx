import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import SearchPage from './pages/SearchPage';
import CaseViewerPage from './pages/CaseViewerPage';
import DraftAssistantPage from './pages/DraftAssistantPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BookmarksPage from './pages/BookmarksPage';
import CaseUploadPage from './pages/CaseUploadPage';
import VerifyDocumentPage from './pages/VerifyDocumentPage';
import CaseComparePage from './pages/CaseComparePage';

/**
 * HomePage — Landing page with role-based redirect for authenticated users
 */
function HomePage() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    const staffRoles = ['senior_staff', 'junior_staff', 'court_staff', 'staff'];
    if (staffRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/search" replace />;
  }

  return <Navigate to="/login" replace />;
}

/**
 * App component — defines all application routes with role-based access control.
 *
 * Route structure:
 * - Public: /login, /register, /search (public view), /unauthorized
 * - Authenticated: /search (full), /cases/:id, /bookmarks
 * - Advocate: /drafts
 * - Staff: /dashboard, /upload
 */
function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoadingSpinner size="lg" message="Initializing Lexguard..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<HomePage />} />

      {/* Public routes (no auth required) */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

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

        {/* Bookmarks — advocate, scholar, staff */}
        <Route path="/bookmarks" element={
          <ProtectedRoute allowedRoles={['senior_staff', 'junior_staff', 'court_staff', 'staff', 'advocate', 'scholar']}>
            <BookmarksPage />
          </ProtectedRoute>
        } />

        {/* Draft Assistant — advocate only */}
        <Route path="/drafts" element={
          <ProtectedRoute allowedRoles={['advocate', 'senior_staff', 'staff']}>
            <DraftAssistantPage />
          </ProtectedRoute>
        } />

        {/* Staff routes */}
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
      </Route>

      {/* Catch-all — redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
