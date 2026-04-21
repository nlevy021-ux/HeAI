import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pandas as pd
import torch
import yaml
from PIL import Image
from sklearn.metrics import f1_score, precision_score, recall_score
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

from src.models.efficientnet_baseline import build_efficientnet_b1


class ImageDataset(Dataset):
    def __init__(self, df: pd.DataFrame, task: str, label_to_idx: Dict[str, int], transform):
        self.df = df.reset_index(drop=True).copy()
        self.task = task
        self.transform = transform
        self.label_to_idx = label_to_idx
        self.df = self.df[self.df[task].isin(self.label_to_idx)].copy()

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int):
        row = self.df.iloc[idx]
        image = Image.open(row["image_path"]).convert("RGB")
        image = self.transform(image)
        label = self.label_to_idx[row[self.task]]
        image_id = str(row["image_id"])
        return image, label, image_id


def load_config(config_path: Path) -> Dict:
    with config_path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def build_eval_transform(image_size: int):
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )


def evaluate_threshold(
    y_true_idx: List[int],
    elevated_probs: List[float],
    elevated_idx: int,
    threshold: float,
) -> Dict[str, float]:
    y_true = [1 if y == elevated_idx else 0 for y in y_true_idx]
    y_pred = [1 if p >= threshold else 0 for p in elevated_probs]
    return {
        "threshold": threshold,
        "precision_elevated": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall_elevated": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1_elevated": float(f1_score(y_true, y_pred, zero_division=0)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Tune infection-risk elevated threshold on validation split.")
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--split_manifest", required=True, type=Path)
    parser.add_argument("--checkpoint", required=True, type=Path)
    parser.add_argument("--task", default="infection_risk_binary")
    parser.add_argument("--target_recall", type=float, default=0.8)
    parser.add_argument("--output_json", required=True, type=Path)
    args = parser.parse_args()

    config = load_config(args.config)
    with args.split_manifest.open("r", encoding="utf-8") as f:
        manifest = json.load(f)
    val_df = pd.read_csv(manifest["paths"]["val"])

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(args.checkpoint, map_location=device)
    label_names: List[str] = checkpoint["label_names"]
    label_to_idx = {label: idx for idx, label in enumerate(label_names)}
    if "elevated" not in label_to_idx:
        raise ValueError("Checkpoint label names do not include 'elevated'.")
    elevated_idx = label_to_idx["elevated"]

    model, _ = build_efficientnet_b1(num_classes=len(label_names), pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    transform = build_eval_transform(int(config["data"]["image_size"]))
    dataset = ImageDataset(val_df, args.task, label_to_idx, transform)
    loader = DataLoader(dataset, batch_size=16, shuffle=False, num_workers=0)

    y_true_idx: List[int] = []
    elevated_probs: List[float] = []
    image_ids: List[str] = []
    with torch.no_grad():
        for images, labels, batch_ids in loader:
            images = images.to(device)
            logits = model(images)
            probs = torch.softmax(logits, dim=1)[:, elevated_idx]
            y_true_idx.extend(labels.tolist())
            elevated_probs.extend(probs.detach().cpu().tolist())
            image_ids.extend(batch_ids)

    rows = []
    for threshold_int in range(10, 91):
        threshold = threshold_int / 100.0
        rows.append(evaluate_threshold(y_true_idx, elevated_probs, elevated_idx, threshold))
    threshold_df = pd.DataFrame(rows)

    meets_target = threshold_df[threshold_df["recall_elevated"] >= args.target_recall]
    if not meets_target.empty:
        best = meets_target.sort_values(
            by=["f1_elevated", "precision_elevated", "threshold"],
            ascending=[False, False, False],
        ).iloc[0]
    else:
        best = threshold_df.sort_values(
            by=["recall_elevated", "f1_elevated"],
            ascending=[False, False],
        ).iloc[0]

    tuned_threshold = float(best["threshold"])
    uncertain_margin = 0.1
    uncertain_low = max(0.0, tuned_threshold - uncertain_margin)
    uncertain_high = min(1.0, tuned_threshold + uncertain_margin)

    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    result = {
        "task": args.task,
        "target_recall": args.target_recall,
        "selected_threshold": tuned_threshold,
        "selected_metrics": {
            "precision_elevated": float(best["precision_elevated"]),
            "recall_elevated": float(best["recall_elevated"]),
            "f1_elevated": float(best["f1_elevated"]),
        },
        "uncertain_band": {
            "low": uncertain_low,
            "high": uncertain_high,
            "rule": "if elevated_probability is within [low, high], mark uncertain",
        },
        "scan_table": threshold_df.to_dict(orient="records"),
    }
    with args.output_json.open("w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    threshold_scan_path = args.output_json.with_name("infection_risk_threshold_scan.csv")
    threshold_df.to_csv(threshold_scan_path, index=False)

    probs_df = pd.DataFrame(
        {
            "image_id": image_ids,
            "y_true_idx": y_true_idx,
            "elevated_probability": elevated_probs,
        }
    )
    val_probs_path = args.output_json.with_name("infection_risk_val_probabilities.csv")
    probs_df.to_csv(val_probs_path, index=False)

    print(f"Saved threshold tuning json: {args.output_json}")
    print(f"Saved threshold scan table: {threshold_scan_path}")
    print(f"Saved val probabilities: {val_probs_path}")


if __name__ == "__main__":
    main()
