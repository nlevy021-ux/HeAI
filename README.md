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

### What teammates do

1. **Clone** this repo: `git clone https://github.com/nlevy021-ux/HeAI.git` then `cd HeAI`.
2. **Weights:** From the [release](https://github.com/nlevy021-ux/HeAI/releases/tag/v1.0.0-baseline), download both `.pt` files into `wound_backend/outputs/checkpoints/` (create the folder if needed).
3. **Dependencies:** From the repo root:

   ```bash
   python -m pip install -r requirements.txt
   ```

   For GPU PyTorch, install `torch` / `torchvision` from [pytorch.org](https://pytorch.org/) instead of relying on the default CPU wheels.

4. **Run inference** (commands below).

### Run inference on one image

From the repo root:

```bash
python wound_backend/src/inference/predict_image.py --image_path path/to/image.jpg --checkpoint wound_backend/outputs/checkpoints/healing_status_efficientnet_b1_best.pt --config wound_backend/configs/baseline/healing_status.yaml --top_k 3
```

```bash
python wound_backend/src/inference/predict_image.py --image_path path/to/image.jpg --checkpoint wound_backend/outputs/checkpoints/infection_risk_binary_efficientnet_b1_best.pt --config wound_backend/configs/baseline/infection_risk_binary.yaml --top_k 3
```

**Scope:** Models were trained on the SurgWound dataset (surgical wound imagery). Performance on other cameras or wound types is not guaranteed. Not for clinical or diagnostic use.
