# 📋 Task Assignment Web App

A simple web app to manage tasks, break them down into smaller subtasks, assign the right developers based on their skills, and get smart skill suggestions powered by AI.

Everything runs in **Docker**, so you can get the whole project up and running with just **one command**.

---

## 📌 Table of Contents

1. [How the App Works](#-how-the-app-works)
   - [Backend Architecture](#backend-architecture)
   - [How Data is Saved](#how-data-is-saved)
   - [How Tasks Get Assigned Correctly](#how-tasks-get-assigned-correctly)
   - [Smart AI Suggestions (With a Backup Plan)](#smart-ai-suggestions-with-a-backup-plan)
   - [User-Friendly Buttons & Dropdowns](#user-friendly-buttons--dropdowns)
2. [How to Run with Docker (Recommended)](#-how-to-run-with-docker-recommended)
   - [Before You Start](#before-you-start)
   - [Step 1: Download the Project](#step-1-download-the-project)
   - [Step 2: Copy the Settings File](#step-2-copy-the-settings-file)
   - [Step 3: Start the App with Docker](#step-3-start-the-app-with-docker)
   - [Step 4: Open in Your Browser](#step-4-open-in-your-browser)
   - [Accessing the Database Web UI (Adminer)](#accessing-the-database-web-ui-adminer)
   - [Useful Docker Commands](#useful-docker-commands)
3. [API Guide (How the Frontend Talks to the Backend)](#-api-guide-how-the-frontend-talks-to-the-backend)
   - [List of Endpoints](#list-of-endpoints)
   - [Simple Examples](#simple-examples)
   - [Testing with Postman](#testing-with-postman)
4. [Why These Tools Were Chosen](#-why-these-tools-were-chosen)
5. [Running Locally (Without Docker - Optional)](#-running-locally-without-docker---optional)

---

## 💡 How the App Works

If you're new to web development or just want a clear overview, here is how everything fits together in plain English.

### Backend Architecture

Instead of putting all the backend code into one giant file, the backend is organized into **four simple folders** inside `backend/src/`:

```text
A user clicks a button in the browser (e.g. "Assign Alice to Task 1")
                               │
                               ▼
┌────────────────────────────────────────────────────────┐
│ 1. 📁 routes/ (The Traffic Director)                   │
│    - Files: task.routes.ts, developer.routes.ts        │
│    - Looks at the web address (like PATCH /tasks/1)    │
│    - Sends the request to the right controller         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. 📁 controllers/ (The Front Desk)                    │
│    - Files: task.controller.ts, developer.controller.ts│
│    - Reads what the user sent                          │
│    - Checks basic things (like "Is task ID a number?") │
│    - Hands the real work to the service layer          │
│    - Sends the final reply back to the browser         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. 📁 services/ (The Brain)                            │
│    - Files: task.service.ts, developer.service.ts      │
│    - Checks all the real-world rules:                  │
│      • Does Alice have the skills needed for this task?│
│      • Are all subtasks done before closing the task?  │
│      • Is this status change allowed?                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. 📁 models/ (The Database Helper)                    │
│    - Files: task.repository.ts, developer.repository.ts│
│    - Writes and runs SQL queries                       │
│    - Saves, updates, or reads data from PostgreSQL     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
                  [( PostgreSQL Database )]
```

#### Why split things this way?
- **Each folder has one job**:
  - Want to change a URL? Look in **`routes/`**.
  - Want to check inputs or status codes? Look in **`controllers/`**.
  - Want to change a rule? Look in **`services/`**.
  - Want to change a database query? Look in **`models/`**.
- **No giant messy files**: You always know exactly where to find the code you need.

---

### How Data is Saved

All data is stored in a **PostgreSQL** database:

- **Developers**: Have a name (like Alice or Bob).
- **Skills**: Things like `Frontend` or `Backend`.
- **Tasks**: Have a title, a status (`To-do`, `In Progress`, `Done`), required skills, and an assigned developer.
- **Subtasks**: Larger tasks can have smaller subtasks nested underneath them.

#### Thoughtful database details:
- **Safe connections**: If a developer is removed, their tasks don't break or disappear. They just become *"Unassigned"*.
- **Automatic cleanup**: If you delete a main task, all its subtasks get deleted too, so you don't end up with leftover junk.
- **Clean numbering**: Only main tasks get numbers (`#1`, `#2`, `#3`). Subtasks sit neatly underneath them without taking up new numbers.

---

### How Tasks Get Assigned Correctly

To make sure work goes to the right people and gets completed properly, the app follows a few simple guidelines:

- **Matching skills to the job**: A developer must have every skill a task asks for before they can be assigned. For example, if a task needs `Frontend`, only developers with `Frontend` skills can take it.
- **Taking things step by step**: Work moves forward in order (`To-do` ➔ `In Progress` ➔ `Done`), preventing tasks from being marked finished before anyone has started them.
- **Finishing subtasks first**: A bigger task is only considered `Done` once every subtask under it is completed.

---

### Smart AI Suggestions (With a Backup Plan)

When you add a task without picking any skills, the app tries to help:

1. It reads your task title (for example: *"Build Login Screen"*).
2. It asks **Google Gemini AI**: *"What skills does this task need?"*
3. The AI suggests: **Frontend**.
4. A green suggestion appears on the task with two buttons:
   - **Apply**: Adds the suggested skills to the task.
   - **Dismiss**: Ignores the suggestion.
   *(Nothing is saved to the database until you click Apply).*

---

### User-Friendly Buttons & Dropdowns

To keep things smooth and prevent frustrating errors:
- **Task has no skills yet?** You cannot pick a developer. The dropdown is grayed out with a note: *"Please assign skills to this task before assigning a developer"*.
- **Developer missing skills?** The developer is grayed out in the dropdown with a *"Cannot select: developer lacks required skills"* badge.
- **Want to remove a developer?** Just select *"Unassigned"* from the dropdown.
- **Are you sure?** Before changing a status or reassigning someone, a simple confirmation pop-up asks you to confirm so you don't make mistakes by accident.

---

## 🚀 How to Run with Docker (Recommended)

Docker runs everything in self-contained containers. You don't need to manually install or configure Node.js, PostgreSQL, or web servers on your machine.

### Before You Start

Make sure you have:
1. **Docker Desktop** installed and running on your computer:
   - [Download Docker Desktop (Mac / Windows / Linux)](https://www.docker.com/products/docker-desktop/)
   - *Ensure the Docker whale icon in your menu bar or system tray shows that Docker is active and running.*
2. **Git** (to download the project):
   - [Download Git](https://git-scm.com/)

---

### Step 1: Download the Project

Open your Terminal (Mac/Linux) or Command Prompt / PowerShell (Windows) and clone the repository:

```bash
git clone https://github.com/derricktan23/xDigital_App.git
cd xDigital_App
```

---

### Step 2: Copy the Settings File

Make a copy of the starter settings file:

```bash
cp .env.example .env
```

The `.env` file comes pre-configured with default values that work out of the box:

```env
# Database Settings
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=task_assignment_db
DB_PORT=5432

# Backend API Port
PORT=5001

# Optional: Google Gemini AI Key
GEMINI_API_KEY=your_gemini_api_key_here
```

> 💡 **Good to know**: The Gemini API key is completely optional! If you leave it blank, the app will smoothly use its built-in keyword matcher instead.

---

### Step 3: Start the App with Docker

Run this single command in the project folder:

```bash
docker compose up --build -d
```

#### What does Docker do?
- Starts the **PostgreSQL database** container and automatically loads initial sample tasks, skills, and developers.
- Builds and starts the **Node.js Express backend** on port `5001`.
- Builds and serves the **React frontend** on port `3000`.
- Starts **Adminer** (web database viewer) on port `8080`.

---

### Step 4: Open in Your Browser

Once Docker finishes building and starting, open your browser:

| Service | URL | What You See |
| :--- | :--- | :--- |
| **Main Web App** | **[http://localhost:3000](http://localhost:3000)** | The main interactive task manager |
| **Backend Health Check** | **[http://localhost:5001/health](http://localhost:5001/health)** | Server status (shows `{ "status": "ok" }`) |
| **Database Web UI** | **[http://localhost:8080](http://localhost:8080)** | Adminer database management tool |

---

### Accessing the Database Web UI (Adminer)
---

1. Open your browser and go to: **`http://localhost:8080`**
2. Log in using your credentials:
* **System:** `PostgreSQL`
* **Server:** `db`
* **Username:** `postgres`
* **Password:** `mysecretpassword`
* **Database:** `task_db` *(or `task_assignment_db`)*

---

### Useful Docker Commands

- **Stop the app**:
  ```bash
  docker compose down
  ```
- **See live backend logs**:
  ```bash
  docker compose logs -f backend
  ```
- **See live frontend logs**:
  ```bash
  docker compose logs -f frontend
  ```
- **Reset everything back to fresh sample data**:
  ```bash
  docker compose down -v
  docker compose up --build -d
  ```

---

## 📡 API Guide (How the Frontend Talks to the Backend)

The frontend talks to the backend by sending simple web requests (JSON).

### List of Endpoints

| What you want to do | Method & URL | Description |
| :--- | :--- | :--- |
| **Health Check** | `GET /health` | Checks if the server is running |
| **Get Tasks** | `GET /tasks` | Gets all tasks, subtasks, skills, and developers |
| **Create Task** | `POST /tasks` | Adds a new task or subtask |
| **Change Status** | `PATCH /tasks/:id/status` | Moves task from `To-do` ➔ `In Progress` ➔ `Done` |
| **Assign Developer** | `PATCH /tasks/:id/assign` | Assigns a developer (or send `null` to unassign) |
| **Update Skills** | `PATCH /tasks/:id/skills` | Updates the skills needed for a task |
| **Ask AI for Skills** | `POST /tasks/:id/recommend-skills` | Gets skill suggestions based on the title |
| **Get Developers** | `GET /developers` | Lists all developers and their skills |
| **Get Skills** | `GET /skills` | Lists all available skills |

---

### Simple Examples

#### 1. Assign a Developer
Send a `PATCH` request to `/tasks/1/assign`:
```json
{
  "developer_id": 1
}
```
*Assigns Developer #1 (if they have the required skills).*

#### 2. Unassign a Developer
Send a `PATCH` request to `/tasks/1/assign`:
```json
{
  "developer_id": null
}
```
*Clears the developer from the task safely.*

#### 3. Change Task Status
Send a `PATCH` request to `/tasks/1/status`:
```json
{
  "status": "In Progress"
}
```

---

### Testing with Postman

A ready-to-use Postman collection file is included in the root folder:
📁 **`task_manager_api.postman_collection.json`**

1. Open Postman.
2. Click **Import** in the top left.
3. Drag and drop the `task_manager_api.postman_collection.json` file.
4. Test any endpoint with one click.

---

## 🛠️ Why These Tools Were Chosen

The project uses well-known, reliable tools that keep development simple:

### Backend Tools

| Tool | Why It Was Chosen |
| :--- | :--- |
| **TypeScript** | Catches spelling mistakes and bugs while typing code before runtime. |
| **Express** | The simplest and most popular web server library for Node.js. |
| **PostgreSQL (`pg`)** | A reliable database that keeps data organized with clear relationships. |
| **Dotenv** | Keeps passwords and secrets in `.env` instead of hardcoding them into code. |
| **Native Fetch** | Uses Node.js's built-in web request tool to talk to Gemini AI, avoiding heavy extra packages. |

### Frontend Tools

| Tool | Why It Was Chosen |
| :--- | :--- |
| **React JS** | Updates the screen smoothly when things change without reloading the whole page. |
| **Material UI (MUI)** | Provides ready-to-use, polished buttons, tables, dropdowns, and dialogs. |
| **Axios** | Makes sending requests to the backend clean and easy to read. |

### Docker Setup

| Tool | Why It Was Chosen |
| :--- | :--- |
| **Docker Compose** | Bundles the whole app so anyone can run it on any machine with zero setup pain. |
| **Postgres Alpine** | A super small, lightweight version of PostgreSQL (under 80MB). |
| **Nginx** | A fast web server that serves the frontend website. |
| **Adminer** | A tiny, single-file tool to look at database tables right in your browser. |

---

## 💻 Running Locally (Without Docker - Optional)

> 💡 **Note**: Most users should use **Docker** above. Only follow these steps if you prefer running PostgreSQL and Node.js directly on your computer.

### 1. Database Setup
Make sure PostgreSQL is installed and running on port `5432`, create a database called `task_assignment_db`, and run the seed script:
```bash
psql -U postgres -d task_assignment_db -f db/init.sql
```

### 2. Run Backend
```bash
cd backend
npm install
npm run dev
```
*Runs at **`http://localhost:5001`**.*

### 3. Run Frontend
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Runs at **`http://localhost:3000`**.*

---

## 📄 License

Created for task management and developer assessment. Free to use, modify, and learn from!