import argparse
from pathlib import Path

import pandas as pd


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Audit infection-risk predictions and export FN/FP slices."
    )
    parser.add_argument("--predictions_csv", required=True, type=Path)
    parser.add_argument("--master_csv", required=True, type=Path)
    parser.add_argument("--output_dir", required=True, type=Path)
    args = parser.parse_args()

    preds = pd.read_csv(args.predictions_csv)
    master = pd.read_csv(args.master_csv)
    master["image_id"] = master["image_id"].astype(str)
    preds["image_id"] = preds["image_id"].astype(str)

    merged = preds.merge(
        master[
            [
                "image_id",
                "image_path",
                "source_split",
                "infection_risk",
                "infection_risk_binary",
                "urgency_level",
                "body_location",
                "healing_status",
                "erythema",
                "edema",
                "exudate_type",
            ]
        ],
        on="image_id",
        how="left",
    )

    fn_elevated = merged[(merged["y_true"] == "elevated") & (merged["y_pred"] == "low")].copy()
    fp_elevated = merged[(merged["y_true"] == "low") & (merged["y_pred"] == "elevated")].copy()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    merged_path = args.output_dir / "infection_risk_test_audit_merged.csv"
    fn_path = args.output_dir / "infection_risk_test_fn_elevated.csv"
    fp_path = args.output_dir / "infection_risk_test_fp_elevated.csv"

    merged.to_csv(merged_path, index=False)
    fn_elevated.to_csv(fn_path, index=False)
    fp_elevated.to_csv(fp_path, index=False)

    print(f"Saved merged audit table: {merged_path}")
    print(f"Saved elevated false negatives: {fn_path} ({len(fn_elevated)} rows)")
    print(f"Saved elevated false positives: {fp_path} ({len(fp_elevated)} rows)")


if __name__ == "__main__":
    main()
