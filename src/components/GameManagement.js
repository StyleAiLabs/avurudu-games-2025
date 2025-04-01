// src/components/GameManagement.js
import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash, Clock, MapPin, Users, Check, X, AlertCircle } from 'lucide-react';

const GameManagement = ({ authCredentials }) => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentGame, setCurrentGame] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        ageLimit: '',
        preRegistration: 'Y',
        gameZone: '',
        gameTime: ''
    });
    const [formError, setFormError] = useState(null);
    const [formSuccess, setFormSuccess] = useState(null);

    // Fetch games
    const fetchGames = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/games', {
                headers: {
                    'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch games');
            }

            const data = await response.json();
            setGames(data);
        } catch (error) {
            console.error('Error fetching games:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();
    }, [authCredentials]);

    // Form handling
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            ageLimit: '',
            preRegistration: 'Y',
            gameZone: '',
            gameTime: ''
        });
        setCurrentGame(null);
        setIsEditing(false);
        setFormError(null);
        setFormSuccess(null);
    };

    const handleEditGame = (game) => {
        setFormData({
            name: game.name,
            ageLimit: game.age_limit,
            preRegistration: game.pre_registration,
            gameZone: game.game_zone,
            gameTime: game.game_time
        });
        setCurrentGame(game);
        setIsEditing(true);
        setFormError(null);
        setFormSuccess(null);
    };

    const handleDeleteGame = async (id) => {
        if (!window.confirm('Are you sure you want to delete this game?')) return;

        try {
            const response = await fetch(`/api/admin/games/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete game');
            }

            // Show success message
            setFormSuccess(`Game deleted successfully`);
            // Refresh the game list
            fetchGames();
        } catch (error) {
            console.error('Error deleting game:', error);
            setFormError(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('Form Data Before Submit:', formData); // Add this line

        const gameData = {
            name: formData.name.trim(),  // Add trim() to remove any whitespace
            age_limit: formData.ageLimit,
            pre_registration: formData.preRegistration,
            game_zone: formData.gameZone,
            game_time: formData.gameTime
        };

        console.log('Game Data Being Sent:', gameData); // Add this line

        try {
            const url = isEditing
                ? `/api/admin/games/${currentGame.id}`
                : '/api/admin/games';

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
                },
                body: JSON.stringify(gameData)
            });

            const data = await response.json();
            console.log('Server Response:', data); // Add this line

            if (!response.ok) {
                throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} game`);
            }

            // Show success message
            setFormSuccess(`Game ${isEditing ? 'updated' : 'created'} successfully`);
            // Refresh the game list and reset the form
            fetchGames();
            resetForm();
        } catch (error) {
            console.error('Error details:', error); // Add this line
            setFormError(error.message);
        }
    };

    // Render the component
    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
                <h2 className="text-xl font-bold text-orange-700">Game Management</h2>
                <p className="text-sm text-gray-600">Add, edit or remove games for the Avurudu celebration</p>
            </div>

            <div className="p-6">
                {formSuccess && (
                    <div className="bg-green-50 p-4 rounded-md mb-6 flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-green-700">{formSuccess}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-5 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">
                        {isEditing ? 'Edit Game' : 'Add New Game'}
                    </h3>

                    {formError && (
                        <div className="bg-red-50 p-4 rounded-md mb-4 flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-red-700">{formError}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Game Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                placeholder="e.g. Kotta Pora (Pillow Fighting)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Age Limit <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="ageLimit"
                                value={formData.ageLimit}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                placeholder="e.g. Under 12, 6-12, Adult"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Game Zone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="gameZone"
                                value={formData.gameZone}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                placeholder="e.g. Field A, Main Stage"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Game Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="gameTime"
                                value={formData.gameTime}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                placeholder="e.g. 10:00 AM, 2:30 PM"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pre-Registration Required
                            </label>
                            <select
                                name="preRegistration"
                                value={formData.preRegistration}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="Y">Yes</option>
                                <option value="N">No</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-150"
                        >
                            {isEditing ? 'Update Game' : 'Add Game'}
                        </button>

                        {isEditing && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                            <p className="mt-4 text-gray-700">Loading games...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                            <p className="mt-4 text-red-700">{error}</p>
                            <button
                                onClick={fetchGames}
                                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : games.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No games found. Add your first game above.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age Limit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pre-Registration</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {games.map((game) => (
                                    <tr key={game.id} className="hover:bg-orange-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{game.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Users className="h-4 w-4 text-gray-400 mr-2" />
                                                {game.age_limit}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {game.pre_registration === 'Y' ? (
                                                <span className="inline-flex items-center text-green-800">
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-red-800">
                                                    <X className="h-4 w-4 mr-1" />
                                                    No
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                                {game.game_zone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                                {game.game_time}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleEditGame(game)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Edit game"
                                                >
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGame(game.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete game"
                                                >
                                                    <Trash className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameManagement;
