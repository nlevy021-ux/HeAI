import argparse
import json
from pathlib import Path

import pandas as pd


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export infection-risk label rubric summary and mapping metadata."
    )
    parser.add_argument("--master_csv", required=True, type=Path)
    parser.add_argument("--output_dir", required=True, type=Path)
    args = parser.parse_args()

    df = pd.read_csv(args.master_csv)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    raw_counts = (
        df["infection_risk"]
        .value_counts(dropna=False)
        .rename_axis("infection_risk")
        .reset_index(name="count")
    )
    binary_counts = (
        df["infection_risk_binary"]
        .value_counts(dropna=False)
        .rename_axis("infection_risk_binary")
        .reset_index(name="count")
    )

    raw_counts_path = args.output_dir / "infection_risk_raw_value_counts.csv"
    binary_counts_path = args.output_dir / "infection_risk_binary_value_counts.csv"
    rubric_json_path = args.output_dir / "infection_risk_label_rubric.json"

    raw_counts.to_csv(raw_counts_path, index=False)
    binary_counts.to_csv(binary_counts_path, index=False)

    rubric = {
        "source_column": "infection_risk",
        "target_column": "infection_risk_binary",
        "mapping_policy": {
            "low": "low",
            "normal": "low",
            "none": "low",
            "medium": "elevated",
            "moderate": "elevated",
            "high": "elevated",
            "very_high": "elevated",
        },
        "notes": [
            "Binary collapse is product-facing triage simplification for Sprint 1.",
            "Review this mapping with clinical rubric owners before production use.",
            "Rows with unknown or unmapped infection_risk, invalid healing_status, or missing core fields are excluded from the master table.",
        ],
        "raw_value_counts_file": str(raw_counts_path).replace("\\", "/"),
        "binary_value_counts_file": str(binary_counts_path).replace("\\", "/"),
    }
    with rubric_json_path.open("w", encoding="utf-8") as f:
        json.dump(rubric, f, indent=2)

    print(f"Saved raw counts: {raw_counts_path}")
    print(f"Saved binary counts: {binary_counts_path}")
    print(f"Saved rubric metadata: {rubric_json_path}")


if __name__ == "__main__":
    main()
