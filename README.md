# InventoryHub

InventoryHub is a containerized inventory and order management system. It includes a React frontend, a FastAPI backend, PostgreSQL for persistent data, and Redis for caching and OTP storage.

## What This Project Is

InventoryHub is a business dashboard for managing inventory, customers, and orders from one place. It is designed for small shops, warehouses, internal teams, and learning projects where users need to track products, maintain customer records, create orders, update stock levels, and view business activity through a clean dashboard.

The project demonstrates a complete full-stack application with authentication, API-driven data management, persistent database storage, caching, email integration, and Docker-based deployment. It can be used as a practical inventory system, a college/project submission, or a foundation for a larger business management platform.

## How InventoryHub Is Helpful

- Reduces manual inventory tracking by keeping products, stock, customers, and orders in one system.
- Helps avoid stock mistakes by updating inventory when orders are created, sold, or cancelled.
- Gives users a dashboard view of important business information.
- Stores customer and order records so teams can review previous transactions.
- Supports secure sign-in with OTP verification.
- Can send order details by email when SMTP is configured.
- Runs with Docker Compose, making setup easier across different machines.
- Provides a clean codebase for learning React, FastAPI, PostgreSQL, Redis, REST APIs, and containerization.

## Features

- Secure login with two-factor verification
- Development OTP fallback code when SMTP is not configured
- Product inventory management
- Customer management
- Order creation, cancellation, and sold-order history
- Dashboard summary for business metrics
- Customer order email support when SMTP is configured
- Docker Compose setup for one-command execution

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, CSS |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL in Docker, SQLite for local backend fallback |
| Cache | Redis |
| Email | SMTP |
| Containers | Docker, Docker Compose |

## Project Structure

```text
InventoryHub/
+-- backend/
|   +-- app/
|   |   +-- auth.py
|   |   +-- cache.py
|   |   +-- config.py
|   |   +-- crud.py
|   |   +-- database.py
|   |   +-- email_service.py
|   |   +-- main.py
|   |   +-- models.py
|   |   +-- schemas.py
|   +-- Dockerfile
|   +-- requirements.txt
+-- frontend/
|   +-- public/
|   +-- src/
|   |   +-- components/
|   |   +-- utils/
|   |   +-- App.jsx
|   |   +-- main.jsx
|   +-- Dockerfile
|   +-- nginx.conf
|   +-- package.json
+-- .env.example
+-- .gitignore
+-- docker-compose.yml
+-- README.md
```

## Prerequisites

Install these before running the project:

- Git
- Docker Desktop
- Node.js and npm, only needed for local frontend development
- Python 3.10 or newer, only needed for local backend development

## Clone The Repository

```bash
git clone https://github.com/Tejaswini2A9/InventoryHub.git
cd InventoryHub
```

If you are using PowerShell on Windows:

```powershell
git clone https://github.com/Tejaswini2A9/InventoryHub.git
cd InventoryHub
```

## Environment Setup

Create a local environment file from the example:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Update these important values in `.env`:

```env
DB_USER=postgres
DB_PASSWORD=change-me
DB_NAME=inventory_db
ADMIN_EMAIL=admin@inventoryhub.com
ADMIN_PASSWORD=change-me
FRONTEND_PORT=80
BACKEND_PORT=8000
POSTGRES_PORT=5432
REDIS_PORT=6379
VITE_API_URL=http://localhost:8000
```

Change `DB_PASSWORD` and `ADMIN_PASSWORD` before using the app seriously.

SMTP variables are optional for local testing:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=InventoryHub
SMTP_USE_TLS=true
```

When SMTP is not configured, the login OTP uses the development testing code `000000`.

## Run With Docker Compose

Start the full application:

```bash
docker compose up --build
```

PowerShell uses the same command:

```powershell
docker compose up --build
```

After the services start, open:

- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- API documentation: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Docker Compose starts PostgreSQL and Redis first, waits for their health checks, starts the backend, then starts the frontend after the backend is healthy.

## Default Login Flow

On startup, the backend creates the default administrator account from `.env`:

```env
ADMIN_EMAIL=admin@inventoryhub.com
ADMIN_PASSWORD=change-me
```

To sign in:

1. Open `http://localhost`.
2. Enter the admin email and password from `.env`.
3. If SMTP is not configured, enter OTP code `000000`.
4. If SMTP is configured, check the configured email inbox for the OTP.

The app displays a same-line development note beside the OTP field when the fixed development code is being used.

## Stop The Application

Stop containers while keeping database and Redis data:

```bash
docker compose down
```

Stop containers and delete persisted PostgreSQL and Redis data:

```bash
docker compose down -v
```

Use `docker compose down -v` only when you intentionally want a fresh database/cache.

## Docker Services

| Service | Container | Host Port | Container Port | Purpose |
| --- | --- | --- | --- | --- |
| `frontend` | `ethara_frontend` | `80` | `80` | React app served by Nginx |
| `backend` | `ethara_backend` | `8000` | `8000` | FastAPI API |
| `db` | `ethara_db` | `5432` | `5432` | PostgreSQL database |
| `redis` | `ethara_redis` | `6379` | `6379` | Cache and OTP storage |

Docker volumes:

| Volume | Purpose |
| --- | --- |
| `ethara_postgres_data` | PostgreSQL data |
| `ethara_redis_data` | Redis data |

Docker network:

| Network | Purpose |
| --- | --- |
| `ethara_network` | Internal communication between services |

## Backend API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | Health/welcome endpoint |
| `POST` | `/auth/login` | Validate credentials and generate OTP |
| `POST` | `/auth/verify-2fa` | Verify OTP and return session token |
| `POST` | `/auth/register` | Create a new user account |
| `GET` | `/products` | List products |
| `POST` | `/products` | Create product |
| `GET` | `/products/{product_id}` | Get product by ID |
| `PUT` | `/products/{product_id}` | Update product |
| `DELETE` | `/products/{product_id}` | Delete product |
| `GET` | `/customers` | List customers |
| `POST` | `/customers` | Create customer |
| `GET` | `/customers/{customer_id}` | Get customer by ID |
| `DELETE` | `/customers/{customer_id}` | Delete customer |
| `GET` | `/orders` | List active orders |
| `POST` | `/orders` | Create order |
| `GET` | `/orders/history` | List sold orders |
| `GET` | `/orders/{order_id}` | Get order details |
| `PATCH` | `/orders/{order_id}/sold` | Mark order as sold |
| `POST` | `/orders/{order_id}/email` | Email order details to customer |
| `DELETE` | `/orders/{order_id}` | Cancel/delete order and restock items |
| `GET` | `/dashboard` | Dashboard summary |

Interactive API documentation is available at `http://localhost:8000/docs`.

## Local Backend Development

Use these steps if you want to run the backend without Docker.

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Bash:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a backend environment file:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Start the backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If `DATABASE_URL` is not changed, the backend uses SQLite at `backend/inventory_db.db`.

## Local Frontend Development

Use these steps if you want to run the frontend without Docker.

```bash
cd frontend
npm install
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

The frontend API base URL is controlled by `VITE_API_URL`. For local backend development, use:

```env
VITE_API_URL=http://localhost:8000
```

## Build And Validation Commands

Frontend production build:

```bash
cd frontend
npm run build
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Backend syntax check:

```bash
python -m py_compile backend/app/auth.py backend/app/main.py backend/app/email_service.py
```

Docker rebuild:

```bash
docker compose up --build
```

## Git Workflow

Check current changes:

```bash
git status
```

Add all project changes:

```bash
git add .
```

Add a specific file:

```bash
git add README.md
```

Commit changes:

```bash
git commit -m "Describe your change"
```

Push to GitHub:

```bash
git push
```

If this is the first push from a new local clone:

```bash
git branch -M main
git remote add origin https://github.com/Tejaswini2A9/InventoryHub.git
git push -u origin main
```

If the remote already exists, do not add it again. Check remotes with:

```bash
git remote -v
```

## Common Troubleshooting

### Port already in use

Change the relevant port in `.env`, for example:

```env
FRONTEND_PORT=8080
BACKEND_PORT=8001
POSTGRES_PORT=5433
REDIS_PORT=6380
```

Then restart:

```bash
docker compose down
docker compose up --build
```

### Login OTP email not received

If SMTP is not configured, this is expected. Use the development OTP code:

```text
000000
```

To send real OTP emails, configure `SMTP_HOST`, `SMTP_FROM_EMAIL`, and the related SMTP values in `.env`.

### Need a clean database

Run:

```bash
docker compose down -v
docker compose up --build
```

This removes the persisted PostgreSQL and Redis volumes.

### Frontend cannot reach backend

Confirm the backend is running:

```text
http://localhost:8000
```

Confirm `VITE_API_URL` points to the backend:

```env
VITE_API_URL=http://localhost:8000
```

Rebuild the frontend after changing `VITE_API_URL`:

```bash
docker compose up --build frontend
```

## Future Improvements

The current version is a strong foundation. These improvements can make it more production-ready and business-friendly:

- Add role-based access control for admin, manager, and staff users.
- Replace the mock session token with proper JWT authentication and refresh tokens.
- Add password reset and email verification flows.
- Add product categories, suppliers, brands, and warehouse/location tracking.
- Add barcode or QR code scanning for faster product lookup.
- Add low-stock alerts and reorder reminders.
- Add advanced dashboard charts for sales, revenue, stock movement, and best-selling products.
- Add invoice and receipt PDF generation.
- Add CSV/Excel import and export for products, customers, and orders.
- Add audit logs to track who created, updated, or deleted records.
- Add unit tests, backend API tests, and frontend component tests.
- Add CI/CD with GitHub Actions for automated build and test checks.
- Add deployment guides for cloud platforms such as Render, Railway, AWS, Azure, or DigitalOcean.
- Improve security with stronger password hashing, stricter CORS settings, HTTPS, and secret management.
- Add multi-tenant support so multiple businesses can use separate workspaces.
- Add mobile-responsive refinements or a dedicated mobile app experience.

## Notes

- `.env` files are ignored by Git and should not be committed.
- `.env.example` is committed so other developers know which variables are required.
- Redis is used for cache and OTP storage. The backend can still fall back to in-memory OTP state if Redis is unavailable in local development.
- Customer order emails require SMTP configuration.
