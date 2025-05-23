// src/components/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, Phone, Filter, Download, Printer, RefreshCw, LogOut, Gamepad, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import GameManagement from './GameManagement';
import config from '../config';

const AdminPanel = ({ authCredentials, onLogout }) => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAgeGroup, setFilterAgeGroup] = useState('');
    const [activeTab, setActiveTab] = useState('participants'); // 'participants' or 'games'
    const [filterGame, setFilterGame] = useState('');
    const [deletingParticipants, setDeletingParticipants] = useState(new Set());

    const ageGroups = [
        'All Ages',
        'Under 5',
        'Under 6',
        '6-12 yrs',
        '7-12 yrs',
        'Under 12',
        '12-15 yrs',
        'ADULTS'
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(20); // Set to display 20 records per page

    // Fetch data from the server with authentication
    const fetchParticipants = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching participants with auth...');
            const response = await fetch(`${config.apiUrl}/api/admin/participants`, {
                headers: {
                    'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    onLogout();
                    throw new Error('Your session has expired. Please log in again.');
                }
                throw new Error('Failed to fetch participants');
            }

            const data = await response.json();
            console.log('Participants data received:', data);
            console.log('Data type:', typeof data, Array.isArray(data) ? 'Array' : 'Not an array');

            // Make sure the data is in the expected format
            if (Array.isArray(data)) {
                setParticipants(data);
                console.log('Updated participants state with', data.length, 'participants');
            } else {
                console.error('Data is not an array as expected:', data);
                setParticipants([]);
            }
        } catch (error) {
            console.error('Error fetching participants:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'participants') {
            fetchParticipants();
        }

        // Refresh data every 30 seconds if on participants tab
        let interval;
        if (activeTab === 'participants') {
            interval = setInterval(fetchParticipants, 30000);
        }

        // Clean up on component unmount or tab change
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [authCredentials, activeTab]); // Re-fetch when credentials change or tab changes

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter participants based on search term and age group
    const filteredParticipants = participants.filter(participant => {
        // First ensure the participant is a valid object
        if (!participant || typeof participant !== 'object') {
            console.log('Invalid participant object:', participant);
            return false;
        }

        // Check if firstName/first_name exists before using toLowerCase
        const firstNameMatch =
            (participant.firstName && searchTerm ?
                participant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
            (participant.first_name && searchTerm ?
                participant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) : false);

        // Check if lastName/last_name exists before using toLowerCase
        const lastNameMatch =
            (participant.lastName && searchTerm ?
                participant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
            (participant.last_name && searchTerm ?
                participant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) : false);

        // Check if contactNumber/contact_number exists
        const contactMatch =
            (participant.contactNumber && searchTerm ?
                participant.contactNumber.includes(searchTerm) : false) ||
            (participant.contact_number && searchTerm ?
                participant.contact_number.includes(searchTerm) : false);

        const matchesSearch = !searchTerm || firstNameMatch || lastNameMatch || contactMatch;

        // Check age group match, supporting both camelCase and snake_case
        const matchesAgeGroup = !filterAgeGroup ||
            participant.ageGroup === filterAgeGroup ||
            participant.age_group === filterAgeGroup;

        // Add game filter
        const matchesGame = !filterGame ||
            (participant.games && Array.isArray(participant.games) && participant.games.includes(filterGame));

        return matchesSearch && matchesAgeGroup && matchesGame;
    });

    // Add pagination calculation variables
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredParticipants.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredParticipants.length / recordsPerPage);

    // Add pagination function
    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            // Scroll to top of table when page changes
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Update the deleteParticipant function
    const deleteParticipant = async (participantId) => {
        if (!window.confirm('Are you sure you want to delete this participant? This action cannot be undone.')) {
            return;
        }

        setDeletingParticipants(prev => new Set([...prev, participantId]));

        try {
            const response = await fetch(`${config.apiUrl}/api/admin/participants/${participantId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete participant');
            }

            setParticipants(participants.filter(p => p.id !== participantId));
        } catch (error) {
            console.error('Error deleting participant:', error);
            alert('Failed to delete participant. Please try again.');
        } finally {
            setDeletingParticipants(prev => {
                const next = new Set(prev);
                next.delete(participantId);
                return next;
            });
        }
    };

    // Handle CSV export
    const exportToCSV = () => {
        // Create CSV content
        const headers = ['ID', 'First Name', 'Last Name', 'Contact Number', 'Age Group', 'Registration Date', 'Games'];
        const csvRows = [headers];

        filteredParticipants.forEach(participant => {
            const row = [
                participant.id,
                participant.firstName || participant.first_name || '',
                participant.lastName || participant.last_name || '',
                participant.contactNumber || participant.contact_number || '',
                participant.ageGroup || participant.age_group || '',
                participant.registrationDate || participant.registration_date || '',
                (participant.games && Array.isArray(participant.games)) ? participant.games.join(', ') : ''
            ];
            csvRows.push(row);
        });

        // Convert to CSV string
        const csvContent = csvRows.map(row => row.join(',')).join('\n');

        // Create a blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'avurudu_games_registrations.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle print function
    const printReport = () => {
        window.print();
    };

    // Add this after other function declarations
    const resetFilters = () => {
        setSearchTerm('');
        setFilterGame('');
        setFilterAgeGroup('');
    };

    // Render loading state
    if (loading && participants.length === 0 && activeTab === 'participants') {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-gray-700">Loading participants...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error && activeTab === 'participants') {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-md w-full">
                    <h3 className="text-red-800 font-bold text-lg">Error loading data</h3>
                    <p className="text-red-700 mt-2">{error}</p>
                    <button
                        onClick={fetchParticipants}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center w-full"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    console.log('About to render. Total participants:', participants.length);
    console.log('Filtered participants:', filteredParticipants.length);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-orange-50 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-orange-700">Admin Panel</h1>
                            <p className="text-sm text-gray-600 mt-1">Manage registrations and games</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                            <LogOut className="h-4 w-4 mr-1.5" />
                            Logout
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-gray-100 px-6 py-2 border-b border-gray-200">
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setActiveTab('participants')}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'participants'
                                    ? 'bg-orange-600 text-white'
                                    : 'text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                                    } transition-colors duration-150`}
                            >
                                Participant Registrations
                            </button>
                            <button
                                onClick={() => setActiveTab('games')}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'games'
                                    ? 'bg-orange-600 text-white'
                                    : 'text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                                    } transition-colors duration-150`}
                            >
                                Game Management
                            </button>
                        </div>
                    </div>

                    {/* Content based on active tab */}
                    <div className="p-6">
                        {activeTab === 'participants' ? (
                            <div>
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search by name or phone..."
                                            className="appearance-none pl-10 pr-4 py-3 block w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 sm:text-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500" aria-hidden="true"></div>
                                    </div>

                                    {/* Add game filter */}
                                    <div className="sm:w-48">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Gamepad className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <select
                                                className="appearance-none pl-10 pr-8 py-3 block w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 sm:text-sm"
                                                value={filterGame}
                                                onChange={(e) => setFilterGame(e.target.value)}
                                            >
                                                <option value="">All Games</option>
                                                {Array.from(new Set(participants.flatMap(p => p.games || []))).sort().map(game => (
                                                    <option key={game} value={game}>
                                                        {game}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                                <Filter className="h-5 w-5" />
                                            </div>
                                            <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500" aria-hidden="true"></div>

                                        </div>
                                    </div>

                                    <div className="sm:w-48">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Filter className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <select
                                                className="appearance-none pl-10 pr-8 py-3 block w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 sm:text-sm"
                                                value={filterAgeGroup}
                                                onChange={(e) => setFilterAgeGroup(e.target.value)}
                                            >
                                                <option value="">All Age Groups</option>
                                                {ageGroups.map((group) => (
                                                    <option key={group} value={group}>
                                                        {group}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                                <Filter className="h-5 w-5" />
                                            </div>
                                            <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500" aria-hidden="true"></div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={resetFilters}
                                        className="px-4 py-3 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-150 border border-gray-300 flex items-center"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Reset
                                    </button>

                                    <button
                                        onClick={fetchParticipants}
                                        className="px-4 py-3 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-150 border border-gray-300 flex items-center"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Refresh
                                    </button>


                                </div>

                                {filteredParticipants.length > 0 && (
                                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => paginate(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => paginate(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                Next
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Showing <span className="font-medium">{indexOfFirstRecord + 1}</span> to{' '}
                                                    <span className="font-medium">
                                                        {Math.min(indexOfLastRecord, filteredParticipants.length)}
                                                    </span>{' '}
                                                    of <span className="font-medium">{filteredParticipants.length}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                    <button
                                                        onClick={() => paginate(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span className="sr-only">Previous</span>
                                                        <ChevronLeft className="h-5 w-5" />
                                                    </button>

                                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                                        let pageNum = i + 1;
                                                        if (totalPages > 5) {
                                                            if (currentPage > 3 && currentPage < totalPages - 2) {
                                                                pageNum = currentPage - 2 + i;
                                                            } else if (currentPage >= totalPages - 2) {
                                                                pageNum = totalPages - 4 + i;
                                                            }
                                                        }

                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => paginate(pageNum)}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNum === currentPage
                                                                    ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    })}

                                                    <button
                                                        onClick={() => paginate(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span className="sr-only">Next</span>
                                                        <ChevronRight className="h-5 w-5" />
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                                    {filteredParticipants.length === 0 ? (
                                        <div className="text-center py-10">
                                            <p className="text-gray-500">
                                                {participants.length === 0
                                                    ? "No participants registered yet."
                                                    : "No participants found matching your search criteria."}
                                            </p>
                                            <p className="mt-2 text-sm text-gray-400">
                                                Total participants in database: {participants.length}
                                            </p>
                                        </div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Participant
                                                    </th>
                                                    <th scope="col" className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Contact
                                                    </th>
                                                    <th scope="col" className="w-1/8 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Age Group
                                                    </th>
                                                    <th scope="col" className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Registered Games
                                                    </th>
                                                    <th scope="col" className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Registration Date
                                                    </th>
                                                    <th scope="col" className="w-1/12 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {currentRecords.map((participant) => (
                                                    <tr key={participant.id} className="hover:bg-orange-50 transition-colors duration-150">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                                                                    <User className="h-5 w-5" />
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {participant.firstName || participant.first_name} {participant.lastName || participant.last_name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        ID: {participant.id}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                                                <span className="text-sm text-gray-500">{participant.contactNumber || participant.contact_number}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                {participant.ageGroup || participant.age_group}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="max-w-lg">
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {participant.games && participant.games.map((game, index) => (
                                                                        <span key={index} className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                                            {game.includes('Zone') ? game : (!isNaN(game) ? `Zone ${game}` : game)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <div className="flex items-center">
                                                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                                {formatDate(participant.registrationDate || participant.registration_date)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => deleteParticipant(participant.id)}
                                                                disabled={deletingParticipants.has(participant.id)}
                                                                className={`text-red-600 hover:text-red-900 focus:outline-none focus:underline inline-flex items-center
        ${deletingParticipants.has(participant.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                {deletingParticipants.has(participant.id) ? (
                                                                    <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                )}
                                                                {deletingParticipants.has(participant.id) ? 'Deleting...' : 'Delete'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {filteredParticipants.length > 0 && (
                                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => paginate(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => paginate(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                Next
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Showing <span className="font-medium">{indexOfFirstRecord + 1}</span> to{' '}
                                                    <span className="font-medium">
                                                        {Math.min(indexOfLastRecord, filteredParticipants.length)}
                                                    </span>{' '}
                                                    of <span className="font-medium">{filteredParticipants.length}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                    <button
                                                        onClick={() => paginate(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span className="sr-only">Previous</span>
                                                        <ChevronLeft className="h-5 w-5" />
                                                    </button>

                                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                                        let pageNum = i + 1;
                                                        if (totalPages > 5) {
                                                            if (currentPage > 3 && currentPage < totalPages - 2) {
                                                                pageNum = currentPage - 2 + i;
                                                            } else if (currentPage >= totalPages - 2) {
                                                                pageNum = totalPages - 4 + i;
                                                            }
                                                        }

                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => paginate(pageNum)}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNum === currentPage
                                                                    ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    })}

                                                    <button
                                                        onClick={() => paginate(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span className="sr-only">Next</span>
                                                        <ChevronRight className="h-5 w-5" />
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-sm text-gray-700">
                                        {/* Total Registrations : <span className="font-medium">{participants.length}</span> */}
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={exportToCSV}
                                            className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-150"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Export CSV
                                        </button>
                                        <button
                                            onClick={printReport}
                                            className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-150"
                                        >
                                            <Printer className="h-4 w-4 mr-2" />
                                            Print Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <GameManagement authCredentials={authCredentials} />
                        )}
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-right">
                        <p className="text-xs text-gray-500">© 2025 Avurudu Games Administration</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;