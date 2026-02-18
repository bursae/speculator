from __future__ import annotations

import json
from pathlib import Path


def write_json(output_path: str, payload: dict) -> None:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

