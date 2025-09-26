# NST SDC Badges

A platform to track badges earned by students for various activities, built with Nuxt.js 4 and MongoDB.

## Features

### Public Features

- **Authentication**: Login/Signup/Password reset
- **Student Profiles**: View student profiles with badges, GitHub integration, and social links
- **Badge Catalog**: Browse available badges and submit requests
- **GitHub Integration**: Profile pictures from GitHub accounts

### Admin Features

- **Admin Dashboard**: Manage badges and students
- **Badge Management**: Create badges with GitHub-hosted images
- **Student Management**: View all registered students
- **Request Management**: Accept/reject badge requests from students

## Tech Stack

- **Frontend**: Nuxt.js 4, Vue 3, TypeScript
- **UI**: Nuxt UI (@nuxt/ui)
- **Backend**: Nuxt server API routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens with bcrypt
- **Images**: GitHub URLs for badges, GitHub API for profile pictures

## Environment Setup

Copy `.env.example` to `.env` and update with your values:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/badges?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
NUXT_AUTH_SECRET=your-auth-secret-here
AUTH_ORIGIN=http://localhost:3000

# GitHub API (for profile pictures)
GITHUB_API_URL=https://api.github.com
```

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

## Database Schema

### User

- Basic info (name, email, password)
- GitHub integration (username, profile link)
- Social links (LinkedIn, Twitter, etc.)
- Role (student/admin)
- Badges array with grant information

### Badge

- Name, description, image URL (GitHub-hosted)
- Created by admin
- Active status

### BadgeRequest

- Student request for specific badge
- Status (pending/approved/rejected)
- Admin response and processing info

## API Routes

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Badges

- `GET /api/badges` - List all active badges (public)
- `POST /api/badges/create` - Create badge (admin only)

### Badge Requests

- `POST /api/badge-requests/create` - Submit badge request (students)
- `GET /api/badge-requests` - List requests (admin)
- `PUT /api/badge-requests/[id]/process` - Approve/reject request (admin)

### Users

- `GET /api/users/[id]/profile` - Get student profile (public)
- `GET /api/users/students` - List all students (admin)

## Key Design Decisions

1. **No File Storage**: All images are GitHub URLs, profile pictures from GitHub API
2. **Minimal Authentication**: Simple JWT-based auth without complex session management  
3. **Role-based Access**: Students can request badges, admins manage everything
4. **Public Profiles**: Student profiles are publicly viewable to showcase badges
5. **GitHub Integration**: Leverages GitHub for both profile pictures and badge images

Locally, you can preview the production build with:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
