from __future__ import annotations

from bs4 import BeautifulSoup

from .utils import normalize_url


def parse_page(url: str, html: str) -> tuple[dict, list[str]]:
    soup = BeautifulSoup(html, "html.parser")

    title_tag = soup.find("title")
    meta_tag = soup.find("meta", attrs={"name": "description"})
    heading_tags = soup.find_all(["h1", "h2", "h3"])

    title = title_tag.get_text(" ", strip=True) if title_tag else ""
    meta_description = meta_tag.get("content", "").strip() if meta_tag else ""
    headings = [tag.get_text(" ", strip=True) for tag in heading_tags if tag.get_text(strip=True)]

    links = []
    for link in soup.find_all("a", href=True):
        normalized = normalize_url(url, link["href"])
        if normalized:
            links.append(normalized)
    links = sorted(set(links))

    body = soup.body
    body_text = body.get_text(" ", strip=True) if body else soup.get_text(" ", strip=True)
    body_text = " ".join(body_text.split())

    record = {
        "url": url,
        "title": title,
        "meta_description": meta_description,
        "headings": headings,
        "links": links,
        "body_text": body_text,
    }
    return record, links

