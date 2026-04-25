# Flexible Grading System

A full-stack grading dashboard with a React frontend and a Python backend for CSV/XLSX uploads, weighted scoring, relative grading, group-based evaluation, analytics, and CSV export.

## Tech stack

- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend: FastAPI
- Data handling: pandas, openpyxl
- Upload parsing: CSV and Excel (`.xlsx`)
- Auth: signed bearer token with configurable demo credentials

## Features

- Upload CSV or Excel marksheets
- Detect likely student name, group, and numeric score columns
- Preview uploaded data before grading
- Assign flexible component weights with 100% validation
- Three grading modes:
  - default
  - statistical using `mean + k * std`
  - custom manual boundaries
- Group grading with shared-grade or individual-normalized handling
- Histogram, box plot, grade distribution, mean, median, and standard deviation
- Save grading configurations in memory
- Download computed results as CSV
- Dark mode toggle
- Sample CSV and sample output included

## Project structure

```text
client/         React frontend
server/         FastAPI backend
sample-data/    Example CSV inputs and outputs
docs/           API documentation
```

## Python libraries used

- `fastapi`
- `uvicorn`
- `pandas`
- `openpyxl`
- `python-multipart`

## Local setup

### 1. Install frontend dependencies

From the project root:

```bash
npm install
```

### 2. Install backend dependencies

```bash
python -m pip install -r server/requirements.txt
```

### 3. Create the backend env file

```bash
Copy-Item server\.env.example server\.env
```

### 4. Start both apps

```bash
npm run dev
```

### 5. Open the dashboard

Open [http://localhost:5173](http://localhost:5173)

API base URL:
- `http://localhost:8000`

Demo credentials:

```text
username: admin
password: flexgrade123
```

## Run apps separately

Backend only:

```bash
python -m uvicorn server.app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend only:

```bash
npm --workspace client run dev
```

## Sample workflow

1. Sign in with the demo credentials.
2. Upload either [classroom-groups.csv](C:\Users\K AKSHAY\Documents\Codex\2026-04-24\act-as-a-senior-full-stack\sample-data\classroom-groups.csv) or [classroom-groups.xlsx](C:\Users\K AKSHAY\Documents\Codex\2026-04-24\act-as-a-senior-full-stack\sample-data\classroom-groups.xlsx).
3. Use weights such as:
   - Assignment 1: 15
   - Assignment 2: 15
   - Midterm: 25
   - Final: 35
   - Participation: 10
4. Switch grading mode between `default`, `statistical`, and `custom`.
5. Export final results as CSV.

Expected output format is shown in [sample-output.csv](C:\Users\K AKSHAY\Documents\Codex\2026-04-24\act-as-a-senior-full-stack\sample-data\sample-output.csv).

## Edge cases handled

- Missing score cells remain visible in the final results table
- Non-numeric values are ignored during score calculation instead of breaking the parser
- Duplicate non-empty group IDs trigger group mode detection
- Blank group values stay on an individual path instead of being merged into a fake group
- Unequal group sizes are supported
- Weight totals must equal 100
- Invalid upload extensions are rejected

## Notes for production hardening

- Replace the in-memory stores with Redis or a database
- Add persistent saved configurations per user
- Move authentication to a proper identity provider
- Add automated backend and frontend tests
- Add rate limiting and structured audit logging
