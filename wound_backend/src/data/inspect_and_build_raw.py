import argparse
import base64
import io
import shutil
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
from datasets import load_dataset
from PIL import Image


FIELD_TO_COLUMN = {
    "Wound Location": "body_location",
    "Healing Status": "healing_status",
    "Closure Method": "closure_method",
    "Exudate Type": "exudate_type",
    "Erythema": "erythema",
    "Edema": "edema",
    "Infection Risk Assessment": "infection_risk",
    "Urgency Level": "urgency_level",
}

RAW_COLUMNS = [
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
    "source_split",
]


def _normalize_answer(answer: object) -> Optional[str]:
    if answer is None:
        return None
    text = str(answer).strip()
    return text if text else None


def _image_id_from_name(image_name: str) -> str:
    stem = Path(image_name).stem
    return stem


def _save_image_once(image_obj: object, image_name: str, images_dir: Path, saved: set) -> Path:
    output_path = images_dir / image_name
    if image_name in saved:
        return output_path
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if isinstance(image_obj, Image.Image):
        image_obj.save(output_path)
    elif isinstance(image_obj, str):
        source_path = Path(image_obj)
        if source_path.exists():
            shutil.copy2(source_path, output_path)
        else:
            # Some dataset variants store image bytes as a base64 string.
            # Detect and decode this pathless format.
            try:
                image_bytes = base64.b64decode(image_obj, validate=False)
                if image_bytes:
                    image = Image.open(io.BytesIO(image_bytes))
                    image.save(output_path)
                else:
                    raise ValueError("Decoded base64 image bytes are empty.")
            except Exception as exc:
                raise FileNotFoundError(
                    "Image string was neither an existing file path nor a decodable base64 image."
                ) from exc
    else:
        raise TypeError(
            f"Unsupported image object type: {type(image_obj)}. "
            "Expected PIL.Image.Image or string file path."
        )

    saved.add(image_name)
    return output_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build one-row-per-image labels_raw.csv from SurgWound QA-format dataset."
    )
    parser.add_argument("--dataset_name", default="xuxuxuxuxu/SurgWound")
    parser.add_argument("--output_csv", type=Path, default=Path("wound_backend/data/raw/labels_raw.csv"))
    parser.add_argument("--images_dir", type=Path, default=Path("wound_backend/data/raw/images"))
    parser.add_argument(
        "--field_report",
        type=Path,
        default=Path("wound_backend/data/metadata/surgwound_fields.txt"),
    )
    args = parser.parse_args()

    dataset = load_dataset(args.dataset_name)

    discovered_fields = set()
    records_by_image: Dict[str, Dict[str, Optional[str]]] = {}
    saved_images = set()

    for split_name in dataset.keys():
        for sample in dataset[split_name]:
            image_name = str(sample["image_name"])
            field_name = str(sample["field"])
            answer_value = _normalize_answer(sample.get("answer"))
            discovered_fields.add(field_name)

            _save_image_once(
                image_obj=sample["image"],
                image_name=image_name,
                images_dir=args.images_dir,
                saved=saved_images,
            )

            if image_name not in records_by_image:
                records_by_image[image_name] = {column: None for column in RAW_COLUMNS}
                records_by_image[image_name]["image_id"] = _image_id_from_name(image_name)
                records_by_image[image_name]["image_path"] = str(Path("images") / image_name).replace("\\", "/")
                records_by_image[image_name]["source_split"] = split_name

            target_column = FIELD_TO_COLUMN.get(field_name)
            if target_column is None:
                continue

            existing_value = records_by_image[image_name].get(target_column)
            if existing_value is None:
                records_by_image[image_name][target_column] = answer_value
            elif answer_value is not None and answer_value != existing_value:
                # Keep first non-null answer for v1 and warn by collecting mismatch metadata later if needed.
                pass

    rows: List[Dict[str, Optional[str]]] = []
    for image_name in sorted(records_by_image.keys()):
        row = records_by_image[image_name]
        rows.append({column: row.get(column) for column in RAW_COLUMNS})

    output_df = pd.DataFrame(rows, columns=RAW_COLUMNS)
    args.output_csv.parent.mkdir(parents=True, exist_ok=True)
    output_df.to_csv(args.output_csv, index=False)

    args.field_report.parent.mkdir(parents=True, exist_ok=True)
    with args.field_report.open("w", encoding="utf-8") as report:
        for field_name in sorted(discovered_fields):
            report.write(f"{field_name}\n")

    print(f"Saved {len(output_df)} grouped rows to {args.output_csv}")
    print(f"Saved {len(saved_images)} unique images to {args.images_dir}")
    print(f"Saved field list to {args.field_report}")


if __name__ == "__main__":
    main()
