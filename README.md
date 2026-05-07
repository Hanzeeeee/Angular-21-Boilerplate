# Angular 21 Auth Boilerplate - CHRIST HANZEN RALLOS - BSIT - 3 

A comprehensive Angular 21 authentication boilerplate featuring sign-up with email verification, login, password reset, and role-based authorization.

## Features

- Email sign up with verification
- JWT authentication with refresh tokens
- Role-based authorization (Admin & User roles)
- Forgot password and password reset functionality
- User profile management
- Admin section with account management
- Fake backend API for testing
- Bootstrap 5 styling
- Lazy-loaded feature modules

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Angular CLI 21.x

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:4200`.

### Build for Production

```bash
npm run build:prod
```

## Project Structure

```
src/
├── app/
│   ├── _components/         # Shared components (Alert)
│   ├── _helpers/            # Guards, interceptors, validators
│   ├── _models/             # Data models and enums
│   ├── _services/           # Services (Account, Alert)
│   ├── account/             # Account feature module (Login, Register, etc.)
│   ├── admin/               # Admin feature module
│   │   └── accounts/        # Accounts management sub-module
│   ├── home/                # Home component
│   ├── profile/             # Profile feature module
│   ├── app.component.*      # Root component
│   ├── app.module.ts        # Root module
│   └── app-routing.module.ts # Root routing module
├── environments/            # Environment configurations
├── index.html              # Main HTML file
├── main.ts                 # Application entry point
├── styles.less             # Global styles
└── polyfills.ts            # Browser polyfills
```

## Usage

### First Account

The first account registered is assigned the Admin role. Subsequent accounts are assigned the User role.

### Fake Backend

The application uses a fake backend API by default for testing. To use a real backend, remove the `FakeBackendInterceptor` from the providers array in `app.module.ts`.

### Testing Accounts

1. Register a new account
2. Check the fake email verification message on screen
3. Click the verification link to verify the account
4. Login with your credentials

## Authentication Flow

- User logs in with email and password
- Server returns JWT access token (15-minute expiration) and refresh token (7-day expiration)
- Refresh token is stored in localStorage
- JWT is automatically refreshed 1 minute before expiration
- Refresh token is used to generate new JWT tokens

## API Endpoints (Fake Backend)

- `POST /accounts/authenticate` - Login
- `POST /accounts/register` - Register new account
- `POST /accounts/verify-email` - Verify email
- `POST /accounts/forgot-password` - Request password reset
- `POST /accounts/validate-reset-token` - Validate reset token
- `POST /accounts/reset-password` - Reset password
- `POST /accounts/refresh-token` - Refresh JWT token
- `GET /accounts` - Get all accounts (Admin only)
- `GET /accounts/:id` - Get account by ID
- `POST /accounts` - Create new account (Admin only)
- `PUT /accounts/:id` - Update account
- `DELETE /accounts/:id` - Delete account

## Technologies

- Angular 21.2.7
- Bootstrap 5
- RxJS
- TypeScript
- Less

## License

MIT
