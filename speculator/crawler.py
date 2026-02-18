from __future__ import annotations

import time
from collections import deque

import requests

from .parser import parse_page
from .robots import RobotsManager
from .utils import get_domain, is_same_domain, normalize_url, utc_timestamp

DEFAULT_USER_AGENT = "Speculator/0.1 (Research Crawler; contact: you@example.com)"


def crawl(
    seed: str,
    depth: int,
    delay: float = 1.0,
    domain_lock: bool = True,
    user_agent: str = DEFAULT_USER_AGENT,
    timeout: float = 15.0,
) -> dict:
    normalized_seed = normalize_url(seed, seed)
    if not normalized_seed:
        raise ValueError(f"Invalid seed URL: {seed}")

    seed_domain = get_domain(normalized_seed)
    robots = RobotsManager(user_agent=user_agent, timeout=timeout)

    queue: deque[tuple[str, int]] = deque([(normalized_seed, 0)])
    visited: set[str] = set()
    pages: list[dict] = []

    headers = {"User-Agent": user_agent}

    while queue:
        url, current_depth = queue.popleft()

        if url in visited:
            continue
        if current_depth > depth:
            continue
        if domain_lock and not is_same_domain(url, seed_domain):
            continue
        if not robots.can_fetch(url):
            continue

        try:
            response = requests.get(url, headers=headers, timeout=timeout)
        except requests.RequestException:
            visited.add(url)
            continue

        if response.status_code != 200:
            visited.add(url)
            pages.append(
                {
                    "url": url,
                    "title": "",
                    "meta_description": "",
                    "headings": [],
                    "links": [],
                    "body_text": "",
                    "status": response.status_code,
                }
            )
            time.sleep(delay)
            continue

        content_type = response.headers.get("content-type", "")
        if "text/html" not in content_type.lower():
            visited.add(url)
            time.sleep(delay)
            continue

        page_record, discovered_links = parse_page(url, response.text)
        page_record["status"] = response.status_code
        pages.append(page_record)
        visited.add(url)

        if current_depth < depth:
            for link in discovered_links:
                if domain_lock and not is_same_domain(link, seed_domain):
                    continue
                if link in visited:
                    continue
                queue.append((link, current_depth + 1))

        time.sleep(delay)

    return {
        "metadata": {
            "seed": normalized_seed,
            "depth": depth,
            "crawl_timestamp": utc_timestamp(),
        },
        "pages": pages,
    }

