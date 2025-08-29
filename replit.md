# Overview

This is a full-stack gaming application built with React, Express, and PostgreSQL. The application features a modern web-based game interface with 3D graphics capabilities, user authentication, and a credit-based gaming system. It includes a dashboard for user management, game interaction, and real-time audio feedback.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom component library using Radix UI primitives
- **3D Graphics**: React Three Fiber (@react-three/fiber) with Drei helpers for 3D game rendering
- **State Management**: Zustand stores for client-side state (auth, credits, game, audio)
- **UI Components**: Comprehensive shadcn/ui component library with dark theme support

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for consistency with frontend
- **API Pattern**: RESTful endpoints with structured error handling
- **Development**: Hot reload via Vite integration for seamless full-stack development
- **Storage Strategy**: In-memory storage (MemStorage) for development with database abstraction layer

## Data Storage
- **Database**: PostgreSQL configured via Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Connection**: Neon Database serverless connection for scalable PostgreSQL hosting
- **Development Storage**: Memory-based storage implementation for rapid prototyping

## Authentication & Authorization
- **Authentication**: Simple username/password authentication with session-based state
- **User Management**: User registration, login, and profile management
- **Credit System**: Integrated credit-based economy for game transactions
- **Session Handling**: Client-side state management with Zustand persistence

## Game System
- **Game Engine**: Custom 3D game implementation using React Three Fiber
- **Audio System**: HTML5 Audio API with background music and sound effects
- **Game States**: Phase-based game management (ready, playing, ended)
- **Input Handling**: Keyboard controls with WASD movement and spacebar actions
- **UI Integration**: Game interface overlays with mute controls and restart functionality

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database queries and schema management
- **Drizzle Kit**: Database migration and schema synchronization tools

## Frontend Libraries
- **Radix UI**: Unstyled, accessible UI primitives for component foundation
- **React Three Fiber**: React renderer for Three.js 3D graphics
- **React Three Drei**: Useful helpers and abstractions for 3D scenes
- **React Query**: Server state management and API caching (TanStack Query)
- **Zustand**: Lightweight state management for client-side stores

## Development Tools
- **Vite**: Frontend build tool with hot module replacement
- **TypeScript**: Static type checking for both frontend and backend
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **ESBuild**: Fast JavaScript bundler for production builds

## Audio Assets
- **Background Music**: Looping ambient game music (MP3 format)
- **Sound Effects**: Hit sounds and success notifications for game feedback
- **Font Assets**: Inter font family for consistent typography

## Utility Libraries
- **Zod**: Runtime type validation for API requests and responses
- **Class Variance Authority**: Type-safe CSS class generation
- **Date-fns**: Date manipulation and formatting utilities
- **Lucide React**: Consistent icon library for UI elements

# Game Asset Distribution

## 7-Tier Rarity System
The game uses a weighted distribution system for flowers and butterflies across 7 rarity tiers:

### Rarity Tiers with Colors
- **Common** (gelb/yellow): 45% - Most frequent, basic varieties
- **Uncommon** (grün/green): 30% - Slightly rarer, colorful varieties  
- **Rare** (blau/blue): 15% - Beautiful, harder to find species
- **Super-rare** (türkis/turquoise): 7% - Exotic, stunning varieties
- **Epic** (lila/purple): 2.5% - Magnificent, powerful species
- **Legendary** (orange): 0.4% - Mythic, awe-inspiring varieties
- **Mythical** (rot/red): 0.1% - Ultimate, legendary species

### Asset Distribution

#### 200 Flower Images (/Blumen folder)
- **Common**: 90 flowers (45%) - Images 01-90
- **Uncommon**: 60 flowers (30%) - Images 91-150  
- **Rare**: 30 flowers (15%) - Images 151-180
- **Super-rare**: 14 flowers (7%) - Images 181-194
- **Epic**: 5 flowers (2.5%) - Images 195-199
- **Legendary**: 1 flower (0.5%) - Image 200
- **Mythical**: 0 flowers (reserved for special events)

#### 1000 Butterfly Images (/Schmetterlinge folder)
- **Common**: 450 butterflies (45%) - Images 001-450
- **Uncommon**: 300 butterflies (30%) - Images 451-750
- **Rare**: 150 butterflies (15%) - Images 751-900  
- **Super-rare**: 70 butterflies (7%) - Images 901-970
- **Epic**: 25 butterflies (2.5%) - Images 971-995
- **Legendary**: 4 butterflies (0.4%) - Images 996-999
- **Mythical**: 1 butterfly (0.1%) - Image 1000