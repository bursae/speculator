from __future__ import annotations

import argparse
import sys

from .storage import write_json


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="speculator", description="Speculator web crawler")
    subparsers = parser.add_subparsers(dest="command", required=True)

    crawl_parser = subparsers.add_parser("crawl", help="Crawl starting from a seed URL")
    crawl_parser.add_argument("--seed", required=True, help="Starting URL")
    crawl_parser.add_argument("--depth", required=True, type=int, help="Max crawl depth")
    crawl_parser.add_argument("--delay", type=float, default=1.0, help="Delay between requests (seconds)")
    crawl_parser.add_argument("--output", required=True, help="Output JSON file path")
    crawl_parser.add_argument(
        "--domain-lock",
        dest="domain_lock",
        action="store_true",
        default=True,
        help="Restrict crawling to seed domain (default: true)",
    )
    crawl_parser.add_argument(
        "--no-domain-lock",
        dest="domain_lock",
        action="store_false",
        help="Allow crawling across domains",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "crawl":
        from .crawler import crawl

        payload = crawl(
            seed=args.seed,
            depth=args.depth,
            delay=args.delay,
            domain_lock=args.domain_lock,
        )
        write_json(args.output, payload)
        return 0

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
