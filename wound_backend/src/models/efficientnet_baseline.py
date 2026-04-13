from typing import Tuple

import torch
from torch import nn
from torchvision.models import EfficientNet_B1_Weights, efficientnet_b1


class EfficientNetBaseline(nn.Module):
    def __init__(self, num_classes: int, pretrained: bool = True) -> None:
        super().__init__()
        weights = EfficientNet_B1_Weights.IMAGENET1K_V1 if pretrained else None
        backbone = efficientnet_b1(weights=weights)
        in_features = backbone.classifier[1].in_features
        backbone.classifier[1] = nn.Linear(in_features, num_classes)
        self.backbone = backbone

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)

    @torch.no_grad()
    def extract_embedding(self, x: torch.Tensor) -> torch.Tensor:
        features = self.backbone.features(x)
        pooled = self.backbone.avgpool(features)
        return torch.flatten(pooled, 1)


def build_efficientnet_b1(num_classes: int, pretrained: bool = True) -> Tuple[nn.Module, str]:
    model = EfficientNetBaseline(num_classes=num_classes, pretrained=pretrained)
    return model, "efficientnet_b1"
