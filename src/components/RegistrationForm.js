// src/components/RegistrationForm.js
import React, { useState } from 'react';
import { Check, AlertCircle, ChevronDown, User, Phone } from 'lucide-react';

// Define the age groups and games
const ageGroups = [
    'Under 5',
    'Under 6',
    'Between 6-12',
    'Under 12',
    'Between 12-15',
    'Adult (Over 16)',
    'Adult Over 60'
];

const games = [
    'Kotta Pora (Pillow Fighting)',
    'Kana Mutti (Pot Breaking)',
    'Banis Kaema (Bun Eating)',
    'Lissana Gaha Nageema (Greasy Pole Climbing)',
    'Aliyata Aha Thaebeema (Feeding the Elephant)',
    'Kamba Adeema (Tug of War)',
    'Coconut Scraping',
    'Lime and Spoon Race'
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Clear error for this field when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }
    };

    const handleGameSelection = (game) => {
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
            const response = await fetch('/api/register', {
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
            }, 3000);
        } catch (error) {
            setSubmitError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-orange-600">Avurudu Games 2025</h2>
                        <p className="mt-2 text-sm text-gray-600">Register for the New Year celebration games</p>
                    </div>

                    {isSubmitted ? (
                        <div className="bg-green-50 p-4 rounded-md mb-6 flex items-center">
                            <Check className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-green-700">Registration successful! We look forward to seeing you at the event.</span>
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
                                        placeholder="e.g. 0712345678"
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
                                        {games.map((game) => (
                                            <div key={game} className="flex items-center hover:bg-orange-50 p-2 rounded-md transition-colors duration-150">
                                                <input
                                                    id={`game-${game}`}
                                                    name="games"
                                                    type="checkbox"
                                                    checked={formData.selectedGames.includes(game)}
                                                    onChange={() => handleGameSelection(game)}
                                                    className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor={`game-${game}`} className="ml-3 text-sm text-gray-700 font-medium cursor-pointer flex-1">
                                                    {game}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-orange-500" aria-hidden="true"></div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">Note: Group event registration will be onsite</p>
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
        </div>
    );
};

export default RegistrationForm;