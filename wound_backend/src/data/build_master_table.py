import argparse
from pathlib import Path
from typing import Dict, List

import pandas as pd


REQUIRED_COLUMNS: List[str] = [
    "image_id",
    "image_path",
    "body_location",
    "healing_status",
    "closure_method",
    "exudate_type",
    "erythema",
    "edema",
    "infection_risk",
    "urgency_level",
]

STRING_COLUMNS: List[str] = [
    "body_location",
    "healing_status",
    "closure_method",
    "exudate_type",
    "erythema",
    "edema",
    "infection_risk",
    "urgency_level",
]

UNCERTAIN_VALUES = {
    "unknown",
    "uncertain",
    "unable_to_assess",
    "cannot_assess",
    "indeterminate",
    "n/a",
    "na",
    "",
}

LABEL_NORMALIZATION: Dict[str, Dict[str, str]] = {
    "infection_risk": {
        "high": "elevated",
        "moderate": "elevated",
        "medium": "elevated",
        "very_high": "elevated",
        "none": "low",
        "normal": "low",
    },
    "urgency_level": {
        "home_care": "home_care",
        "urgent": "needs_evaluation",
        "follow_up_needed": "needs_evaluation",
        "seek_medical_attention": "needs_evaluation",
        "clinic_visit": "needs_evaluation",
        "doctor_review": "needs_evaluation",
        "needs_evaluation": "needs_evaluation",
        "observe": "home_care",
        "self_care": "home_care",
        "routine": "home_care",
    },
}


def _canonicalize_string(value: object) -> str:
    if pd.isna(value):
        return ""
    text = str(value).strip().lower()
    text = text.replace("-", "_").replace(" ", "_")
    while "__" in text:
        text = text.replace("__", "_")
    return text


def _extract_category_prefix(value: str) -> str:
    """Strip verbose SurgWound suffixes like '_(green):_manage_with_...' to keep only the category."""
    if "_(" in value:
        value = value.split("_(")[0]
    elif ":_" in value:
        value = value.split(":_")[0]
    return value


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    for column in STRING_COLUMNS:
        df[column] = df[column].apply(_canonicalize_string)

    # SurgWound urgency values have verbose suffixes that must be stripped first.
    df["urgency_level"] = df["urgency_level"].apply(_extract_category_prefix)

    for column in STRING_COLUMNS:
        mapping = LABEL_NORMALIZATION.get(column, {})
        if mapping:
            df[column] = df[column].replace(mapping)
    return df


def _derive_binary_labels(df: pd.DataFrame) -> pd.DataFrame:
    risk_map = {
        "low": "low",
        "elevated": "elevated",
    }
    urgency_map = {
        "home_care": "home_care",
        "needs_evaluation": "needs_evaluation",
    }
    df["infection_risk_binary"] = df["infection_risk"].map(risk_map)
    df["urgency_binary"] = df["urgency_level"].map(urgency_map)
    return df


def _flag_uncertain(df: pd.DataFrame) -> pd.Series:
    uncertain_mask = pd.Series(False, index=df.index)
    for column in STRING_COLUMNS:
        uncertain_mask = uncertain_mask | df[column].isin(UNCERTAIN_VALUES)
    return uncertain_mask


def main() -> None:
    parser = argparse.ArgumentParser(description="Build cleaned master labels table.")
    parser.add_argument("--input_csv", required=True, type=Path)
    parser.add_argument("--output_csv", required=True, type=Path)
    parser.add_argument("--excluded_csv", required=True, type=Path)
    args = parser.parse_args()

    df = pd.read_csv(args.input_csv)

    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Input CSV missing required columns: {missing_cols}")

    # Generate case_id from image_id when no patient-level identifier exists.
    if "case_id" not in df.columns:
        df["case_id"] = df["image_id"].astype(str)
        print("No case_id column found — using image_id as synthetic group key.")

    # Make image_path relative to the project root so training can open files directly.
    input_dir = args.input_csv.parent
    df["image_path"] = df["image_path"].apply(
        lambda p: str(input_dir / p).replace("\\", "/")
    )

    keep_cols = REQUIRED_COLUMNS + ["case_id"]
    if "source_split" in df.columns:
        keep_cols.append("source_split")
    df = df[keep_cols].copy()

    df = _normalize_columns(df)
    df = _derive_binary_labels(df)

    uncertain_mask = _flag_uncertain(df)
    unknown_binary_mask = df["infection_risk_binary"].isna() | df["urgency_binary"].isna()
    invalid_core_mask = df["image_path"].isna() | df["image_id"].isna()
    exclude_mask = uncertain_mask | unknown_binary_mask | invalid_core_mask

    excluded = df[exclude_mask].copy()
    cleaned = df[~exclude_mask].copy()

    args.output_csv.parent.mkdir(parents=True, exist_ok=True)
    args.excluded_csv.parent.mkdir(parents=True, exist_ok=True)
    cleaned.to_csv(args.output_csv, index=False)
    excluded.to_csv(args.excluded_csv, index=False)

    print(f"Saved cleaned rows: {len(cleaned)} -> {args.output_csv}")
    print(f"Saved excluded rows: {len(excluded)} -> {args.excluded_csv}")


if __name__ == "__main__":
    main()
