from __future__ import annotations

from collections import defaultdict
from math import sqrt
from typing import Any

from .parsing import normalize_number

DEFAULT_BOUNDARIES = [
    {"grade": "A", "min": 85.0},
    {"grade": "B", "min": 75.0},
    {"grade": "C", "min": 65.0},
    {"grade": "D", "min": 50.0},
    {"grade": "F", "min": 0.0},
]


def round_number(value: float) -> float:
    return round(float(value), 2)


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def median(values: list[float]) -> float:
    if not values:
        return 0.0

    ordered = sorted(values)
    midpoint = len(ordered) // 2

    if len(ordered) % 2 == 0:
        return (ordered[midpoint - 1] + ordered[midpoint]) / 2

    return ordered[midpoint]


def standard_deviation(values: list[float]) -> float:
    if not values:
        return 0.0

    average = mean(values)
    variance = mean([(value - average) ** 2 for value in values])
    return sqrt(variance)


def quartiles(values: list[float]) -> dict[str, float]:
    if not values:
        return {"min": 0.0, "q1": 0.0, "median": 0.0, "q3": 0.0, "max": 0.0}

    ordered = sorted(values)
    midpoint = len(ordered) // 2
    lower = ordered[:midpoint]
    upper = ordered[midpoint:] if len(ordered) % 2 == 0 else ordered[midpoint + 1 :]

    return {
        "min": round_number(ordered[0]),
        "q1": round_number(median(lower) if lower else ordered[0]),
        "median": round_number(median(ordered)),
        "q3": round_number(median(upper) if upper else ordered[-1]),
        "max": round_number(ordered[-1]),
    }


def histogram(values: list[float], bucket_count: int = 8) -> list[dict[str, float | int | str]]:
    if not values:
        return []

    minimum = min(values)
    maximum = max(values)

    if minimum == maximum:
        return [
            {
                "label": f"{minimum:.1f} - {maximum:.1f}",
                "start": round_number(minimum),
                "end": round_number(maximum),
                "count": len(values),
            },
        ]

    value_range = maximum - minimum
    bucket_size = value_range / bucket_count

    buckets: list[dict[str, float | int | str]] = []
    for index in range(bucket_count):
        start = minimum + index * bucket_size
        end = maximum if index == bucket_count - 1 else start + bucket_size
        buckets.append(
            {
                "label": f"{start:.1f} - {end:.1f}",
                "start": round_number(start),
                "end": round_number(end),
                "count": 0,
            },
        )

    for value in values:
        bucket_index = min(int((value - minimum) / bucket_size), bucket_count - 1)
        buckets[bucket_index]["count"] += 1

    return buckets


def resolve_boundaries(mode: str, weighted_scores: list[float], grading: dict[str, Any]) -> list[dict[str, float | str]]:
    if mode == "custom":
        return sorted(
            [{"grade": rule["grade"], "min": float(rule.get("min", 0.0))} for rule in grading["boundaries"]],
            key=lambda rule: rule["min"],
            reverse=True,
        )

    if mode == "statistical":
        average = mean(weighted_scores)
        deviation = standard_deviation(weighted_scores)
        boundaries = [
            {
                "grade": rule["grade"],
                "min": average + deviation * float(rule.get("k", 0.0)),
            }
            for rule in grading["rules"]
        ]
        return sorted(boundaries, key=lambda rule: rule["min"], reverse=True)

    return [boundary.copy() for boundary in DEFAULT_BOUNDARIES]


def assign_grade(score: float, boundaries: list[dict[str, float | str]]) -> str:
    for boundary in boundaries:
        if score >= float(boundary["min"]):
            return str(boundary["grade"])

    return str(boundaries[-1]["grade"]) if boundaries else "N/A"


def sanitize_weights(weights: dict[str, Any], components: list[str]) -> list[dict[str, float | str]]:
    return [{"name": component, "weight": float(weights.get(component, 0.0))} for component in components]


def validate_weights(weight_entries: list[dict[str, float | str]]) -> None:
    if not weight_entries:
        raise ValueError("No numeric score columns were detected in the uploaded dataset.")

    total = sum(float(entry["weight"]) for entry in weight_entries)
    if abs(total - 100.0) > 0.001:
        raise ValueError("Component weights must total exactly 100%.")

    if any(float(entry["weight"]) < 0 for entry in weight_entries):
        raise ValueError("Component weights cannot be negative.")


def compute_component_score(row: dict[str, Any], component: str) -> float | None:
    return normalize_number(row.get(component))


def compute_weighted_score(row: dict[str, Any], weight_entries: list[dict[str, float | str]]) -> tuple[float, list[str]]:
    total = 0.0
    missing_fields: list[str] = []

    for entry in weight_entries:
        component = str(entry["name"])
        weight = float(entry["weight"])
        numeric_value = compute_component_score(row, component)
        if numeric_value is None:
            missing_fields.append(component)
            continue

        total += numeric_value * (weight / 100.0)

    return round_number(total), missing_fields


def aggregate_groups(
    rows: list[dict[str, Any]],
    group_column: str,
    weight_entries: list[dict[str, float | str]],
) -> dict[str, dict[str, Any]]:
    grouped_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for row in rows:
        group_id = str(row.get(group_column, "")).strip()
        if group_id:
            grouped_rows[group_id].append(row)

    summaries: dict[str, dict[str, Any]] = {}
    for group_id, members in grouped_rows.items():
        component_averages: dict[str, float | None] = {}
        for entry in weight_entries:
            component = str(entry["name"])
            values = [
                score
                for score in (compute_component_score(member, component) for member in members)
                if score is not None
            ]
            component_averages[component] = round_number(mean(values)) if values else None

        weighted_score, _ = compute_weighted_score(component_averages, weight_entries)
        summaries[group_id] = {
            "groupId": group_id,
            "members": members,
            "componentAverages": component_averages,
            "weightedScore": weighted_score,
        }

    return summaries


def apply_group_strategy(
    dataset: dict[str, Any],
    config: dict[str, Any],
    weight_entries: list[dict[str, float | str]],
) -> list[dict[str, Any]]:
    rows = dataset["rows"]
    group_column = dataset.get("groupColumn")

    if dataset.get("detectedType") != "group" or not group_column:
        processed_rows = []
        for row in rows:
            weighted_score, missing_fields = compute_weighted_score(row, weight_entries)
            processed_rows.append(
                {
                    **row,
                    "groupScore": None,
                    "weightedScore": weighted_score,
                    "missingFields": missing_fields,
                    "groupSize": 1,
                },
            )
        return processed_rows

    group_summaries = aggregate_groups(rows, group_column, weight_entries)
    processed_rows: list[dict[str, Any]] = []

    for row in rows:
        group_id = str(row.get(group_column, "")).strip()
        individual_score, missing_fields = compute_weighted_score(row, weight_entries)
        group_summary = group_summaries.get(group_id) if group_id else None
        weighted_score = (
            group_summary["weightedScore"]
            if config.get("groupStrategy") == "shared" and group_summary
            else individual_score
        )

        processed_rows.append(
            {
                **row,
                "groupScore": group_summary["weightedScore"] if group_summary else None,
                "weightedScore": weighted_score,
                "missingFields": missing_fields,
                "groupSize": len(group_summary["members"]) if group_summary else 1,
            },
        )

    return processed_rows


def build_grade_distribution(
    rows: list[dict[str, Any]],
    boundaries: list[dict[str, float | str]],
) -> list[dict[str, int | str]]:
    counts = {str(boundary["grade"]): 0 for boundary in boundaries}

    for row in rows:
        counts[row["finalGrade"]] = counts.get(row["finalGrade"], 0) + 1

    return [{"grade": grade, "count": count} for grade, count in counts.items()]


def grade_dataset(dataset: dict[str, Any], config: dict[str, Any]) -> dict[str, Any]:
    weight_entries = sanitize_weights(config["weights"], config["components"])
    validate_weights(weight_entries)

    scored_rows = apply_group_strategy(dataset, config, weight_entries)
    weighted_scores = [float(row["weightedScore"]) for row in scored_rows]
    boundaries = resolve_boundaries(config["mode"], weighted_scores, config["grading"])

    graded_rows = [
        {
            **row,
            "finalGrade": assign_grade(float(row["weightedScore"]), boundaries),
        }
        for row in scored_rows
    ]

    stats_quartiles = quartiles(weighted_scores)
    statistics = {
        "mean": round_number(mean(weighted_scores)),
        "median": round_number(median(weighted_scores)),
        "standardDeviation": round_number(standard_deviation(weighted_scores)),
        "quartiles": stats_quartiles,
    }

    return {
        "boundaries": [
            {"grade": str(boundary["grade"]), "min": round_number(float(boundary["min"]))}
            for boundary in boundaries
        ],
        "statistics": statistics,
        "analytics": {
            "histogram": histogram(weighted_scores),
            "gradeDistribution": build_grade_distribution(graded_rows, boundaries),
            "boxPlot": stats_quartiles,
        },
        "rows": graded_rows,
    }
