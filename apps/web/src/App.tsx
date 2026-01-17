import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { OnboardingGuard } from '@/routes/OnboardingGuard';
import { AppShell } from '@/components/layout/AppShell';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage';

// Main pages
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ContactsPage } from '@/pages/contacts/ContactsPage';
import { ContactDetailPage } from '@/pages/contacts/ContactDetailPage';
import { DealsPage } from '@/pages/deals/DealsPage';
import { DealDetailPage } from '@/pages/deals/DealDetailPage';
import { ActivitiesPage } from '@/pages/ActivitiesPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback/:provider" element={<OAuthCallbackPage />} />

        {/* Onboarding - protected but outside AppShell */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected routes with AppShell */}
        <Route
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <AppShell />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contacts/:id" element={<ContactDetailPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="deals/:id" element={<DealDetailPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="settings/*" element={<SettingsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
