from __future__ import annotations

from csv import DictWriter
from io import StringIO
from typing import Any


def rows_to_csv(rows: list[dict[str, Any]], columns: list[str]) -> str:
    output = StringIO()
    writer = DictWriter(output, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()

    for row in rows:
        writer.writerow({column: row.get(column, "") for column in columns})

    return output.getvalue()
