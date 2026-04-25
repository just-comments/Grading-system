from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]


def _strip_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = _strip_quotes(value.strip())
        os.environ.setdefault(key, value)


load_env_file(SERVER_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    port: int
    client_origin: str
    admin_user: str
    admin_password: str
    token_secret: str
    token_ttl_minutes: int
    max_upload_bytes: int


settings = Settings(
    port=int(os.getenv("PORT", "8000")),
    client_origin=os.getenv("CLIENT_ORIGIN", "http://localhost:5173"),
    admin_user=os.getenv("ADMIN_USER", "admin"),
    admin_password=os.getenv("ADMIN_PASSWORD", "flexgrade123"),
    token_secret=os.getenv("TOKEN_SECRET", "change-me-in-production"),
    token_ttl_minutes=int(os.getenv("TOKEN_TTL_MINUTES", "480")),
    max_upload_bytes=int(os.getenv("MAX_UPLOAD_BYTES", str(5 * 1024 * 1024))),
)
