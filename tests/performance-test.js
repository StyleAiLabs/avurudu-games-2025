// performance-test.js
// Performance testing script for Avurudu Games registration system
// Uses k6 (https://k6.io/) - a modern load testing tool

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const successfulRegistrations = new Counter('successful_registrations');
const failedRegistrations = new Counter('failed_registrations');
const registrationDuration = new Trend('registration_duration');
const errorRate = new Rate('error_rate');

// Test configuration
export const options = {
    // Basic test with ramping up users
    stages: [
        { duration: '1m', target: 10 }, // Ramp up to 10 users over 1 minute
        { duration: '2m', target: 50 }, // Ramp up to 50 users over 2 minutes
        { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
        { duration: '1m', target: 0 }, // Ramp down to 0 users over 1 minute
    ],

    // Thresholds for test success/failure criteria
    thresholds: {
        http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1s
        http_req_failed: ['rate<0.1'],     // Fewer than 10% of requests should fail
        'successful_registrations': ['count>100'], // At least 100 successful registrations
        'error_rate': ['rate<0.1'],        // Error rate should be below 10%
    },
};

// User data generation
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

// Function to generate random phone number
function generatePhoneNumber() {
    return '021' + randomIntBetween(1000000, 9999999);
}

// Function to fetch available games
function fetchGames(baseUrl) {
    const gamesResponse = http.get(`${baseUrl}/api/games`);
    check(gamesResponse, {
        'games fetched successfully': (r) => r.status === 200,
    });

    let games = [];
    try {
        games = JSON.parse(gamesResponse.body);
    } catch (e) {
        console.error('Failed to parse games response', e);
    }
    return games;
}

// Function to select random games based on age group
function selectRandomGames(games, ageGroup, count) {
    // Filter games appropriate for the age group
    const eligibleGames = games.filter(game =>
        game.age_limit === 'All Ages' ||
        game.age_limit.includes(ageGroup)
    );

    // Shuffle and select random games
    const shuffledGames = [...eligibleGames].sort(() => 0.5 - Math.random());

    // Select between 1 and count games
    const actualCount = Math.min(
        randomIntBetween(1, Math.min(count, 3)),
        shuffledGames.length
    );

    return shuffledGames.slice(0, actualCount).map(game => game.name);
}

// Main function executed for each virtual user
export default function () {
    // Set environment variables
    const BASE_URL = __ENV.BASE_URL || 'https://avurudu-games-api.onrender.com';
    const THINK_TIME_MIN = parseInt(__ENV.THINK_TIME_MIN || '1');
    const THINK_TIME_MAX = parseInt(__ENV.THINK_TIME_MAX || '5');

    // Metrics for this iteration
    let startTime = new Date().getTime();
    let success = false;

    try {
        // 1. Fetch available games
        const games = fetchGames(BASE_URL);

        if (games.length === 0) {
            console.log('No games available for registration');
            return;
        }

        // 2. Generate user data
        const ageGroup = ageGroups[randomIntBetween(0, ageGroups.length - 1)];
        const selectedGames = selectRandomGames(games, ageGroup, 3);

        const userData = {
            firstName: 'Test' + randomString(8),
            lastName: 'User' + randomString(6),
            contactNumber: generatePhoneNumber(),
            ageGroup: ageGroup,
            selectedGames: selectedGames
        };

        // Add a little think time to simulate user behavior
        sleep(randomIntBetween(THINK_TIME_MIN, THINK_TIME_MAX));

        // 3. Submit registration
        const registrationResponse = http.post(
            `${BASE_URL}/api/register`,
            JSON.stringify(userData),
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        // 4. Check if registration was successful
        const registrationCheck = check(registrationResponse, {
            'registration successful': (r) => r.status === 201,
            'received valid response': (r) => r.json().id !== undefined,
        });

        if (registrationCheck) {
            success = true;
            successfulRegistrations.add(1);
            console.log(`Registration successful: ${userData.firstName} ${userData.lastName}`);
        } else {
            failedRegistrations.add(1);
            console.error(`Registration failed with status ${registrationResponse.status}:`, registrationResponse.body);
        }
    } catch (error) {
        failedRegistrations.add(1);
        console.error('Test execution failed:', error);
    } finally {
        // Record metrics
        const duration = new Date().getTime() - startTime;
        registrationDuration.add(duration);
        errorRate.add(!success);
    }

    // Add randomized sleep time between iterations
    sleep(randomIntBetween(THINK_TIME_MIN, THINK_TIME_MAX));
}

// Helper functions for test execution control
export function setup() {
    console.log('Starting load test for Avurudu Games Registration System');
    // Validate environment is available
    const res = http.get(`${__ENV.BASE_URL || 'https://avurudu-games-api.onrender.com'}/api/health`);
    check(res, {
        'api is up': (r) => r.status === 200,
    });
}

export function teardown() {
    console.log('Load test completed');
}