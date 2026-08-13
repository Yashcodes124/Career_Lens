# Career Lens Setup Guide

## Project Overview
A career-focused job matching platform with authentication flows, profile management, and user tracking features.

## Getting Started

1. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Configure PostgreSQL connection using `.env` variables
   - Run `docker-compose up -d` to start PostgreSQL database

2. **Backend Setup**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Run prisma migrations
   npx prisma migrate dev --name init

   # Start development server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   # Install frontend dependencies
   cd client
   npm install

   # Start development server
   npm run dev
   ```

## Features Implemented
- User registration and authentication (JWT-based)
- Profile management system
- Target role and location tracking
- Matching algorithms between users and jobs

## Technical Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL
- **Authentication**: JWT, bcrypt
- **ORM**: Prisma