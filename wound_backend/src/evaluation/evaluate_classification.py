from typing import Dict, List, Optional

import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, f1_score, recall_score


def evaluate_predictions(
    y_true: List[int],
    y_pred: List[int],
    label_names: List[str],
    elevated_label_name: Optional[str] = None,
) -> Dict[str, object]:
    macro_f1 = float(f1_score(y_true, y_pred, average="macro"))
    weighted_f1 = float(f1_score(y_true, y_pred, average="weighted"))

    report = classification_report(
        y_true,
        y_pred,
        target_names=label_names,
        output_dict=True,
        zero_division=0,
    )
    cm = confusion_matrix(y_true, y_pred).tolist()

    metrics: Dict[str, object] = {
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "per_class": report,
        "confusion_matrix": cm,
    }

    if elevated_label_name and elevated_label_name in label_names:
        elevated_idx = label_names.index(elevated_label_name)
        elevated_recall = float(
            recall_score(
                np.array(y_true) == elevated_idx,
                np.array(y_pred) == elevated_idx,
                zero_division=0,
            )
        )
        metrics["elevated_class_recall"] = elevated_recall

    return metrics
