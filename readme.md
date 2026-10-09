```markdown
# Task Database Setup (Docker + PostgreSQL)

A minimal, production-ready setup for a PostgreSQL database with automated schema initialization and a browser-based management UI (Adminer). Optimized for **MacBook Pro M1 (ARM64)**.

---

## Prerequisites

1. **Docker Desktop** installed and running on your Mac.

---

## Project Structure

Ensure your project directory contains these four files:
```text
├── .env
├── docker-compose.yml
├── init.sql
└── README.md

```

---

## Step 1: Create Configuration Files

### 1. `.env`

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=task_db
DB_PORT=5432

```

### 2. `docker-compose.yml`

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: task_postgres_db
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${DB_PORT}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  adminer:
    image: adminer
    container_name: task_adminer
    restart: always
    ports:
      - "8080:8080"

volumes:
  pgdata:

```

### 3. `init.sql`

```sql
CREATE TABLE developers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE developer_skills (
    developer_id INT REFERENCES developers(id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (developer_id, skill_id)
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'To-do',
    assigned_developer_id INT REFERENCES developers(id) ON DELETE SET NULL
);

CREATE TABLE task_skills (
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, skill_id)
);

-- Seed Data
INSERT INTO skills (name) VALUES ('Frontend'), ('Backend');
INSERT INTO developers (name) VALUES ('Alice'), ('Bob'), ('Carol'), ('Dave');
INSERT INTO developer_skills (developer_id, skill_id) VALUES
(1, 1), (2, 2), (3, 1), (3, 2), (4, 2);

```

---

## Step 2: Run and Access

### 1. Start the Containers

Open your terminal in the project directory and run:

```bash
docker compose up -d

```

### 2. Access the Web UI (Adminer)

1. Open your browser and go to: **`http://localhost:8080`**
2. Log in using your credentials:
* **System:** `PostgreSQL`
* **Server:** `db`
* **Username:** `postgres`
* **Password:** `mysecretpassword`
* **Database:** `task_db`



---

## Handy Commands

* **View running containers:** `docker ps`
* **Stop containers:** `docker compose down`
* **Reset everything (wipe database & re-run `init.sql`):** `docker compose down -v`

```

```