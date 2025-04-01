// src/App.js
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

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link to="/" className="flex items-center group cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold group-hover:bg-orange-600 transition-colors duration-150">AG</div>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-orange-600 group-hover:text-orange-700 transition-colors duration-150">Avurudu Games 2025</h1>
                  <p className="text-sm text-gray-500">New Year Celebrations</p>
                </div>
              </Link>

              <div className="flex space-x-2">
                <a href="/admin" className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-orange-100">
                  Admin Panel
                </a>
              </div>
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

        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500">
              © 2025 New Zealand Sri Lanka Buddhist Trust. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;