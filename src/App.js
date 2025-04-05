// src/App.js - Modified with header background image
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCredentials, setAuthCredentials] = useState({ username: '', password: '' });

  const handleLogin = (credentials) => {
    setAuthCredentials(credentials);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthCredentials({ username: '', password: '' });
    setIsAuthenticated(false);
  };

  // Header background style
  const headerStyle = {
    backgroundImage: "url('/images/avurudu-header-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    position: "relative"  // Add position relative for the overlay
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
        <header className="bg-cover bg-center bg-no-repeat relative" style={headerStyle}>
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex justify-between items-center py-6">
              <Link to="/" className="flex items-center group cursor-pointer">
                <div className="flex-shrink-0">

                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-white text-shadow-lg group-hover:text-orange-200 transition-colors duration-150">Avurudu Games 2025</h1>
                  <p className="text-sm text-white text-shadow-md">Sri Lankan New Year Celebration</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="py-6">
          <Routes>
            <Route path="/" element={<RegistrationForm />} />
            <Route
              path="/admin"
              element={
                isAuthenticated ?
                  <AdminPanel authCredentials={authCredentials} onLogout={handleLogout} /> :
                  <AdminLogin onLogin={handleLogin} />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-gradient-to-r from-orange-50 to-yellow-50 border-t border-orange-200 py-6 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-xs text-gray-500">
              © 2025 New Zealand Sri Lanka Buddhist Trust.
              All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;