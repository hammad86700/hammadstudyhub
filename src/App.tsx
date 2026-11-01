// ==============================================================================
// HAMMAD STUDYHUB — MAIN APPLICATION ROUTER & PROVIDERS
// Architect: Muhammad Hammad
// ==============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public & Student Pages
import { PublicHomePage } from './pages/PublicHomePage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { SubjectDetailPage } from './pages/SubjectDetailPage';
import { ResourceDetailPage } from './pages/ResourceDetailPage';
import { SearchPage } from './pages/SearchPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { RecentPage } from './pages/RecentPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AboutPage } from './pages/AboutPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { StudentSignupPage } from './pages/StudentSignupPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { ChatPage } from './pages/ChatPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminSubjectsPage } from './pages/admin/AdminSubjectsPage';
import { AdminResourcesPage } from './pages/admin/AdminResourcesPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { initRealtimeSync } from './lib/realtimeSync';

// Configure TanStack Query with aggressive multi-device sync settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 2, // 2 seconds fresh
      refetchOnWindowFocus: true, // Auto-sync immediately when returning to laptop window
      refetchOnReconnect: true, // Auto-sync when reconnecting to network
      retry: 1,
    },
  },
});

/**
 * Root Route Handler:
 * - If user is logged in -> lands directly on Student Dashboard (/dashboard)
 * - If user is not logged in -> displays the Public Website (clean platform introduction & features)
 */
const RootRoute: React.FC = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-3 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return <PublicHomePage />;
};

export const App: React.FC = () => {
  React.useEffect(() => {
    const cleanup = initRealtimeSync(queryClient);
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Main Application Experience */}
              <Route element={<PublicLayout />}>
                {/* Public vs Student Root Entrypoint */}
                <Route path="/" element={<RootRoute />} />

                {/* Protected Student Learning Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <StudentDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Academic Courses & Materials */}
                <Route
                  path="/subjects"
                  element={
                    <ProtectedRoute>
                      <SubjectsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subjects/:slug"
                  element={
                    <ProtectedRoute>
                      <SubjectDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resources/:id"
                  element={
                    <ProtectedRoute>
                      <ResourceDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <SearchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookmarks"
                  element={
                    <ProtectedRoute>
                      <BookmarksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recent"
                  element={
                    <ProtectedRoute>
                      <RecentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />

                {/* Public Informational Pages */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/signup" element={<StudentSignupPage />} />
                <Route path="/login" element={<StudentLoginPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Protected Administrator & Representative Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="subjects" element={<AdminSubjectsPage />} />
                <Route path="resources" element={<AdminResourcesPage />} />
                <Route path="announcements" element={<AdminAnnouncementsPage />} />
                <Route path="students" element={<AdminStudentsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
