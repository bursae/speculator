# Speculator

Deterministic, polite, domain-bounded web crawler (MVP).

## Features

- Seed-based crawl with BFS traversal
- Configurable depth and request delay
- `robots.txt` checks per origin
- Domain lock enabled by default
- Structured JSON output
- Extracts title, meta description, H1-H3 headings, links, and cleaned body text

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Usage

```bash
speculator crawl \
  --seed https://example.com \
  --depth 2 \
  --delay 1 \
  --output results.json
```

Disable domain restriction:

```bash
speculator crawl \
  --seed https://example.com \
  --depth 2 \
  --delay 1 \
  --output results.json \
  --no-domain-lock
```

## Output Schema

```json
{
  "metadata": {
    "seed": "https://example.com",
    "depth": 2,
    "crawl_timestamp": "2026-02-17T22:00:00Z"
  },
  "pages": [
    {
      "url": "https://example.com/page1",
      "title": "Page Title",
      "meta_description": "Summary text",
      "headings": ["Heading 1", "Heading 2"],
      "links": ["https://example.com/page2"],
      "body_text": "Cleaned paragraph text...",
      "status": 200
    }
  ]
}
```
