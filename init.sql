-- =========================
-- 1. Schema
-- =========================

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


-- 2. Seed Data

-- Skills
INSERT INTO skills (name) VALUES ('Frontend'), ('Backend');

-- Developers
INSERT INTO developers (name) VALUES ('Alice'), ('Bob'), ('Carol'), ('Dave');

-- Map Developer Skills directly via IDs
INSERT INTO developer_skills (developer_id, skill_id) VALUES
(1, 1), -- Alice -> Frontend
(2, 2), -- Bob -> Backend
(3, 1), -- Carol -> Frontend
(3, 2), -- Carol -> Backend
(4, 2); -- Dave -> Backend