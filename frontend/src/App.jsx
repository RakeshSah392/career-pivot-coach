import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

// Pages
import { LandingPage } from './pages/LandingPage.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ResumeUploadPage } from './pages/ResumeUploadPage.jsx';
import { AnalysisPage } from './pages/AnalysisPage.jsx';
import { RoadmapPage } from './pages/RoadmapPage.jsx';
import { InterviewPage } from './pages/InterviewPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
          <Navbar />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto py-6">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Protected Workspace Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume"
                element={
                  <ProtectedRoute>
                    <ResumeUploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analysis"
                element={
                  <ProtectedRoute>
                    <AnalysisPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roadmap"
                element={
                  <ProtectedRoute>
                    <RoadmapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interviews"
                element={
                  <ProtectedRoute>
                    <InterviewPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/interview" element={<Navigate to="/interviews" replace />} />

              {/* 404 Catch-All */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

