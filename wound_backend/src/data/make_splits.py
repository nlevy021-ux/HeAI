import argparse
import json
from pathlib import Path
from typing import Dict, Tuple

import pandas as pd
from sklearn.model_selection import GroupShuffleSplit


def _split_groups(
    df: pd.DataFrame,
    group_col: str,
    seed: int,
    train_size: float,
    val_size: float,
    test_size: float,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    if round(train_size + val_size + test_size, 6) != 1.0:
        raise ValueError("train/val/test sizes must sum to 1.0")

    splitter_1 = GroupShuffleSplit(n_splits=1, train_size=train_size, random_state=seed)
    train_idx, temp_idx = next(splitter_1.split(df, groups=df[group_col]))
    train_df = df.iloc[train_idx].copy()
    temp_df = df.iloc[temp_idx].copy()

    temp_total = val_size + test_size
    val_fraction_of_temp = val_size / temp_total
    splitter_2 = GroupShuffleSplit(
        n_splits=1,
        train_size=val_fraction_of_temp,
        random_state=seed + 1,
    )
    val_idx, test_idx = next(splitter_2.split(temp_df, groups=temp_df[group_col]))
    val_df = temp_df.iloc[val_idx].copy()
    test_df = temp_df.iloc[test_idx].copy()
    return train_df, val_df, test_df


def _label_distribution(df: pd.DataFrame, label_col: str) -> Dict[str, float]:
    counts = df[label_col].value_counts(normalize=True).to_dict()
    return {str(k): float(v) for k, v in counts.items()}


def main() -> None:
    parser = argparse.ArgumentParser(description="Create deterministic group-aware frozen split.")
    parser.add_argument("--input_csv", required=True, type=Path)
    parser.add_argument("--output_dir", required=True, type=Path)
    parser.add_argument("--split_name", default="split_v2")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--train_size", type=float, default=0.7)
    parser.add_argument("--val_size", type=float, default=0.15)
    parser.add_argument("--test_size", type=float, default=0.15)
    parser.add_argument("--group_col", default="image_id")
    parser.add_argument("--stratify_col", default="infection_risk_binary")
    args = parser.parse_args()

    df = pd.read_csv(args.input_csv)
    if args.group_col not in df.columns:
        raise ValueError(f"Missing group column: {args.group_col}")

    train_df, val_df, test_df = _split_groups(
        df=df,
        group_col=args.group_col,
        seed=args.seed,
        train_size=args.train_size,
        val_size=args.val_size,
        test_size=args.test_size,
    )

    args.output_dir.mkdir(parents=True, exist_ok=True)
    train_path = args.output_dir / f"{args.split_name}_train.csv"
    val_path = args.output_dir / f"{args.split_name}_val.csv"
    test_path = args.output_dir / f"{args.split_name}_test.csv"
    manifest_path = args.output_dir / f"{args.split_name}_manifest.json"

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    manifest = {
        "split_name": args.split_name,
        "seed": args.seed,
        "group_col": args.group_col,
        "stratify_col": args.stratify_col,
        "ratios": {
            "train": args.train_size,
            "val": args.val_size,
            "test": args.test_size,
        },
        "paths": {
            "train": train_path.as_posix(),
            "val": val_path.as_posix(),
            "test": test_path.as_posix(),
        },
        "row_counts": {
            "train": len(train_df),
            "val": len(val_df),
            "test": len(test_df),
        },
        "group_counts": {
            "train": int(train_df[args.group_col].nunique()),
            "val": int(val_df[args.group_col].nunique()),
            "test": int(test_df[args.group_col].nunique()),
        },
        "label_distribution": {
            "train": _label_distribution(train_df, args.stratify_col)
            if args.stratify_col in train_df.columns
            else {},
            "val": _label_distribution(val_df, args.stratify_col)
            if args.stratify_col in val_df.columns
            else {},
            "test": _label_distribution(test_df, args.stratify_col)
            if args.stratify_col in test_df.columns
            else {},
        },
        "frozen": True,
    }
    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Saved split manifest to {manifest_path}")


if __name__ == "__main__":
    main()
