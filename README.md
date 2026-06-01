# InventoryHub

Containerized inventory and order management system with a React frontend, FastAPI backend, PostgreSQL database, and Redis cache.

## One-Click Start

1. Create the local environment file:

   ```bash
   cp .env.example .env
   ```

2. Change `DB_PASSWORD` and `ADMIN_PASSWORD` in `.env`. Add `SMTP_*` values when email delivery is required.

3. Start the complete stack:

   ```bash
   docker compose up --build
   ```

Open:

- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Docker Compose waits for PostgreSQL and Redis health checks before starting the backend, then waits for the backend before starting the frontend.

## Container Services

| Service | Image | Host Port | Container Port | Purpose |
| --- | --- | --- | --- | --- |
| `frontend` | `inventoryhub-frontend:latest` | `80` | `80` | React application served by Nginx |
| `backend` | `inventoryhub-backend:latest` | `8000` | `8000` | FastAPI application |
| `db` | `postgres:15-alpine` | `5432` | `5432` | PostgreSQL database |
| `redis` | `redis:7-alpine` | `6379` | `6379` | Cache and OTP storage |

The frontend calls the backend through the browser-visible `VITE_API_URL`. The backend reaches PostgreSQL and Redis through the internal Compose hostnames `db` and `redis`.

## Stop The Stack

```bash
docker compose down
```

Use `docker compose down -v` only when you intentionally want to delete persisted PostgreSQL and Redis data.
