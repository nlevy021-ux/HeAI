# Wound Backend (Sprint 1)

Backend-first wound assessment pipeline starter for Sprint 1.

## Scope in this milestone

- Build a cleaned master label table.
- Create a frozen split (`split_v1`) with group-aware splitting.
- Train an image-only EfficientNet-B1 baseline for:
  - `healing_status`
  - `infection_risk_binary`
- Evaluate with macro-F1, weighted-F1, per-class metrics, confusion matrix, and elevated-class recall.

## Directory layout

- `data/raw/`: source images and raw labels
- `data/processed/`: cleaned tabular labels
- `data/splits/`: frozen train/val/test split CSVs and split manifest
- `data/metadata/`: audit artifacts (for example uncertain-label exclusions)
- `configs/baseline/`: baseline YAML configs per task
- `src/data/`: data table build and split scripts
- `src/models/`: model definitions
- `src/training/`: training entrypoints
- `src/evaluation/`: evaluation logic
- `outputs/checkpoints/`: model checkpoints
- `outputs/logs/`: training logs
- `outputs/metrics/`: metrics JSON files
- `outputs/predictions/`: prediction CSVs

## Expected master table columns

`image_id,image_path,body_location,healing_status,closure_method,exudate_type,erythema,edema,infection_risk,urgency_level,case_id`

Derived columns added by build script:

- `infection_risk_binary`
- `urgency_binary`

## Example workflow

1. Build cleaned table:

```bash
python src/data/build_master_table.py ^
  --input_csv data/raw/raw_labels.csv ^
  --output_csv data/processed/master_labels.csv ^
  --excluded_csv data/metadata/excluded_uncertain_labels.csv
```

2. Generate frozen split:

```bash
python src/data/make_splits.py ^
  --input_csv data/processed/master_labels.csv ^
  --output_dir data/splits ^
  --split_name split_v1
```

3. Train healing status:

```bash
python src/training/train_classifier.py ^
  --config configs/baseline/healing_status.yaml ^
  --split_manifest data/splits/split_v1_manifest.json ^
  --task healing_status ^
  --output_dir outputs
```

4. Train infection risk binary:

```bash
python src/training/train_classifier.py ^
  --config configs/baseline/infection_risk_binary.yaml ^
  --split_manifest data/splits/split_v1_manifest.json ^
  --task infection_risk_binary ^
  --output_dir outputs
```
