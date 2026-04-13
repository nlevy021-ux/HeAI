import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List

import torch
import yaml
from PIL import Image
from torchvision import transforms

# Allow sibling-package imports when run from the repo root.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.models.efficientnet_baseline import build_efficientnet_b1


def load_config(path: Path) -> Dict:
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def build_eval_transform(image_size: int) -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )


def predict_single_image(
    image_path: Path,
    checkpoint_path: Path,
    config_path: Path,
    top_k: int,
) -> Dict[str, object]:
    config = load_config(config_path)
    image_size = int(config["data"]["image_size"])
    transform = build_eval_transform(image_size)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(checkpoint_path, map_location=device)

    label_names: List[str] = checkpoint["label_names"]
    model, _ = build_efficientnet_b1(
        num_classes=len(label_names),
        pretrained=False,
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1).squeeze(0)

    top_k = min(top_k, len(label_names))
    top_probs, top_indices = torch.topk(probs, k=top_k)
    predictions = []
    for prob, idx in zip(top_probs.tolist(), top_indices.tolist()):
        predictions.append(
            {
                "label": label_names[idx],
                "probability": float(prob),
            }
        )

    return {
        "image_path": str(image_path),
        "task": checkpoint.get("task", "unknown"),
        "predicted_label": predictions[0]["label"],
        "predicted_probability": predictions[0]["probability"],
        "top_k_predictions": predictions,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run single-image inference for a trained baseline model.")
    parser.add_argument("--image_path", required=True, type=Path)
    parser.add_argument("--checkpoint", required=True, type=Path)
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--top_k", type=int, default=3)
    args = parser.parse_args()

    result = predict_single_image(
        image_path=args.image_path,
        checkpoint_path=args.checkpoint,
        config_path=args.config,
        top_k=args.top_k,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
