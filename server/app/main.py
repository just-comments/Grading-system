from __future__ import annotations

from datetime import datetime

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import PlainTextResponse

from .exporting import rows_to_csv
from .grading import grade_dataset
from .models import ComputeRequest, ExportRequest, LoginRequest, SaveConfigurationRequest
from .parsing import parse_uploaded_file
from .security import issue_token, require_auth
from .settings import settings
from .storage import create_upload_session, get_upload_session, list_configurations, save_configuration

app = FastAPI(
    title="Flexible Grading API",
    version="2.0.0",
    summary="Python-powered grading, analytics, and export service.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.client_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {"ok": True, "timestamp": datetime.utcnow().isoformat() + "Z"}


@app.exception_handler(HTTPException)
async def http_exception_handler(_request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"message": "Invalid request payload.", "errors": exc.errors()},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request, _exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Unexpected server error."},
    )


@app.post("/auth/login")
def login(payload: LoginRequest) -> dict[str, object]:
    if payload.username != settings.admin_user or payload.password != settings.admin_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    return {
        "token": issue_token(payload.username),
        "user": {"username": payload.username},
    }


@app.post("/uploads/analyze")
async def analyze_upload(
    file: UploadFile = File(...),
    _user: str = Depends(require_auth),
) -> dict[str, object]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Please upload a CSV or XLSX file.")

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(status_code=400, detail="Uploaded files must be 5 MB or smaller.")

    try:
        dataset = parse_uploaded_file(file_bytes, file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    session = create_upload_session(dataset)
    return {"sessionId": session["id"], "dataset": dataset}


@app.post("/grading/compute")
def compute_results(
    payload: ComputeRequest,
    _user: str = Depends(require_auth),
) -> dict[str, object]:
    session = get_upload_session(payload.sessionId)
    if session is None:
        raise HTTPException(status_code=404, detail="Upload session not found.")

    try:
        return grade_dataset(session["dataset"], payload.config.model_dump(mode="json"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/grading/configurations", status_code=status.HTTP_201_CREATED)
def create_configuration(
    payload: SaveConfigurationRequest,
    _user: str = Depends(require_auth),
) -> dict[str, object]:
    return save_configuration(payload.model_dump(mode="json"))


@app.get("/grading/configurations")
def get_configurations(_user: str = Depends(require_auth)) -> list[dict[str, object]]:
    return list_configurations()


@app.post("/grading/export", response_class=PlainTextResponse)
def export_results(
    payload: ExportRequest,
    _user: str = Depends(require_auth),
) -> PlainTextResponse:
    csv_output = rows_to_csv(payload.rows, payload.columns)
    return PlainTextResponse(
        csv_output,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="graded-results.csv"'},
    )
