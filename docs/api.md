# Flexible Grading API

Base URL: `http://localhost:8000`

Backend stack:
- FastAPI
- pandas
- openpyxl
- python-multipart

Authentication:
- `POST /auth/login` returns a bearer token.
- Send `Authorization: Bearer <token>` for all `/uploads` and `/grading` routes.

## `POST /auth/login`

Request body:

```json
{
  "username": "admin",
  "password": "flexgrade123"
}
```

Response:

```json
{
  "token": "signed-token",
  "user": {
    "username": "admin"
  }
}
```

## `GET /health`

Response:

```json
{
  "ok": true,
  "timestamp": "2026-04-24T17:35:00.000000Z"
}
```

## `POST /uploads/analyze`

Multipart form-data:
- `file`: CSV or XLSX file up to 5 MB

Response:

```json
{
  "sessionId": "uuid",
  "dataset": {
    "filename": "classroom-groups.csv",
    "headers": ["Student Name", "Group ID", "Assignment 1"],
    "detectedType": "group",
    "nameColumn": "Student Name",
    "groupColumn": "Group ID",
    "numericColumns": ["Assignment 1", "Assignment 2", "Midterm", "Final", "Participation"],
    "preview": []
  }
}
```

## `POST /grading/compute`

Request body:

```json
{
  "sessionId": "uuid",
  "config": {
    "components": ["Assignment 1", "Assignment 2", "Midterm", "Final", "Participation"],
    "weights": {
      "Assignment 1": 15,
      "Assignment 2": 15,
      "Midterm": 25,
      "Final": 35,
      "Participation": 10
    },
    "mode": "statistical",
    "groupStrategy": "shared",
    "grading": {
      "rules": [
        { "grade": "A", "k": 1 },
        { "grade": "B", "k": 0 },
        { "grade": "C", "k": -0.5 },
        { "grade": "D", "k": -1 },
        { "grade": "F", "k": -100 }
      ],
      "boundaries": [
        { "grade": "A", "min": 85 },
        { "grade": "B", "min": 75 },
        { "grade": "C", "min": 65 },
        { "grade": "D", "min": 50 },
        { "grade": "F", "min": 0 }
      ]
    }
  }
}
```

Response includes:
- `boundaries`
- `statistics`
- `analytics.histogram`
- `analytics.gradeDistribution`
- `analytics.boxPlot`
- `rows`

## `POST /grading/export`

Request body:

```json
{
  "columns": ["Student Name", "weightedScore", "finalGrade"],
  "rows": [
    {
      "Student Name": "Alice Johnson",
      "weightedScore": 73.95,
      "finalGrade": "B"
    }
  ]
}
```

Response:
- CSV file download

## `POST /grading/configurations`

Persist a grading preset in memory for the current server process.

## `GET /grading/configurations`

List saved grading presets.
