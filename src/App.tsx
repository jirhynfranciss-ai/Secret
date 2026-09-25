import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ProtectedRoute, PublicOnlyRoute } from '@/routes/ProtectedRoute';
import { isConfigured } from '@/lib/supabase';
import { SetupBanner } from '@/components/SetupBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy load page chunks
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const QuestionnairePage = lazy(() => import('@/pages/QuestionnairePage'));

// App layout + pages
const AppLayout = lazy(() => import('@/layouts/AppLayout'));
const HomePage = lazy(() => import('@/pages/app/HomePage'));
const StoryPage = lazy(() => import('@/pages/app/StoryPage'));
const MessagesPage = lazy(() => import('@/pages/app/MessagesPage'));
const NotificationsPage = lazy(() => import('@/pages/app/NotificationsPage'));
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage'));

// Admin layout + pages
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const ResponsesPage = lazy(() => import('@/pages/admin/ResponsesPage'));
const ConversationsPage = lazy(() => import('@/pages/admin/ConversationsPage'));
const QuestionsPage = lazy(() => import('@/pages/admin/QuestionsPage'));
const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const AdminProfilePage = lazy(() => import('@/pages/admin/AdminProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider />
        {!isConfigured && <SetupBanner />}
        <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/questionnaire" element={<QuestionnairePage />} />

            {/* Auth routes (redirect if already logged in) */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <AuthPage />
                </PublicOnlyRoute>
              }
            />

            {/* Auth callback for password reset - detect hash fragments */}
            <Route
              path="/auth/callback"
              element={<AuthPage />}
            />
            <Route
              path="/auth/reset-password"
              element={<AuthPage />}
            />

            {/* User app routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute requiredRole="user">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="story" element={<StoryPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="responses" element={<ResponsesPage />} />
              <Route path="conversations" element={<ConversationsPage />} />
              <Route path="questions" element={<QuestionsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<AdminProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
