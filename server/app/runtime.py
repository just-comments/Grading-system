from __future__ import annotations

import os
import sys
from pathlib import Path


def ensure_optional_site_packages() -> None:
    candidates = [
        os.getenv("CODEX_BUNDLED_PYTHON_SITE_PACKAGES", "").strip(),
        str(
            Path.home()
            / ".cache"
            / "codex-runtimes"
            / "codex-primary-runtime"
            / "dependencies"
            / "python"
            / "Lib"
            / "site-packages"
        ),
    ]

    for raw_candidate in candidates:
        if not raw_candidate:
            continue

        candidate = Path(raw_candidate).expanduser()
        if candidate.exists():
            resolved = str(candidate.resolve())
            if resolved not in sys.path:
                sys.path.append(resolved)
