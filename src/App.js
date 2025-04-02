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
                  <div className="h-12 w-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold group-hover:bg-orange-600 transition-colors duration-150">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M15.75 8.25a.75.75 0 01.75.75c0 1.12-.492 2.126-1.27 2.812a.75.75 0 11-.992-1.124A2.243 2.243 0 0015 9a.75.75 0 01.75-.75z" />
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM4.575 15.6a8.25 8.25 0 009.348 4.425 1.966 1.966 0 00-1.84-1.275.983.983 0 01-.97-.822l-.073-.437c-.094-.565.25-1.11.8-1.267l.99-.282c.427-.123.783-.418.982-.816l.036-.073a1.453 1.453 0 012.328-.377L16.5 15.9l.4.5c.92.595.92 1.583.002 2.18l-.223.183a.75.75 0 01-.99.024l-.172-.129a8.25 8.25 0 00-3.658-.99 8.259 8.259 0 01-4.51-.64l-.112-.056a8.25 8.25 0 01-2.662-5.872zm12.1-3.6a.75.75 0 01.674.421 8.25 8.25 0 01-1.256 8.565 8.25 8.25 0 01-7.735 2.691.75.75 0 11.262-1.477 6.75 6.75 0 007.311-9.094.75.75 0 01.744-.806zm-8.223 3.194a.75.75 0 01.421.387.75.75 0 00.5.398.75.75 0 01.578.384l.185.39a.75.75 0 01-.156.874.75.75 0 01-.874.156 2.583 2.583 0 00-.62-.161.75.75 0 11.308-1.47.75.75 0 00-.342.462z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-orange-600 group-hover:text-orange-700 transition-colors duration-150">Avurudu Games 2025</h1>
                  <p className="text-sm text-gray-500">New Year Celebrations</p>
                </div>
              </Link>

              {/* Admin panel link removed */}
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
