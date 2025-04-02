# Deployment Guide for Avurudu Games 2025

This guide will walk you through deploying both the frontend and backend of your Avurudu Games 2025 application to Netlify and Render, respectively.

## Architecture Overview

The application has been modified to use the following architecture:

- **Frontend**: React application deployed to Netlify
- **Backend**: Express.js API deployed to Render
- **Database**: PostgreSQL database on Render

## Prerequisites

Before starting the deployment process, ensure you have:

1. A GitHub repository with your project code
2. Netlify account (free tier is sufficient)
3. Render.com account
4. Your codebase updated with the PostgreSQL changes

## Step 1: Set Up PostgreSQL Database on Render

1. Log in to your Render dashboard
2. Navigate to "PostgreSQL" in the sidebar
3. Click "New PostgreSQL"
4. Configure your database:
   - **Name**: `avurudu-games` (already created as `avurudu_games`)
   - **Database**: `avurudu_games` (no spaces or special characters)
   - **User**: Render will generate this automatically (e.g., `avurudu_games_user`)
   - **Region**: Choose closest to your target audience (oregon region used)
   - **Plan**: Select appropriate plan (starts at $7/month)
5. Click "Create Database"
6. Save the connection details:
   - `Internal Database URL` (for connecting from Render services)
   - `External Database URL` (for connecting from your local machine)
   - Note: Render will only show the password once
   - The database host is: `dpg-cvm8jcngi27c7399r9vg-a.oregon-postgres.render.com`

## Step 2: Deploy Backend to Render

1. In your Render dashboard, navigate to "Web Services"
2. Click "New Web Service"
3. Connect your GitHub repository
4. Configure your service:
   - **Name**: `avurudu-games-api` (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server/server-pg.js`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: `postgresql://avurudu_games_user:1e5l4MU7PGHsmgG4J5zByhPG1JO4GPWZ@dpg-cvm8jcngi27c7399r9vg-a/avurudu_games`
   - **Region**: Same as your database
   - **Plan**: Select appropriate plan (free plan will automatically sleep after inactivity)
5. Click "Create Web Service"
6. Note the URL of your deployed API (e.g., `https://avurudu-games-api.onrender.com`)

## Step 3: Migrate Data (Optional)

If you have existing data in your SQLite database that you want to transfer to PostgreSQL:

1. Create a local `.env` file with your database connection string:
   ```
   DATABASE_URL=[Your external PostgreSQL connection URL]
   ```
2. Run the migration script locally:
   ```bash
   node server/migrate-data.js
   ```

## Step 4: Deploy Frontend to Netlify

1. Log in to your Netlify dashboard
2. Click "Import project" > "Import from Git"
3. Select your GitHub repository
4. Configure build settings:
   - **Base directory**: (leave blank if your app is at the root)
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. In the "Advanced settings" section, add the following environment variable:
   - `REACT_APP_API_URL`: [Your Render backend URL]
6. Click "Deploy site"

## Step 5: Set Up Custom Domain (Optional)

### For Netlify (Frontend):
1. In your Netlify dashboard, go to your site
2. Navigate to "Domain settings"
3. Click "Add custom domain"
4. Follow the instructions to configure your DNS

### For Render (Backend):
1. In your Render dashboard, select your web service
2. Go to "Settings" > "Custom Domains"
3. Click "Add Custom Domain"
4. Follow the instructions to configure your DNS

## Step 6: Verify Your Deployment

1. Navigate to your Netlify URL
2. Test all functionality:
   - Registration form submission
   - Admin login
   - Game management
3. Check browser console for any API connection errors

## Troubleshooting

### Backend Connection Issues
- **Issue**: Frontend can't connect to backend
- **Fix**: Ensure CORS is properly configured on the backend:
  ```javascript
  app.use(cors({
    origin: ['https://your-netlify-app.netlify.app', 'http://localhost:3000']
  }));
  ```

### Database Connection Issues
- **Issue**: "Connection refused" errors in Render logs
- **Fix**: Verify your DATABASE_URL environment variable is correct and the database service is running

### Mixed Content Warnings
- **Issue**: Console shows mixed content warnings
- **Fix**: Ensure all resources are loaded via HTTPS, including API calls

### 404 Errors on Netlify Page Refresh
- **Issue**: Refreshing pages leads to 404 errors
- **Fix**: Ensure your netlify.toml file has the proper redirect rule:
  ```toml
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```

## Maintenance

### Updating Your Application
1. Push changes to your GitHub repository
2. Netlify and Render will automatically deploy updates

### Database Backups
1. In Render dashboard, go to your PostgreSQL instance
2. Navigate to "Backups" tab
3. Configure backup frequency or create manual backups
