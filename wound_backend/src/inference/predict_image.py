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
    elevated_threshold: float | None,
    uncertain_low: float | None,
    uncertain_high: float | None,
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

    probabilities = {label_names[idx]: float(prob) for idx, prob in enumerate(probs.tolist())}
    predicted_label = predictions[0]["label"]
    predicted_probability = predictions[0]["probability"]

    result: Dict[str, object] = {
        "image_path": str(image_path),
        "task": checkpoint.get("task", "unknown"),
        "predicted_label": predicted_label,
        "predicted_probability": predicted_probability,
        "probabilities": probabilities,
        "top_k_predictions": predictions,
    }

    if checkpoint.get("task") == "infection_risk_binary":
        effective_threshold = elevated_threshold if elevated_threshold is not None else 0.5
        elevated_prob = probabilities.get("elevated", 0.0)
        threshold_label = "elevated" if elevated_prob >= effective_threshold else "low"

        uncertain = False
        if uncertain_low is not None and uncertain_high is not None:
            uncertain = uncertain_low <= elevated_prob <= uncertain_high

        result["decision"] = {
            "threshold_label": threshold_label,
            "elevated_threshold": effective_threshold,
            "elevated_probability": elevated_prob,
            "uncertain": uncertain,
            "uncertain_low": uncertain_low,
            "uncertain_high": uncertain_high,
        }

    return result


def load_threshold_bundle(path: Path) -> tuple[float | None, float | None, float | None]:
    with path.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    selected_threshold = payload.get("selected_threshold")
    band = payload.get("uncertain_band", {})
    return selected_threshold, band.get("low"), band.get("high")


def default_infection_risk_threshold_json() -> Path:
    """Repo layout: wound_backend/src/inference/predict_image.py -> wound_backend root is parents[2]."""
    wound_backend_root = Path(__file__).resolve().parents[2]
    return wound_backend_root / "outputs" / "metrics" / "infection_risk_threshold_tuning.json"


def main() -> None:
    parser = argparse.ArgumentParser(description="Run single-image inference for a trained baseline model.")
    parser.add_argument("--image_path", required=True, type=Path)
    parser.add_argument("--checkpoint", required=True, type=Path)
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--top_k", type=int, default=3)
    parser.add_argument("--elevated_threshold", type=float, default=None)
    parser.add_argument("--uncertain_low", type=float, default=None)
    parser.add_argument("--uncertain_high", type=float, default=None)
    parser.add_argument(
        "--threshold_json",
        type=Path,
        default=None,
        help=(
            "Optional threshold tuning JSON from tune_elevated_threshold.py. "
            "If omitted and config is infection_risk_binary, tries "
            "wound_backend/outputs/metrics/infection_risk_threshold_tuning.json automatically."
        ),
    )
    args = parser.parse_args()

    elevated_threshold = args.elevated_threshold
    uncertain_low = args.uncertain_low
    uncertain_high = args.uncertain_high
    threshold_source = "explicit_cli"

    if args.threshold_json is not None:
        elevated_threshold, uncertain_low, uncertain_high = load_threshold_bundle(args.threshold_json)
        threshold_source = "threshold_json"
    elif (
        args.elevated_threshold is None
        and args.uncertain_low is None
        and args.uncertain_high is None
        and "infection_risk_binary" in args.config.name.lower()
    ):
        auto_path = default_infection_risk_threshold_json()
        if auto_path.is_file():
            elevated_threshold, uncertain_low, uncertain_high = load_threshold_bundle(auto_path)
            threshold_source = f"auto:{auto_path.as_posix()}"
        else:
            threshold_source = "default_argmax_0.5_no_uncertain_band"

    result = predict_single_image(
        image_path=args.image_path,
        checkpoint_path=args.checkpoint,
        config_path=args.config,
        top_k=args.top_k,
        elevated_threshold=elevated_threshold,
        uncertain_low=uncertain_low,
        uncertain_high=uncertain_high,
    )
    if result.get("task") == "infection_risk_binary" and isinstance(result.get("decision"), dict):
        result["decision"]["threshold_source"] = threshold_source
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
