from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any
from uuid import uuid4

_upload_sessions: dict[str, dict[str, Any]] = {}
_saved_configurations: dict[str, dict[str, Any]] = {}
_store_lock = Lock()


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_upload_session(dataset: dict[str, Any]) -> dict[str, Any]:
    session = {
        "id": str(uuid4()),
        "createdAt": _timestamp(),
        "dataset": dataset,
    }

    with _store_lock:
        _upload_sessions[session["id"]] = session

    return session


def get_upload_session(session_id: str) -> dict[str, Any] | None:
    with _store_lock:
        return _upload_sessions.get(session_id)


def save_configuration(payload: dict[str, Any]) -> dict[str, Any]:
    record = {
        "id": str(uuid4()),
        "createdAt": _timestamp(),
        **payload,
    }

    with _store_lock:
        _saved_configurations[record["id"]] = record

    return record


def list_configurations() -> list[dict[str, Any]]:
    with _store_lock:
        records = list(_saved_configurations.values())

    return sorted(records, key=lambda item: item["createdAt"], reverse=True)
