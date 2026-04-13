import argparse
import json
import random
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

# Allow sibling-package imports when run from the repo root.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import numpy as np
import pandas as pd
import torch
import yaml
from PIL import Image
from torch import nn
from torch.optim import AdamW
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

from src.evaluation.evaluate_classification import evaluate_predictions
from src.models.efficientnet_baseline import build_efficientnet_b1


@dataclass
class SplitData:
    train: pd.DataFrame
    val: pd.DataFrame
    test: pd.DataFrame


class WoundImageDataset(Dataset):
    def __init__(self, df: pd.DataFrame, task: str, transform: transforms.Compose) -> None:
        self.df = df.reset_index(drop=True)
        self.task = task
        self.transform = transform

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str]:
        row = self.df.iloc[idx]
        image = Image.open(row["image_path"]).convert("RGB")
        image = self.transform(image)
        label = int(row[f"{self.task}_id"])
        image_id = str(row["image_id"])
        return image, label, image_id


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def load_config(path: Path) -> Dict:
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_split_data(split_manifest_path: Path) -> SplitData:
    with split_manifest_path.open("r", encoding="utf-8") as f:
        manifest = json.load(f)
    return SplitData(
        train=pd.read_csv(manifest["paths"]["train"]),
        val=pd.read_csv(manifest["paths"]["val"]),
        test=pd.read_csv(manifest["paths"]["test"]),
    )


def prepare_labels(split_data: SplitData, task: str) -> Tuple[SplitData, List[str]]:
    label_names = sorted(split_data.train[task].dropna().unique().tolist())
    label_to_idx = {label: idx for idx, label in enumerate(label_names)}

    def _encode(df: pd.DataFrame) -> pd.DataFrame:
        out = df[df[task].isin(label_to_idx)].copy()
        out[f"{task}_id"] = out[task].map(label_to_idx).astype(int)
        return out

    return SplitData(_encode(split_data.train), _encode(split_data.val), _encode(split_data.test)), label_names


def build_transforms(config: Dict) -> Tuple[transforms.Compose, transforms.Compose]:
    image_size = int(config["data"]["image_size"])
    aug_cfg = config.get("augment", {})

    train_transform = transforms.Compose(
        [
            transforms.RandomResizedCrop(
                image_size,
                scale=(float(aug_cfg.get("random_resized_crop_scale_min", 0.8)), 1.0),
            ),
            transforms.RandomHorizontalFlip(p=float(aug_cfg.get("horizontal_flip_prob", 0.5))),
            transforms.ColorJitter(
                brightness=float(aug_cfg.get("color_jitter_brightness", 0.2)),
                contrast=float(aug_cfg.get("color_jitter_contrast", 0.2)),
                saturation=float(aug_cfg.get("color_jitter_saturation", 0.15)),
                hue=float(aug_cfg.get("color_jitter_hue", 0.02)),
            ),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    eval_transform = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    return train_transform, eval_transform


def build_class_weights(train_df: pd.DataFrame, task: str, num_classes: int) -> torch.Tensor:
    counts = train_df[f"{task}_id"].value_counts().to_dict()
    total = float(sum(counts.values()))
    weights = []
    for class_idx in range(num_classes):
        class_count = float(counts.get(class_idx, 1.0))
        weights.append(total / (num_classes * class_count))
    return torch.tensor(weights, dtype=torch.float32)


def run_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
    train: bool,
) -> Tuple[float, List[int], List[int], List[str]]:
    if train:
        model.train()
    else:
        model.eval()

    total_loss = 0.0
    y_true: List[int] = []
    y_pred: List[int] = []
    image_ids: List[str] = []

    for images, labels, batch_image_ids in loader:
        images = images.to(device)
        labels = labels.to(device)

        with torch.set_grad_enabled(train):
            logits = model(images)
            loss = criterion(logits, labels)
            if train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

        total_loss += float(loss.item()) * images.size(0)
        preds = torch.argmax(logits, dim=1)
        y_true.extend(labels.detach().cpu().tolist())
        y_pred.extend(preds.detach().cpu().tolist())
        image_ids.extend(list(batch_image_ids))

    mean_loss = total_loss / max(len(loader.dataset), 1)
    return mean_loss, y_true, y_pred, image_ids


def train(args: argparse.Namespace) -> None:
    config = load_config(args.config)
    seed = int(config["train"]["seed"])
    set_seed(seed)

    output_dir = Path(args.output_dir)
    checkpoints_dir = output_dir / "checkpoints"
    logs_dir = output_dir / "logs"
    metrics_dir = output_dir / "metrics"
    predictions_dir = output_dir / "predictions"
    for directory in [checkpoints_dir, logs_dir, metrics_dir, predictions_dir]:
        directory.mkdir(parents=True, exist_ok=True)

    split_data = load_split_data(args.split_manifest)
    split_data, label_names = prepare_labels(split_data, args.task)

    train_transform, eval_transform = build_transforms(config)
    train_ds = WoundImageDataset(split_data.train, args.task, train_transform)
    val_ds = WoundImageDataset(split_data.val, args.task, eval_transform)
    test_ds = WoundImageDataset(split_data.test, args.task, eval_transform)

    batch_size = int(config["data"]["batch_size"])
    num_workers = int(config["data"]["num_workers"])

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    model, model_name = build_efficientnet_b1(
        num_classes=len(label_names),
        pretrained=bool(config["model"].get("pretrained", True)),
    )
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    class_weights = None
    if bool(config["train"].get("use_class_weights", True)):
        class_weights = build_class_weights(split_data.train, args.task, len(label_names)).to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = AdamW(
        model.parameters(),
        lr=float(config["train"]["lr"]),
        weight_decay=float(config["train"]["weight_decay"]),
    )

    epochs = int(config["train"]["epochs"])
    patience = int(config["train"]["early_stopping_patience"])
    run_name = str(config.get("run_name", f"{args.task}_{model_name}"))
    checkpoint_path = checkpoints_dir / f"{run_name}_best.pt"
    log_path = logs_dir / f"{run_name}.jsonl"

    best_metric = -np.inf
    bad_epochs = 0

    for epoch in range(1, epochs + 1):
        train_loss, _, _, _ = run_epoch(model, train_loader, criterion, optimizer, device, train=True)
        val_loss, y_true_val, y_pred_val, _ = run_epoch(model, val_loader, criterion, optimizer, device, train=False)
        val_metrics = evaluate_predictions(
            y_true=y_true_val,
            y_pred=y_pred_val,
            label_names=label_names,
            elevated_label_name="elevated" if args.task == "infection_risk_binary" else None,
        )
        monitor_metric = float(val_metrics["macro_f1"])

        with log_path.open("a", encoding="utf-8") as f:
            f.write(
                json.dumps(
                    {
                        "epoch": epoch,
                        "train_loss": train_loss,
                        "val_loss": val_loss,
                        "val_macro_f1": monitor_metric,
                    }
                )
                + "\n"
            )

        if monitor_metric > best_metric:
            best_metric = monitor_metric
            bad_epochs = 0
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "label_names": label_names,
                    "task": args.task,
                    "config": config,
                },
                checkpoint_path,
            )
        else:
            bad_epochs += 1

        print(f"Epoch {epoch:03d} | train_loss={train_loss:.4f} val_macro_f1={monitor_metric:.4f}")
        if bad_epochs >= patience:
            print(f"Early stopping at epoch {epoch}")
            break

    ckpt = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(ckpt["model_state_dict"])

    _, y_true_val, y_pred_val, val_image_ids = run_epoch(model, val_loader, criterion, optimizer, device, train=False)
    _, y_true_test, y_pred_test, test_image_ids = run_epoch(model, test_loader, criterion, optimizer, device, train=False)

    val_metrics = evaluate_predictions(
        y_true=y_true_val,
        y_pred=y_pred_val,
        label_names=label_names,
        elevated_label_name="elevated" if args.task == "infection_risk_binary" else None,
    )
    test_metrics = evaluate_predictions(
        y_true=y_true_test,
        y_pred=y_pred_test,
        label_names=label_names,
        elevated_label_name="elevated" if args.task == "infection_risk_binary" else None,
    )

    val_metrics_path = metrics_dir / f"{run_name}_val_metrics.json"
    test_metrics_path = metrics_dir / f"{run_name}_test_metrics.json"
    with val_metrics_path.open("w", encoding="utf-8") as f:
        json.dump(val_metrics, f, indent=2)
    with test_metrics_path.open("w", encoding="utf-8") as f:
        json.dump(test_metrics, f, indent=2)

    idx_to_label = {idx: label for idx, label in enumerate(label_names)}
    predictions = pd.DataFrame(
        {
            "image_id": test_image_ids,
            "y_true": [idx_to_label[idx] for idx in y_true_test],
            "y_pred": [idx_to_label[idx] for idx in y_pred_test],
        }
    )
    predictions_path = predictions_dir / f"{run_name}_test_predictions.csv"
    predictions.to_csv(predictions_path, index=False)

    print(f"Saved checkpoint: {checkpoint_path}")
    print(f"Saved val metrics: {val_metrics_path}")
    print(f"Saved test metrics: {test_metrics_path}")
    print(f"Saved test predictions: {predictions_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train EfficientNet-B1 baseline classifier.")
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--split_manifest", required=True, type=Path)
    parser.add_argument("--task", required=True, choices=["healing_status", "infection_risk_binary"])
    parser.add_argument("--output_dir", required=True, type=Path)
    return parser.parse_args()


if __name__ == "__main__":
    train(parse_args())
