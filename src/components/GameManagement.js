// src/components/GameManagement.js
import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Save, X, AlertCircle, Check,
    RefreshCw, Clock, MapPin, Users, CalendarCheck
} from 'lucide-react';

const GameManagement = ({ authCredentials }) => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingGame, setEditingGame] = useState(null);
    const [newGame, setNewGame] = useState({
        name: '',
        age_limit: 'All Ages',
        pre_registration: 'Y',
        game_zone: '',
        game_time: ''
    });
    const [showNewGameForm, setShowNewGameForm] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState(null);

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

    // Fetch games from the server
    const fetchGames = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching games with credentials:', authCredentials.username);

            const response = await fetch('/api/admin/games', {
                headers: {
                    'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Error response from server:', response.status, errorData);
                throw new Error(errorData.error || `Server returned status ${response.status}`);
            }

            const data = await response.json();
            console.log('Games fetched successfully:', data);
            setGames(data);
        } catch (error) {
            console.error('Error fetching games:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Initialize by fetching games
    useEffect(() => {
        fetchGames();
    }, [authCredentials]);

    // Handle input change for new game form
    const handleNewGameInputChange = (e) => {
        const { name, value } = e.target;
        setNewGame({
            ...newGame,
            [name]: value
        });

        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: null
            });
        }
    };

    // Handle input change for editing game
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditingGame({
            ...editingGame,
            [name]: value
        });

        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: null
            });
        }
    };

    // Validate form data
    const validateGameForm = (gameData) => {
        const errors = {};

        if (!gameData.name.trim()) {
            errors.name = 'Game name is required';
        }

        return errors;
    };

    // Create a new game
    const handleCreateGame = async (e) => {
        e.preventDefault();

        // Validate form
        const validationErrors = validateGameForm(newGame);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('/api/admin/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
                },
                body: JSON.stringify(newGame)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create game');
            }

            // Add the new game to the list
            setGames([...games, data]);

            // Reset form and hide it
            setNewGame({
                name: '',
                age_limit: 'All Ages',
                pre_registration: 'Y',
                game_zone: '',
                game_time: ''
            });
            setShowNewGameForm(false);

            // Show success message
            setSuccessMessage('Game created successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error creating game:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Start editing a game
    const handleEditGame = (game) => {
        setEditingGame({ ...game });
        setFormErrors({});
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingGame(null);
        setFormErrors({});
    };

    // Save edited game
    const handleSaveGame = async (gameId) => {
        // Validate form
        const validationErrors = validateGameForm(editingGame);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(`/api/admin/games/${gameId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
                },
                body: JSON.stringify(editingGame)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update game');
            }

            // Update the game in the list
            setGames(games.map(game => game.id === gameId ? data : game));
            setEditingGame(null);

            // Show success message
            setSuccessMessage('Game updated successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error updating game:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete a game
    const handleDeleteGame = async (gameId) => {
        if (!window.confirm('Are you sure you want to delete this game? This cannot be undone.')) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch(`/api/admin/games/${gameId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete game');
            }

            // Remove the game from the list
            setGames(games.filter(game => game.id !== gameId));

            // Show success message
            setSuccessMessage('Game deleted successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting game:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && games.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-gray-700">Loading games...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 bg-orange-50 border-b border-orange-100">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-orange-800">Game Management</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={fetchGames}
                            className="p-2 rounded-md text-gray-700 hover:bg-orange-100 transition-colors duration-150"
                            title="Refresh"
                            disabled={loading}
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin text-orange-500' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowNewGameForm(!showNewGameForm)}
                            className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-150"
                        >
                            {showNewGameForm ? (
                                <>
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Game
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {successMessage && (
                <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <p className="text-green-700">{successMessage}</p>
                    </div>
                </div>
            )}

            {showNewGameForm && (
                <div className="m-6 p-6 bg-orange-50 border border-orange-100 rounded-lg">
                    <h3 className="text-lg font-medium text-orange-800 mb-4">Add New Game</h3>
                    <form onSubmit={handleCreateGame} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Game Name*
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={newGame.name}
                                onChange={handleNewGameInputChange}
                                className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 border ${formErrors.name ? 'border-red-300' : 'border-gray-300'
                                    } focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                            />
                            {formErrors.name && (
                                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="age_limit" className="block text-sm font-medium text-gray-700">
                                    Age Limit
                                </label>
                                <select
                                    id="age_limit"
                                    name="age_limit"
                                    value={newGame.age_limit}
                                    onChange={handleNewGameInputChange}
                                    className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                >
                                    {ageGroups.map((age) => (
                                        <option key={age} value={age}>
                                            {age}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="pre_registration" className="block text-sm font-medium text-gray-700">
                                    Pre-registration Required
                                </label>
                                <select
                                    id="pre_registration"
                                    name="pre_registration"
                                    value={newGame.pre_registration}
                                    onChange={handleNewGameInputChange}
                                    className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="Y">Yes</option>
                                    <option value="N">No</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="game_zone" className="block text-sm font-medium text-gray-700">
                                    Game Zone
                                </label>
                                <input
                                    type="text"
                                    id="game_zone"
                                    name="game_zone"
                                    value={newGame.game_zone}
                                    onChange={handleNewGameInputChange}
                                    className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="e.g. Zone A"
                                />
                            </div>

                            <div>
                                <label htmlFor="game_time" className="block text-sm font-medium text-gray-700">
                                    Game Time
                                </label>
                                <input
                                    type="text"
                                    id="game_time"
                                    name="game_time"
                                    value={newGame.game_time}
                                    onChange={handleNewGameInputChange}
                                    className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="e.g. 10:00 AM"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => setShowNewGameForm(false)}
                                className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Game'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="p-6">
                {games.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No games found. Add a game to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Game
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Age Limit
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pre-registration
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Zone & Time
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {games.map((game) => (
                                    <tr key={game.id} className={editingGame && editingGame.id === game.id ? 'bg-orange-50' : 'hover:bg-gray-50'}>
                                        {editingGame && editingGame.id === game.id ? (
                                            // Editing mode
                                            <>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={editingGame.name}
                                                        onChange={handleEditInputChange}
                                                        className={`block w-full rounded-md shadow-sm py-2 px-3 border ${formErrors.name ? 'border-red-300' : 'border-gray-300'
                                                            } focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                                                    />
                                                    {formErrors.name && (
                                                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        name="age_limit"
                                                        value={editingGame.age_limit || 'All Ages'}
                                                        onChange={handleEditInputChange}
                                                        className="block w-full rounded-md shadow-sm py-2 px-3 border border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                    >
                                                        {ageGroups.map((age) => (
                                                            <option key={age} value={age}>
                                                                {age}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        name="pre_registration"
                                                        value={editingGame.pre_registration || 'N'}
                                                        onChange={handleEditInputChange}
                                                        className="block w-full rounded-md shadow-sm py-2 px-3 border border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                    >
                                                        <option value="Y">Yes</option>
                                                        <option value="N">No</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <input
                                                            type="text"
                                                            name="game_zone"
                                                            value={editingGame.game_zone || ''}
                                                            onChange={handleEditInputChange}
                                                            className="block w-full rounded-md shadow-sm py-2 px-3 border border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="Zone"
                                                        />
                                                        <input
                                                            type="text"
                                                            name="game_time"
                                                            value={editingGame.game_time || ''}
                                                            onChange={handleEditInputChange}
                                                            className="block w-full rounded-md shadow-sm py-2 px-3 border border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="Time"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleSaveGame(game.id)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Save"
                                                    >
                                                        <Save className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="text-gray-600 hover:text-gray-900"
                                                        title="Cancel"
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            // View mode
                                            <>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{game.name}</div>
                                                    <div className="text-xs text-gray-500">Game ID: {game.id}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Users className="h-4 w-4 text-gray-400 mr-1.5" />
                                                        <span className="text-sm text-gray-500">{game.age_limit || 'All Ages'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${game.pre_registration === 'Y'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {game.pre_registration === 'Y' ? 'Required' : 'Not Required'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center">
                                                            <MapPin className="h-4 w-4 text-gray-400 mr-1.5" />
                                                            <span className="text-sm text-gray-500">{game.game_zone || 'TBD'}</span>
                                                        </div>
                                                        <div className="flex items-center mt-1">
                                                            <Clock className="h-4 w-4 text-gray-400 mr-1.5" />
                                                            <span className="text-sm text-gray-500">{game.game_time || 'TBD'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                    <button
                                                        onClick={() => handleEditGame(game)}
                                                        className="text-orange-600 hover:text-orange-900 inline-block"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGame(game.id)}
                                                        className="text-red-600 hover:text-red-900 inline-block"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameManagement;