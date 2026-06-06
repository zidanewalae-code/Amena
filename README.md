# AMENA

AMENA is a humanitarian donation and solidarity platform.
It is organized around a stable MVC structure with a React/Vite frontend, a Node.js/Express backend, Sequelize models, JWT authentication, and RBAC-based access control.

## Technologies Used

### Frontend
- React
- Vite
- React Router
- Axios
- CSS

### Backend
- Node.js
- Express
- Sequelize
- JWT
- bcrypt
- SQLite / MariaDB

## Project Overview

- The frontend uses `web/src/lib/access.js` as the single source of truth for role-based navigation and page access.
- The backend enforces authentication and authorization with JWT and RBAC middleware.
- The database layer uses Sequelize models and associations without changing the existing schema.
- The current validated local setup works with a persistent SQLite database.

## Installation on Another PC

### Prerequisites
Install:
- Node.js
- npm
- Git
- VS Code
- XAMPP or MariaDB if you want to use MariaDB instead of SQLite

### Clone the project
```bash
git clone <repo-url>
cd amena
```

## Backend Installation

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
JWT_SECRET=amena_secret
DB_DIALECT=sqlite
DB_STORAGE=./dev.sqlite
```

Start the backend:

```bash
npm start
```

## Frontend Installation

```bash
cd web
npm install
npm run dev
```

## Test Accounts

### Comptes vérifiés localement

#### Admin
- Email: admin@amena.tn
- Password: secret123

#### Donator
- Email: don.rbac.20260517103148@amena.local
- Password: Test123!

#### Organization
- Email: org.rbac.20260517103148@amena.local
- Password: Test123!

#### Delivery Person
- Email: del.rbac.20260517103148@amena.local
- Password: Test123!

> `donor1@amena.tn` n’est pas présent dans la base locale actuelle.

## Project Structure

### Backend
- `controllers/`
- `routes/`
- `middleware/`
- `models/`
- `config/`
- `tests/`

### Frontend
- `pages/`
- `components/`
- `context/`
- `services/`
- `lib/access.js`

## RBAC Summary

### Admin
- users
- orders
- payments
- alerts

### Donator
- donations
- orders
- history

### Organization
- products
- donations
- orders
- alerts

### Delivery Person
- assigned orders
- history

## Important Routes

### Frontend
- `/dashboard/admin`
- `/dashboard/donator`
- `/dashboard/organization`
- `/dashboard/delivery-person`

### Backend
- `/api/auth/login`
- `/api/auth/register`
- `/api/orders`
- `/api/payments`
- `/api/products`
- `/api/alerts`

## Security

- JWT protects API requests.
- `ProtectedRoute` blocks unauthorized frontend routes.
- `access.js` controls the visible dashboard links and allowed pages.
- Backend RBAC middleware returns `401` without a valid token and `403` for forbidden roles.
- Ownership checks protect user-specific data such as donor history and assigned delivery orders.

## Final State

- Frontend build OK.
- Backend startup OK.
- Dashboards OK.
- RBAC OK.
- CRUD OK.
- SQLite persistence OK.
- READY.
