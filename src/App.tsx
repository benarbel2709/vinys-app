import { lazy, Suspense } from "react";
import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AppProvider, useApp } from "@/context/AppContext";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import Home from "./pages/Home";
import CookieConsent from "./components/CookieConsent";
import StageTransitionModal from "./components/StageTransitionModal";
import { useGoogleAnalytics } from "@/lib/analytics";

// Lazy-loaded routes
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const OnboardingWizard = lazy(() => import("./pages/onboarding/OnboardingWizard"));
const MedicalStop = lazy(() => import("./pages/onboarding/MedicalStop"));
const AllClear = lazy(() => import("./pages/onboarding/AllClear"));
const SetupReactivity = lazy(() => import("./pages/onboarding/SetupReactivity"));
const SetupPainDuration = lazy(() => import("./pages/onboarding/SetupPainDuration"));
const Plan = lazy(() => import("./pages/Plan"));
const Workout = lazy(() => import("./pages/Workout"));
const QuickCheckin = lazy(() => import("./pages/QuickCheckin"));
const CheckinPage = lazy(() => import("./pages/CheckinPage"));
const CompletePage = lazy(() => import("./pages/CompletePage"));
const Stop = lazy(() => import("./pages/Stop"));
const ExpertReview = lazy(() => import("./pages/ExpertReview"));
const AuditExport = lazy(() => import("./pages/AuditExport"));
const ClinicalExport = lazy(() => import("./pages/ClinicalExport"));
const Library = lazy(() => import("./pages/Library"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminVideos = lazy(() => import("./pages/AdminVideos"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DevExportEngineData = lazy(() => import("./pages/DevExportEngineData"));
const About = lazy(() => import("./pages/About"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ExerciseLibrary = lazy(() => import("./pages/ExerciseLibrary"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const DemoSample = lazy(() => import("./pages/DemoSample"));

const queryClient = new QueryClient();

/** Only allow access to /plan etc. if onboarding is done */
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (!state.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

/** If onboarding is already completed, redirect /onboarding to /plan */
function OnboardingRedirectGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  // Hard wall override: ?track=full forces re-onboarding even if already completed.
  const forceFullTrack = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("track") === "full";
  if (state.onboardingCompleted && !forceFullTrack) {
    return <Navigate to="/plan" replace />;
  }
  return <>{children}</>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isGuest } = useAuthContext();
  if (loading) return null;
  if (!user && !isGuest) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

function AppRoutes() {
  useGoogleAnalytics();
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SentryRoutes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Home />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route path="/try" element={<DemoSample />} />

        <Route path="/onboarding" element={<OnboardingRedirectGuard><OnboardingWizard /></OnboardingRedirectGuard>} />
        <Route path="/onboarding/medical-stop" element={<MedicalStop />} />
        <Route path="/onboarding/all-clear" element={<AllClear />} />
        <Route path="/onboarding/setup-reactivity" element={<SetupReactivity />} />
        <Route path="/onboarding/setup-pain-duration" element={<SetupPainDuration />} />

        <Route path="/conditions" element={<Navigate to="/onboarding" replace />} />
        <Route path="/setup" element={<Navigate to="/onboarding" replace />} />
        <Route path="/questionnaire" element={<Navigate to="/onboarding" replace />} />

        <Route path="/plan" element={<AuthGuard><OnboardingGuard><Plan /></OnboardingGuard></AuthGuard>} />
        <Route path="/workout/:sessionId?" element={<AuthGuard><Workout /></AuthGuard>} />
        <Route path="/checkin/:sessionId" element={<AuthGuard><OnboardingGuard><CheckinPage /></OnboardingGuard></AuthGuard>} />
        <Route path="/check-in" element={<AuthGuard><QuickCheckin /></AuthGuard>} />
        <Route path="/complete" element={<AuthGuard><OnboardingGuard><CompletePage /></OnboardingGuard></AuthGuard>} />
        <Route path="/stop" element={<AuthGuard><Stop /></AuthGuard>} />
        <Route path="/exercises" element={<ExerciseLibrary />} />
        <Route path="/library" element={<AuthGuard><Library /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
        <Route path="/expert-review" element={<AuthGuard><ExpertReview /></AuthGuard>} />
        <Route path="/audit-export" element={<AuthGuard><AuditExport /></AuthGuard>} />
        <Route path="/clinical-export" element={<AuthGuard><ClinicalExport /></AuthGuard>} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />
        <Route path="/admin/videos" element={<AuthGuard><AdminVideos /></AuthGuard>} />
        <Route path="/upload" element={<UploadPage />} />
        {import.meta.env.DEV && <Route path="/dev/export-engine-data" element={<DevExportEngineData />} />}
        <Route path="*" element={<NotFound />} />
      </SentryRoutes>
    </Suspense>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AppProvider>
            <BrowserRouter>
              <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-background focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-foreground focus:ring-2 focus:ring-primary">
                Skip to main content
              </a>
              <AppRoutes />
              <CookieConsent />
              <StageTransitionModal />
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
