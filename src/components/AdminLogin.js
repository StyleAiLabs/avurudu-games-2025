// src/components/AdminLogin.js
import React, { useState } from 'react';
import { User, Lock, Shield } from 'lucide-react';

const AdminLogin = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({
        username: 'admin',  // Pre-filled with default username
        password: 'pass@123'  // Pre-filled with default password
    });

    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials({
            ...credentials,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Log authentication attempt
            console.log('Attempting login with:', credentials);

            // Try a simpler test endpoint first
            const response = await fetch('/api/admin/auth-test', {
                headers: {
                    'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Auth test failed:', response.status, errorData);

                if (response.status === 401) {
                    throw new Error('Invalid username or password');
                }
                throw new Error('An error occurred while trying to login');
            }

            // Authentication successful
            console.log('Authentication successful');
            onLogin(credentials);
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-300px)]">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
                <div className="bg-orange-600 p-6 text-white">
                    <div className="flex items-center justify-center mb-4">
                        <Shield className="h-12 w-12" />
                    </div>
                    <h2 className="text-xl font-bold text-center">Admin Login</h2>
                    <p className="text-orange-100 text-center mt-1">Enter your credentials to access the admin panel</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 p-4 rounded-md text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                value={credentials.username}
                                onChange={handleChange}
                                required
                                className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 sm:text-sm"
                                placeholder="admin"
                            />
                            <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500" aria-hidden="true"></div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                                className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 sm:text-sm"
                                placeholder="••••••••"
                            />
                            <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500" aria-hidden="true"></div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-150"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Logging in...
                                </>
                            ) : (
                                'Log in'
                            )}
                        </button>
                    </div>
                </form>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-center text-gray-500">Default credentials: admin / pass@123</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;