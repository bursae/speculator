from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import urldefrag, urljoin, urlparse


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalize_url(base_url: str, candidate: str) -> str | None:
    if not candidate:
        return None

    absolute = urljoin(base_url, candidate.strip())
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"}:
        return None

    cleaned, _fragment = urldefrag(absolute)
    return cleaned


def get_domain(url: str) -> str:
    return urlparse(url).netloc.lower()


def is_same_domain(url: str, seed_domain: str) -> bool:
    return get_domain(url) == seed_domain.lower()

