from __future__ import annotations

from collections import Counter
from datetime import date, datetime
from io import BytesIO
from pathlib import Path
from typing import Any

import pandas as pd

from .runtime import ensure_optional_site_packages

NAME_HINTS = ("student", "name", "learner", "candidate")
GROUP_HINTS = ("group", "team", "project", "batch")


def normalize_number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None

    if isinstance(value, (int, float)):
        return float(value)

    text = str(value or "").strip().replace(",", "")
    if not text:
        return None

    try:
        return float(text)
    except ValueError:
        return None


def clean_header(value: Any, fallback: str) -> str:
    text = str(value or "").strip()
    return text or fallback


def score_header(header: str) -> str:
    return " ".join(header.lower().split())


def infer_column(headers: list[str], hints: tuple[str, ...]) -> str | None:
    for header in headers:
        normalized = score_header(header)
        if any(hint in normalized for hint in hints):
            return header
    return None


def is_blank(value: Any) -> bool:
    return str(value or "").strip() == ""


def normalize_cell(value: Any) -> Any:
    if pd.isna(value):
        return ""

    if hasattr(value, "item"):
        try:
            value = value.item()
        except ValueError:
            pass

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, float) and value.is_integer():
        return int(value)

    return value


def read_dataframe(file_bytes: bytes, filename: str) -> pd.DataFrame:
    suffix = Path(filename).suffix.lower()
    stream = BytesIO(file_bytes)

    if suffix == ".csv":
        return pd.read_csv(stream, dtype=object, keep_default_na=False)

    if suffix == ".xlsx":
        ensure_optional_site_packages()
        try:
            import openpyxl  # noqa: F401
        except ImportError as exc:
            raise ValueError(
                "Excel support requires openpyxl. Install the Python dependencies from server/requirements.txt.",
            ) from exc

        dataframe = pd.read_excel(stream, dtype=object, engine="openpyxl")
        return dataframe.astype(object).where(~dataframe.isna(), "")

    raise ValueError("Only CSV and XLSX files are supported.")


def infer_numeric_columns(rows: list[dict[str, Any]], headers: list[str]) -> list[str]:
    inferred: list[str] = []

    for header in headers:
        numeric_count = 0
        non_empty_count = 0

        for row in rows:
            value = row.get(header, "")
            if is_blank(value):
                continue

            non_empty_count += 1
            if normalize_number(value) is not None:
                numeric_count += 1

        if non_empty_count and numeric_count / non_empty_count >= 0.7:
            inferred.append(header)

    return inferred


def parse_uploaded_file(file_bytes: bytes, filename: str) -> dict[str, Any]:
    dataframe = read_dataframe(file_bytes, filename)
    if dataframe.empty:
        raise ValueError("The uploaded file does not contain any data rows.")

    headers = [clean_header(column, f"Column {index + 1}") for index, column in enumerate(dataframe.columns)]
    dataframe.columns = headers
    dataframe = dataframe.astype(object).where(~dataframe.isna(), "")

    rows: list[dict[str, Any]] = []
    for raw_row in dataframe.to_dict(orient="records"):
        normalized_row = {header: normalize_cell(raw_row.get(header, "")) for header in headers}
        if any(not is_blank(value) for value in normalized_row.values()):
            rows.append(normalized_row)

    if not rows:
        raise ValueError("The uploaded file does not contain any data rows.")

    name_column = infer_column(headers, NAME_HINTS) or headers[0]
    group_column = infer_column(headers, GROUP_HINTS)
    numeric_columns = [
        header
        for header in infer_numeric_columns(rows, headers)
        if header not in {name_column, group_column}
    ]

    group_frequencies = Counter()
    if group_column:
        for row in rows:
            group_value = str(row.get(group_column, "")).strip()
            if group_value:
                group_frequencies[group_value] += 1

    detected_type = (
        "group"
        if group_column and any(count > 1 for count in group_frequencies.values())
        else "individual"
    )

    missing_value_count = sum(
        1
        for row in rows
        for header in headers
        if is_blank(row.get(header, ""))
    )

    return {
        "filename": filename,
        "headers": headers,
        "rows": rows,
        "preview": rows[:8],
        "detectedType": detected_type,
        "rowCount": len(rows),
        "nameColumn": name_column,
        "groupColumn": group_column,
        "numericColumns": numeric_columns,
        "missingValueCount": missing_value_count,
    }
