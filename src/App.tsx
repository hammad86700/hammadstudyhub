// ==============================================================================
// HAMMAD STUDYHUB — MAIN APPLICATION ROUTER & PROVIDERS
// Architect: Muhammad Hammad
// ==============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public & Student Pages
import { HomePage } from './pages/HomePage';
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

// Configure TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Application Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/subjects/:slug" element={<SubjectDetailPage />} />
                <Route path="/resources/:id" element={<ResourceDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/bookmarks" element={<BookmarksPage />} />
                <Route path="/recent" element={<RecentPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/signup" element={<StudentSignupPage />} />
                <Route path="/login" element={<StudentLoginPage />} />
                <Route path="/chat" element={<ChatPage />} />
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
