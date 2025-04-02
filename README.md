# Avurudu Games 2025

A full-stack web application for managing Avurudu festival games registration and administration.

## Overview

This application enables participants to register for various traditional Sri Lankan New Year (Avurudu) games while providing administrators with tools to manage games and view participant data. The application features a PostgreSQL database for production and SQLite for development.

## Features

### Public Features
- Responsive registration form for participants
- Age-appropriate game selection
- Real-time form validation

### Administrative Features
- Secure admin panel with basic authentication
- Comprehensive participant management
- Game management (create, update, delete)
- Data export (CSV) and print functionality
- Dashboard of registrations

## Technology Stack

### Frontend
- React.js with React Router for navigation
- Tailwind CSS for styling
- Lucide React for icons
- Recharts for data visualization

### Backend
- Express.js RESTful API
- PostgreSQL database (production)
- SQLite database (development/testing)
- Basic authentication for admin access

## Architecture

The application follows a client-server architecture:

- **Frontend**: React application deployed to Netlify
- **Backend**: Express.js API deployed to Render
- **Database**: PostgreSQL instance on Render

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (for production-like environment)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/avurudu-games-2025.git
   cd avurudu-games-2025
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Update the database connection string in .env
   ```

### Development

#### Run with SQLite (for quick development)
```bash
npm run dev
```

#### Run with PostgreSQL (for production-like environment)
```bash
npm run dev-pg
```

### Database Setup and Migration

#### Initialize SQLite database
```bash
npm run setup-db
```

#### Populate games table
```bash
npm run setup-games
```

#### Migrate data from SQLite to PostgreSQL
```bash
npm run migrate
```

## Deployment

This project is configured for deployment to Netlify (frontend) and Render (backend with PostgreSQL).

### Deployment Process
1. Set up a PostgreSQL database on Render
2. Deploy the Express backend to Render
3. Deploy the React frontend to Netlify

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## API Endpoints

### Public Endpoints
- `GET /api/games` - List all available games
- `POST /api/register` - Register a participant for games
- `GET /api/health` - API health check

### Admin Endpoints (Requires Authentication)
- `GET /api/admin/participants` - List all participants
- `GET /api/admin/games` - List all games
- `POST /api/admin/games` - Create a new game
- `PUT /api/admin/games/:id` - Update a game
- `DELETE /api/admin/games/:id` - Delete a game
- `GET /api/admin/auth-test` - Test authentication

## Admin Access

Default credentials:
- Username: `admin`
- Password: `pass@123`

*Note: These credentials should be changed in a production environment.*

## Project Structure

```
├── public/               # Static files
├── server/               # Backend code
│   ├── db.js             # SQLite database functions
│   ├── db-pg.js          # PostgreSQL database functions
│   ├── server.js         # SQLite server entry point
│   ├── server-pg.js      # PostgreSQL server entry point
│   ├── render.js         # Production server for Render
│   ├── migrate-data.js   # Data migration script
│   └── setup-games.js    # Game setup script
├── src/                  # Frontend code
│   ├── components/       # React components
│   │   ├── AdminLogin.js       # Admin login component
│   │   ├── AdminPanel.js       # Admin dashboard component
│   │   ├── GameManagement.js   # Game CRUD interface
│   │   └── RegistrationForm.js # Public registration form
│   ├── App.js            # Main application component
│   └── config.js         # Frontend configuration
├── .env.example          # Example environment variables
├── DEPLOYMENT.md         # Deployment instructions
├── netlify.toml          # Netlify configuration
└── package.json          # Project dependencies and scripts
```

## Available Scripts

- `npm start` - Run the server with SQLite
- `npm run start-pg` - Run the server with PostgreSQL
- `npm run build` - Build the React frontend
- `npm run client` - Run the React development server
- `npm run server` - Run the backend server with SQLite using nodemon
- `npm run server-pg` - Run the backend server with PostgreSQL using nodemon
- `npm run dev` - Run both client and server (SQLite) concurrently
- `npm run dev-pg` - Run both client and server (PostgreSQL) concurrently
- `npm run setup-db` - Set up the SQLite database
- `npm run setup-games` - Set up the games table
- `npm run migrate` - Migrate data from SQLite to PostgreSQL
- `npm run alter-games` - Alter the games table schema

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgements

- New Zealand Sri Lanka Buddhist Trust for the Avurudu Games initiative