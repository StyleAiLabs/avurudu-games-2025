// src/config.js - Frontend configuration

const DEV_API_URL = 'http://localhost:3001';
const PROD_API_URL = 'https://avurudu-games-api.onrender.com'; // Render backend URL

const config = {
    apiUrl: process.env.NODE_ENV === 'production' ? PROD_API_URL : DEV_API_URL
};

export default config;
