// src/components/RegistrationForm.js
import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, ChevronDown, User, Phone, Clock, MapPin, Users, Info } from 'lucide-react';
import config from '../config';
import MusicPlayer from './MusicPlayer';

// Define the age groups
const ageGroups = [
    'All Ages',
    'Under 5',
    'Under 6',
    'Between 6-12',
    'Under 12',
    'Between 12-15',
    'Adult (Over 16)',
    'Adult Over 60'
];

const RegistrationForm = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        contactNumber: '',
        ageGroup: '',
        selectedGames: []
    });

    const [errors, setErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [games, setGames] = useState([]);
    const [loadingGames, setLoadingGames] = useState(true);
    const [gamesError, setGamesError] = useState(null);

    // Fetch games from the API
    useEffect(() => {
        const fetchGames = async () => {
            setLoadingGames(true);
            setGamesError(null);

            console.log('Using API URL:', config.apiUrl);

            try {
                const response = await fetch(`${config.apiUrl}/api/games`);

                if (!response.ok) {
                    throw new Error('Failed to fetch games');
                }

                const data = await response.json();
                setGames(data);
            } catch (error) {
                console.error('Error fetching games:', error);
                setGamesError(error.message);
            } finally {
                setLoadingGames(false);
            }
        };

        fetchGames();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // If changing age group, reset selected games
        if (name === 'ageGroup') {
            setFormData({
                ...formData,
                ageGroup: value,
                selectedGames: [] // Reset selected games
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }

        // Clear error for this field when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }
    };

    const handleGameSelection = (game) => {
        if (!formData.ageGroup) {
            setErrors(prev => ({
                ...prev,
                ageGroup: 'Please select an age group before choosing games'
            }));
            return;
        }

        const selectedGames = [...formData.selectedGames];
        if (selectedGames.includes(game)) {
            const index = selectedGames.indexOf(game);
            selectedGames.splice(index, 1);
        } else {
            selectedGames.push(game);
        }

        setFormData({
            ...formData,
            selectedGames
        });

        if (errors.selectedGames) {
            setErrors({
                ...errors,
                selectedGames: null
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.contactNumber.trim()) {
            newErrors.contactNumber = 'Contact number is required';
        } else if (!/^\d{10}$/.test(formData.contactNumber)) {
            newErrors.contactNumber = 'Please enter a valid 10-digit number';
        }

        if (!formData.ageGroup) {
            newErrors.ageGroup = 'Please select an age group';
        }

        if (formData.selectedGames.length === 0) {
            newErrors.selectedGames = 'Please select at least one game';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Reset any previous errors
        setSubmitError(null);
        setIsSubmitting(true);

        try {
            // Send data to the server
            const response = await fetch(`${config.apiUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Registration failed');
            }

            // Show success message
            setIsSubmitted(true);

            // Reset the form after 3 seconds
            setTimeout(() => {
                setFormData({
                    firstName: '',
                    lastName: '',
                    contactNumber: '',
                    ageGroup: '',
                    selectedGames: []
                });
                setIsSubmitted(false);
            }, 30000);
        } catch (error) {
            setSubmitError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add this sorting function before the return statement
    const sortGamesByEligibility = (games, selectedAgeGroup) => {
        return [...games].sort((a, b) => {
            const aIsEligible = selectedAgeGroup && a.age_limit.includes(selectedAgeGroup);
            const bIsEligible = selectedAgeGroup && b.age_limit.includes(selectedAgeGroup);

            if (aIsEligible && !bIsEligible) return -1;
            if (!aIsEligible && bIsEligible) return 1;
            return a.name.localeCompare(b.name); // Sort alphabetically within each group
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
            <MusicPlayer />
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-orange-600">Registration Form</h2>
                    </div>

                    {isSubmitted ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 p-4 rounded-md flex items-center">
                                <Check className="h-5 w-5 text-green-500 mr-2" />
                                <span className="text-green-700">Registration successful! We look forward to seeing you at the event.</span>
                            </div>

                            <div className="bg-white border border-green-100 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Summary</h3>

                                <div className="space-y-3">
                                    <div className="flex border-b border-gray-100 pb-2">
                                        <span className="text-gray-500 w-1/3">Name:</span>
                                        <span className="text-gray-900 font-medium">{formData.firstName} {formData.lastName}</span>
                                    </div>

                                    <div className="flex border-b border-gray-100 pb-2">
                                        <span className="text-gray-500 w-1/3">Contact:</span>
                                        <span className="text-gray-900 font-medium">{formData.contactNumber}</span>
                                    </div>

                                    <div className="flex border-b border-gray-100 pb-2">
                                        <span className="text-gray-500 w-1/3">Age Group:</span>
                                        <span className="text-gray-900 font-medium">{formData.ageGroup}</span>
                                    </div>

                                    <div className="flex">
                                        <span className="text-gray-500 w-1/3">Games:</span>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap gap-2">
                                                {formData.selectedGames.map((game, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                                                    >
                                                        {game}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 bg-gray-50 p-4 rounded border border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        <Info className="h-4 w-4 inline mr-2 text-gray-400" />
                                        Please save this information for your reference
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {submitError && (
                                <div className="bg-red-50 p-4 rounded-md mb-6 flex items-center">
                                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                    <span className="text-red-700">{submitError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                        First Name
                                    </label>
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="firstName"
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className={`appearance-none block w-full pl-10 pr-4 py-3 border ${errors.firstName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 sm:text-sm`}
                                        />
                                        <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500" aria-hidden="true"></div>
                                    </div>
                                    {errors.firstName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                        Last Name
                                    </label>
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="lastName"
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className={`appearance-none block w-full pl-10 pr-4 py-3 border ${errors.lastName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 sm:text-sm`}
                                        />
                                        <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500" aria-hidden="true"></div>
                                    </div>
                                    {errors.lastName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                                    Contact Number
                                </label>
                                <div className="relative mt-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="contactNumber"
                                        id="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 0212345678"
                                        className={`appearance-none block w-full pl-10 pr-4 py-3 border ${errors.contactNumber ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 sm:text-sm`}
                                    />
                                    <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500" aria-hidden="true"></div>
                                </div>
                                {errors.contactNumber && (
                                    <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700">
                                    Age Group
                                </label>
                                <div className="relative mt-1">
                                    <select
                                        id="ageGroup"
                                        name="ageGroup"
                                        value={formData.ageGroup}
                                        onChange={handleInputChange}
                                        className={`appearance-none block w-full px-4 py-3 border ${errors.ageGroup ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 sm:text-sm`}
                                    >
                                        <option value="">Select an age group</option>
                                        {ageGroups.map((group) => (
                                            <option key={group} value={group}>
                                                {group}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                        <ChevronDown className="h-5 w-5" />
                                    </div>
                                    <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500" aria-hidden="true"></div>
                                </div>
                                {errors.ageGroup && (
                                    <p className="mt-1 text-sm text-red-600">{errors.ageGroup}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Games (choose one or more)
                                </label>
                                {!formData.ageGroup && (
                                    <div className="rounded-md bg-yellow-50 p-2 mb-3">
                                        <div className="flex">
                                            <Info className="h-5 w-5 text-yellow-400" />
                                            <p className="ml-2 text-sm text-yellow-700">
                                                Please select an age group first to see eligible games
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {errors.selectedGames && (
                                    <div className="rounded-md bg-red-50 p-2 mb-3">
                                        <div className="flex">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                            <p className="ml-2 text-sm text-red-600">{errors.selectedGames}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="relative">
                                    <div className="space-y-2 max-h-60 overflow-y-auto p-4 border border-gray-300 rounded-md shadow-sm">
                                        {loadingGames ? (
                                            <div className="text-center py-4">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                                                <p className="mt-2 text-gray-600 text-sm">Loading games...</p>
                                            </div>
                                        ) : gamesError ? (
                                            <div className="text-center py-4">
                                                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                                                <p className="mt-2 text-red-600 text-sm">{gamesError}</p>
                                                <p className="text-gray-500 text-xs mt-1">Please refresh the page to try again</p>
                                            </div>
                                        ) : games.length === 0 ? (
                                            <div className="text-center py-4">
                                                <p className="text-gray-500">No games available for registration</p>
                                            </div>
                                        ) : (
                                            sortGamesByEligibility(games, formData.ageGroup).map((game) => (
                                                <div
                                                    key={game.id}
                                                    className={`flex flex-col p-3 rounded-md transition-colors duration-150 border 
            ${!formData.ageGroup ? 'opacity-50 cursor-not-allowed' :
                                                            formData.ageGroup && !game.age_limit.includes(formData.ageGroup) ? 'opacity-50' :
                                                                'hover:bg-orange-50'}`}
                                                >
                                                    <div className="flex items-start">
                                                        <input
                                                            id={`game-${game.id}`}
                                                            name="games"
                                                            type="checkbox"
                                                            checked={formData.selectedGames.includes(game.name)}
                                                            onChange={() => handleGameSelection(game.name)}
                                                            className="h-5 w-5 mt-1 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                            disabled={formData.ageGroup && !game.age_limit.includes(formData.ageGroup)}
                                                        />
                                                        <label htmlFor={`game-${game.id}`} className="ml-3 cursor-pointer flex-1">
                                                            <div className="font-medium text-gray-800">{game.name}</div>
                                                            <div className="mt-1.5 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                                                                <span className="inline-flex items-center">
                                                                    <Users className="h-3.5 w-3.5 mr-1" />
                                                                    {game.age_limit}
                                                                </span>
                                                                <span className="inline-flex items-center">
                                                                    <MapPin className="h-3.5 w-3.5 mr-1" />
                                                                    {game.game_zone || 'TBD'}
                                                                </span>
                                                                <span className="inline-flex items-center">
                                                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                                                    {game.game_time || 'TBD'}
                                                                </span>
                                                            </div>
                                                            {game.pre_registration === 'Y' && (
                                                                <div className="mt-1.5">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                        <Info className="h-3 w-3 mr-1" />
                                                                        Pre-registration required
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </label>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500" aria-hidden="true"></div>
                                </div>
                                <p className="mt-2 text-xs text-blue-500">Note: Group event registration will be onsite</p>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150 ease-in-out"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Registering...' : 'Register'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* <div className="bg-orange-50 px-4 py-3 sm:px-6">
                    <p className="text-xs text-center text-gray-500">© 2025 Avurudu Games Celebration Committee</p>
                </div> */}
            </div>
        </div >
    );
};

export default RegistrationForm;
