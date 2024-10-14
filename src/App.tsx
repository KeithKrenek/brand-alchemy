import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Chat from './pages/Chat';
import Report from './pages/Report';

function App() {
  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      // Optionally, you can check if the session is still valid here
      // For now, we'll assume it's valid if it exists
    }
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/report/:sessionId" element={<Report />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;