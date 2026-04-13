# HeAI Wound Backend

Backend-first wound assessment pipeline prototype.

## Included
- Data conversion and cleaning scripts
- Frozen split generation
- EfficientNet-B1 training for healing status and infection-risk binary
- Single-image inference script

## Main project folder
- `wound_backend/`

## Model weights (for your team)

Checkpoints are **not** stored in git (too large). Download them from the release:

- **Release:** [v1.0.0-baseline](https://github.com/nlevy021-ux/HeAI/releases/tag/v1.0.0-baseline)

Assets:

- `healing_status_efficientnet_b1_best.pt`
- `infection_risk_binary_efficientnet_b1_best.pt`

### Setup after clone

1. Clone this repo.
2. Create the checkpoints folder and copy both `.pt` files into it:

   `wound_backend/outputs/checkpoints/`

3. Install dependencies (example; match your Python + CUDA if you use GPU):

   ```bash
   pip install torch torchvision pillow pyyaml
   ```

### Run inference on one image

From the repo root:

```bash
python wound_backend/src/inference/predict_image.py --image_path path/to/image.jpg --checkpoint wound_backend/outputs/checkpoints/healing_status_efficientnet_b1_best.pt --config wound_backend/configs/baseline/healing_status.yaml --top_k 3
```

```bash
python wound_backend/src/inference/predict_image.py --image_path path/to/image.jpg --checkpoint wound_backend/outputs/checkpoints/infection_risk_binary_efficientnet_b1_best.pt --config wound_backend/configs/baseline/infection_risk_binary.yaml --top_k 3
```

**Scope:** Models were trained on the SurgWound dataset (surgical wound imagery). Performance on other cameras or wound types is not guaranteed. Not for clinical or diagnostic use.
