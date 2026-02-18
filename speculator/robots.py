from __future__ import annotations

from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests


class RobotsManager:
    def __init__(self, user_agent: str, timeout: float = 10.0) -> None:
        self.user_agent = user_agent
        self.timeout = timeout
        self._parsers: dict[str, RobotFileParser] = {}

    def _origin(self, url: str) -> str:
        p = urlparse(url)
        return f"{p.scheme}://{p.netloc}"

    def _load_parser(self, origin: str) -> RobotFileParser:
        if origin in self._parsers:
            return self._parsers[origin]

        robots_url = urljoin(origin, "/robots.txt")
        parser = RobotFileParser()
        parser.set_url(robots_url)
        try:
            response = requests.get(
                robots_url,
                headers={"User-Agent": self.user_agent},
                timeout=self.timeout,
            )
            if response.status_code == 200:
                parser.parse(response.text.splitlines())
            else:
                parser.parse([])
        except requests.RequestException:
            parser.parse([])

        self._parsers[origin] = parser
        return parser

    def can_fetch(self, url: str) -> bool:
        origin = self._origin(url)
        parser = self._load_parser(origin)
        return parser.can_fetch(self.user_agent, url)

