import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import ReactGA from 'react-ga4';
import Header from './components/Header';
import Footer from './components/Footer';
import Chat from './pages/Chat';
import Report from './pages/Report';
import Auth from './components/Auth';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Initialize Google Analytics
ReactGA.initialize('G-PVS6MMBEL3'); // Replace with your actual GA4 Measurement ID

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <AppContent user={user} />
      </Router>
    </ErrorBoundary>
  );
}

// Separate component to use useLocation hook
const AppContent = ({ user }) => {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search });
  }, [location]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <Header user={user} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
          <Route
            path="/"
            element={user ? <Chat /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/report/:interviewId"
            element={user ? <Report /> : <Navigate to="/auth" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;