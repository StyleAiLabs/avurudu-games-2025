# Avurudu Games 2025

A web application for managing Avurudu festival games registration and administration.

## Deployment

This project has been configured for deployment to Netlify (frontend) and Render (backend with PostgreSQL). 

For detailed deployment instructions, please see the [DEPLOYMENT.md](./DEPLOYMENT.md) file.

### Quick Start

1. Set up a PostgreSQL database on Render
2. Deploy the Express backend to Render
3. Deploy the React frontend to Netlify
4. Update environment variables accordingly

### Local Development with PostgreSQL

1. Create a `.env` file based on `.env.example` with your PostgreSQL connection string
2. Run `npm run dev-pg` to start the development server with PostgreSQL
3. For data migration from SQLite to PostgreSQL, run `npm run migrate`

### Testing the Application

1. To run with SQLite (legacy): `npm run dev`
2. To run with PostgreSQL: `npm run dev-pg`

## Original Project
